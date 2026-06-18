# TC-01 Login Flow

**Use Case:** UC-03 Login  
**Tested URL:** `/login`  
**Precondition:** Backend running on `localhost:8080`; at least one active user account exists.

---

## Automation

**Framework:** Playwright  
**Test file:** `tests/tc-01-login.spec.ts`  
**Config:** `playwright.config.ts` — baseURL `http://localhost:3000`, Chromium, 1 worker

**Test credentials** (seeded via `data.sql`):

| Username | Password     | Role       |
|----------|-------------|------------|
| `user1`  | `password123` | ROLE_ADMIN |
| `user2`  | `123456`      | ROLE_USER  |

**Run all tests** (dev server + backend must be running):
```bash
npm run test:e2e
```

**Run with interactive UI:**
```bash
npm run test:e2e:ui
```

**Run TC-01.5 only** (stop the backend first, then):
```bash
npx playwright test --grep "TC-01.5"
```

**Backend requirement per test:**

| Test | Backend needed | Technique |
|------|---------------|-----------|
| TC-01.1 | ✅ | Real login → checks redirect to `/` |
| TC-01.2 | ✅ | Real 401 response → checks error banner |
| TC-01.3 | ❌ | Client-side validation only |
| TC-01.4 | ❌ | Client-side validation only |
| TC-01.5 | ❌ | `page.route()` aborts the signIn request |
| TC-01.6 | ❌ | Fresh browser context, no cookie set |
| TC-01.7 | ✅ | Login → reload → navigate to `/profile` |
| TC-01.8 | ❌ | `?activated=true` query parameter only |

---

## TC-01.1 — Successful login with valid credentials

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form is shown with username and password fields and a "Sign in" button |
| 2 | Enter a valid username | Field accepts input, no error shown |
| 3 | Enter the correct password | Field accepts input (masked) |
| 4 | Click **Sign in** | Button shows "Signing in…" while the request is pending |
| 5 | (automatic) | Redirected to `/` (home page) |

**Pass criteria:** User lands on `/` and is authenticated (protected pages are accessible).

---

## TC-01.2 — Login with wrong password

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form is shown |
| 2 | Enter a valid username and a **wrong** password | — |
| 3 | Click **Sign in** | Red error banner: "Invalid username or password." |
| 4 | Verify | User stays on `/login`, no redirect |

---

## TC-01.3 — Login with empty username

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form is shown |
| 2 | Leave username empty, enter any password | — |
| 3 | Click **Sign in** | Inline field error: "Username is required." No request is sent to the backend |

---

## TC-01.4 — Login with empty password

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form is shown |
| 2 | Enter a valid username, leave password empty | — |
| 3 | Click **Sign in** | Inline field error: "Password is required." No request is sent to the backend |

---

## TC-01.5 — Login when backend is unreachable

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Stop the backend (`localhost:8080`) | — |
| 2 | Navigate to `/login` | Login form is shown |
| 3 | Enter valid credentials and click **Sign in** | Red error banner: "Could not reach the server. Please try again." |

---

## TC-01.6 — Redirect to login when accessing protected route unauthenticated

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Make sure no session cookie is set (e.g. private window) | — |
| 2 | Navigate directly to `/profile` | Redirected to `/login` |
| 3 | Navigate directly to `/files` | Redirected to `/login` |

---

## TC-01.7 — Session persists after page reload

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in successfully (TC-01.1) | On home page |
| 2 | Reload the browser (F5 / Cmd+R) | Still on home page, still authenticated |
| 3 | Navigate to `/profile` | Profile page loads without redirect to login |

---

## TC-01.8 — Activation banner shown after registration confirmation

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete the double-opt-in registration flow | — |
| 2 | Click the activation link (redirects to `/login?activated=true`) | Green banner: "Account activated — you can now sign in." |
| 3 | Log in with the new account credentials | Redirected to `/` |