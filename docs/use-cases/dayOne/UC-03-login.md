# UC-03: Login

## Description
An activated user signs in with their username and password.
The backend verifies the credentials, generates a JWT token, and returns it.
The frontend stores the token for use in subsequent authenticated requests.

## Actor
Activated, unauthenticated user

## Preconditions
- The user has completed UC-01 (Register) and UC-02 (Email Validation).
- The account exists in the database with a BCrypt-hashed password.

## Main Flow
1. User navigates to `/login`.
2. User enters username and password and submits the form.
3. The frontend validates the inputs client-side (not empty).
4. The frontend sends `POST /auth/signIn` with a JSON body.
5. The backend looks up the account by username.
6. The backend verifies the password against the stored BCrypt hash.
7. The backend generates a signed JWT (HS256, 1 hour expiry) and saves it to `account.token`.
8. The backend responds with `200 OK` and `{ "token": "..." }`.
9. The frontend stores the token in an **HTTP-only cookie** and redirects to the home page.

## Alternative Flows

### A — Wrong credentials
- At step 6: username not found or password does not match.
- The backend returns `401 Unauthorized` with body `"invalid username or password!"`.
- The frontend shows an inline error: *"Invalid username or password."*

### B — Client-side validation fails
- At step 3: username or password field is empty.
- The frontend shows inline field errors and does **not** submit the request.

### C — Network / server error
- At step 5: request fails or backend returns `5xx`.
- The frontend shows a generic error: *"Could not reach the server. Please try again."*

## Endpoint

| Field   | Value               |
|---------|---------------------|
| Method  | `POST`              |
| Path    | `/auth/signIn`      |
| Auth    | None required       |
| `200`   | Credentials valid — JWT returned |
| `401`   | Wrong username or password       |

### Request body (`AuthenticationData`)
```json
{
  "username": "user1",
  "password": "password123"
}
```

### Response body (`TokenData`) — `200 OK`
```json
{
  "token": "<jwt>"
}
```

## JWT Details

| Property   | Value                          |
|------------|--------------------------------|
| Algorithm  | HS256                          |
| Subject    | username                       |
| Issued at  | time of sign-in                |
| Expiry     | 1 hour after sign-in           |
| Storage    | `account.token` column (DB) + HTTP-only browser cookie |

The token is also persisted in `account.token` so the server can invalidate it on sign-out (UC-04).

## Token Cookie

The Next.js Server Action stores the JWT in a browser cookie with the following flags:

```typescript
cookieStore.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 3600,
})
```

| Cookie flag | Value | Effect |
|-------------|-------|--------|
| `httpOnly`  | `true` | JavaScript in the browser **cannot read it** — `document.cookie` never sees it. Blocks XSS token theft. |
| `secure`    | `true` in production | Cookie is only transmitted over HTTPS. |
| `path`      | `/` | Sent on every request to this origin. |
| `maxAge`    | `3600` | Browser deletes it automatically after 1 hour, matching the JWT expiry. |

**Who can access the token:**

| Consumer | Access | How |
|----------|--------|-----|
| Next.js Server Actions / Server Components | ✅ | `await cookies()` from `next/headers` |
| Browser (automatic) | ✅ | Sent as a cookie header on every request |
| Client-side JavaScript | ❌ | Blocked by `httpOnly` |
| Spring Boot backend (directly) | ❌ | Never sees the cookie — Next.js reads it and forwards as `Authorization: Bearer <token>` |

## UI Elements

| Field    | Type               | Required |
|----------|--------------------|----------|
| Username | `<input text>`     | Yes      |
| Password | `<input password>` | Yes      |
| Submit   | `<button>`         | —        |

## Frontend Error Handling

| Status / Condition | Message shown to user                        |
|--------------------|----------------------------------------------|
| `200`              | — (redirect to home)                         |
| `401`              | "Invalid username or password."              |
| Network error      | "Could not reach the server. Please try again." |

## Postconditions
- The JWT is stored in an HTTP-only browser cookie — invisible to JavaScript, automatically sent on every request to the Next.js server.
- The Next.js server reads the cookie and forwards the token as `Authorization: Bearer <token>` when calling the Spring Boot backend.
- `account.token` in the database holds the current token (used by sign-out to invalidate it).

## Related
- Previous: `UC-02-email-validating.md`
- Next: UC-04 Sign Out