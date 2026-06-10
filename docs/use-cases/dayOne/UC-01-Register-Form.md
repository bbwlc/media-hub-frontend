# UC-01: Register Form

## Description
A new user creates an account by filling in a registration form with a username, password, and email address.  
The frontend collects the data, validates it client-side, and submits it to the backend.

## Actor
Unauthenticated user

## Preconditions
- The user is not already logged in.
- The backend is reachable at its configured base URL.

## UI Elements

| Field      | Type             | Required | Notes                              |
|------------|------------------|----------|------------------------------------|
| Username   | `<input text>`   | Yes      | Must not be empty                  |
| Password   | `<input password>` | Yes    | Must not be empty                  |
| Email      | `<input email>`  | Yes      | Must match basic e-mail format     |
| Submit     | `<button>`       | —        | Disabled while request is in flight |

## Main Flow
1. User navigates to the register page (e.g. `/register`).
2. User fills in all three fields and submits the form.
3. The frontend validates the inputs (see *Client-Side Validation* below).
4. The frontend sends `POST /auth/register` with a JSON body to the backend.
5. The backend responds with `201 Created`.
6. The frontend redirects the user to the login page (e.g. `/login`) and optionally shows a success message.

## Alternative Flows

### A — Username already taken
- At step 5: backend responds with `409 Conflict`.
- The frontend displays an inline error: *"Username is already taken."*
- No redirect; the form remains editable.

### B — Client-side validation fails
- At step 3: one or more fields are invalid (empty, bad e-mail format, etc.).
- The frontend shows inline field errors and does **not** submit the request.

### C — Network / server error
- At step 5: the backend responds with `5xx` or the request fails entirely.
- The frontend shows a generic error: *"Something went wrong. Please try again."*

## Client-Side Validation

| Field    | Rule                              | Error message                        |
|----------|-----------------------------------|--------------------------------------|
| Username | Not empty                         | *"Username is required."*            |
| Password | Not empty                         | *"Password is required."*            |
| Email    | Not empty + valid e-mail format   | *"A valid e-mail address is required."* |

## API Call

| Field    | Value                          |
|----------|--------------------------------|
| Method   | `POST`                         |
| Path     | `/auth/register`               |
| Auth     | None required                  |
| Body     | `application/json`             |
| Success  | `201 Created`                  |
| Conflict | `409 Conflict`                 |

### Request body
```json
{
  "username": "user1",
  "password": "password123",
  "email": "user1@example.com"
}
```

## Postconditions
- On success: the user is redirected to `/login` and can immediately sign in with the new credentials.
- The form is cleared / unmounted after a successful submission.
- No JWT token is issued by this flow (registration only; login is a separate step).

## Related
- Backend use case: `../../../media-hub-backend/docs/use-cases/UC-01-register.md`
- Next use case: UC-02 Login Form