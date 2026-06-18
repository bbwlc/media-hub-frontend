# TC-02 Register Flow

**Use Case:** UC-01 Register  
**Tested URLs:** `/register`, `/register/confirm/[token]`  
**Precondition:** Backend running on `localhost:8080`; the username used in each test does not already exist (unless stated otherwise).

---

## TC-02.1 — Successful registration (double-opt-in flow)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Registration form shown with username, password, confirm password, and email fields |
| 2 | Enter a unique username | Field accepts input |
| 3 | Enter a valid password | Field accepts input (masked) |
| 4 | Enter the same password in **Confirm password** | Field accepts input (masked) |
| 5 | Enter a valid email address | Field accepts input |
| 6 | Click **Create account** | Form submits; page switches to "Check your email" confirmation view with 📬 icon |
| 7 | (Dev mode) Copy the activation link from the backend console | Activation link is printed to the backend console |
| 8 | Open the activation link in the browser | Redirected to `/register/confirm/[token]`; page shows ✅ "Account activated!" with a "Sign in" button |
| 9 | Click **Sign in** | Redirected to `/login?activated=true`; green banner "Account activated — you can now sign in." is shown |

**Pass criteria:** User can now log in with the new credentials.

---

## TC-02.2 — Empty username

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Leave username empty; fill all other fields correctly | — |
| 3 | Click **Create account** | Inline field error: "Username is required." No request sent to backend |

---

## TC-02.3 — Empty password

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Leave password empty; fill all other fields correctly | — |
| 3 | Click **Create account** | Inline field error: "Password is required." No request sent to backend |

---

## TC-02.4 — Empty confirm password

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Leave confirm password empty; fill all other fields correctly | — |
| 3 | Click **Create account** | Inline field error: "Please confirm your password." No request sent to backend |

---

## TC-02.5 — Passwords do not match (client-side)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Enter a password; enter a **different** value in confirm password | — |
| 3 | Click **Create account** | Inline field error: "Passwords do not match." No request sent to backend |

---

## TC-02.6 — Invalid email format

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Enter `notanemail` in the email field; fill all other fields correctly | — |
| 3 | Click **Create account** | Inline field error: "Please enter a valid email address." No request sent to backend |

---

## TC-02.7 — Empty email

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Leave email empty; fill all other fields correctly | — |
| 3 | Click **Create account** | Inline field error: "Email is required." No request sent to backend |

---

## TC-02.8 — Username already taken

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Enter a username that **already exists** in the system | — |
| 3 | Fill all other fields correctly and click **Create account** | Red error banner: "Username is already taken." |

---

## TC-02.9 — Registration when backend is unreachable

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Stop the backend (`localhost:8080`) | — |
| 2 | Navigate to `/register` and fill all fields correctly | — |
| 3 | Click **Create account** | Red error banner: "Could not reach the server. Please try again." |

---

## TC-02.10 — Activation link used twice (already used / invalid)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete TC-02.1 up to and including step 8 (first activation) | Account activated |
| 2 | Open the same activation link again in the browser | Page shows ❌ "Invalid link" with message "This activation link is not valid or has already been used." and a "Register again" link |

---

## TC-02.11 — Expired activation link

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Register a new account (TC-02.1 steps 1–6) | "Check your email" screen shown |
| 2 | Wait for the token to expire (backend validity: 24 h) or use an expired token directly | — |
| 3 | Open the expired activation link | Page shows ⏰ "Link expired" with message "valid for 24 hours" and a "Register again" link |

---

## TC-02.12 — Navigation back to login from registration form

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Form shown |
| 2 | Click **Sign in** link at the bottom of the form | Redirected to `/login` |