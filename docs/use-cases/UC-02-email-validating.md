# UC-02: Email Validation

## Description
After a user submits the registration form, their account is not yet active.
A unique activation token is generated and a link is printed to the server console
(fake mail service). The user opens the link, the frontend calls the backend, and
the account is persisted only on success.

## Actor
Newly registered (unactivated) user

## Preconditions
- UC-01 (Register Form) completed successfully — the registration data is held
  in the backend's in-memory `pending` map under a UUID token.
- The user has access to the activation link (dev: backend console output).

## Flow

```
Browser           Frontend (/activate)     Backend (/auth/activate)     Database
  |                       |                          |                      |
  |-- GET /activate?token=<uuid> ---------->         |                      |
  |                       |-- GET /auth/activate?token=<uuid> -->           |
  |                       |                 pending.remove(token)           |
  |                       |                          |-- save(account) ---> |
  |                       |<-------- 200 OK ---------|                      |
  |<-- redirect /login?activated=true                |                      |
```

### Main Flow
1. Backend prints `http://localhost:3000/activate?token=<uuid>` to the console.
2. User opens the link in the browser.
3. The frontend Server Component reads `token` from the URL search params.
4. The frontend calls `GET http://localhost:8080/auth/activate?token=<uuid>`.
5. The backend looks up the token in `pending`, removes it, and saves the `Account`
   to the database via `toActivatedUser(dto)`.
6. The backend returns `200 OK`.
7. The frontend redirects the user to `/login?activated=true`.
8. The login page shows a green "Account activated" banner.

## Alternative Flows

### A — Invalid or already-used token
- At step 5: `pending.remove(token)` returns `null`.
- The backend returns `400 Bad Request`.
- The frontend shows an "Invalid link" error screen.

### B — Missing token in URL
- At step 3: `token` search param is absent.
- The frontend skips the backend call and shows the "Invalid link" screen immediately.

### C — Backend unreachable
- At step 4: `fetch` throws a network error.
- The frontend shows the "Invalid link" error screen.

## Endpoints

### POST /auth/register (changed from UC-01)
Account is **not** yet saved to the DB — only stored in `pending`.

| Field    | Value                                        |
|----------|----------------------------------------------|
| Method   | `POST`                                       |
| Path     | `/auth/register`                             |
| `201`    | Token stored, activation link printed        |
| `400`    | Any field is null or blank                   |
| `409`    | Username already taken                       |
| `500`    | Unexpected server error                      |

### GET /auth/activate
| Field   | Value                  |
|---------|------------------------|
| Method  | `GET`                  |
| Path    | `/auth/activate`       |
| Auth    | None required          |
| Param   | `token` (query string) |
| Success | `200 OK`               |
| Invalid | `400 Bad Request`      |

## Backend Implementation Notes

```java
// In-memory store (lost on restart — intentional for dev/fake-mail)
private final ConcurrentHashMap<String, RegisterDto> pending = new ConcurrentHashMap<>();

// Register: validate input, store pending, print fake link
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterDto dto) {
    if (dto.username() == null || dto.username().isBlank() ||
        dto.password() == null || dto.password().isBlank() ||
        dto.email()    == null || dto.email().isBlank()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();      // 400
    }
    if (accountRepository.existsByUsername(dto.username())) {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();          // 409
    }
    try {
        String token = UUID.randomUUID().toString();
        pending.put(token, dto);
        System.out.println("Aktivierung: http://localhost:3000/activate?token=" + token);
        return ResponseEntity.status(HttpStatus.CREATED).build();           // 201
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500
    }
}

// Activate: validate token, persist account
@GetMapping("/activate")
public ResponseEntity<?> activate(@RequestParam String token) {
    var dto = pending.remove(token);
    if (dto == null) return ResponseEntity.status(400).build();
    accountRepository.save(toActivatedUser(dto));
    return ResponseEntity.ok().build();
}
```

## Frontend Error Handling (`actions.ts`)

| Status | Message shown to user                    |
|--------|------------------------------------------|
| `201`  | — (success → "check your email" screen) |
| `400`  | "Invalid registration data."             |
| `409`  | "Username is already taken."             |
| `500`  | "Server error. Please try again later."  |
| other  | "Unexpected error. Please try again."    |

## Frontend Pages

| Route       | Type             | Responsibility                                      |
|-------------|------------------|-----------------------------------------------------|
| `/register` | Client Component | Shows "check your email" screen after `201 Created` |
| `/activate` | Server Component | Calls backend, redirects to `/login?activated=true` |
| `/login`    | Client Component | Shows green "Account activated" banner if redirected |

## Postconditions
- A new `Account` row exists in the database with a BCrypt-hashed password.
- The activation token is removed from `pending` and cannot be reused.
- The plain-text password is never stored.

## Limitations (Dev / Fake-Mail)
- The `pending` map is in-memory: tokens are lost on server restart.
- There is no token expiry — a token stays valid until the server restarts.
- The "email" is only printed to the console; no real mail is sent.

## Related
- Previous: `UC-01-Register-Form.md`
- Next: UC-03 Login Form