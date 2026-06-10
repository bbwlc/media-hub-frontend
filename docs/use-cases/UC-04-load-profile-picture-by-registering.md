# UC-04: Load Profile Picture by Registering

## Description
After completing registration and logging in, the user uploads a profile picture.
The backend saves the file to a per-user folder on disk.
The upload requires a valid JWT token — only the authenticated user can write to their own folder.

## Actor
Authenticated user (completed UC-01 → UC-02 → UC-03)

## Preconditions
- The user is logged in and holds a valid JWT token (set as `token` cookie by UC-03).
- The account exists in the database.

## Main Flow
1. User navigates to the profile picture upload page.
2. User selects an image file and submits the form.
3. The frontend sends `POST /upload/{username}` with:
   - `multipart/form-data` body containing the file under key `file`
   - `Authorization: Bearer <token>` header
4. The backend verifies that the path `{username}` matches the authenticated user.
5. The backend creates `uploads/{username}/` if it does not exist.
6. The backend saves the file at `uploads/{username}/{originalFilename}`.
7. The backend responds `200 OK` with the stored file path.
8. The frontend shows a success confirmation.

## Alternative Flows

### A — User tries to upload to another user's folder
- At step 4: `{username}` does not match the logged-in user.
- The backend returns `403 Forbidden` with body `"You are only allowed to upload to your own folder."`.
- The frontend shows an inline error.

### B — File save fails (IO error / null filename)
- At step 6: `IOException` or `NullPointerException` is caught.
- The backend returns `500 Internal Server Error`.
- The frontend shows a generic error.

### C — No file selected
- At step 2: the user submits without choosing a file.
- The frontend validates and prevents submission.

### D — Unauthenticated request
- At step 3: JWT token is missing or expired.
- The `JWTAuthenticationFilter` returns `401 Unauthorized` before the controller is reached.
- The frontend redirects the user to `/login`.

## Endpoints

### POST /upload/{username}
| Field      | Value                               |
|------------|-------------------------------------|
| Method     | `POST`                              |
| Path       | `/upload/{username}`                |
| Auth       | `Authorization: Bearer <token>`     |
| Body       | `multipart/form-data`, key `file`   |
| `200`      | File saved — response body is the stored path |
| `403`      | Path username ≠ logged-in user      |
| `500`      | IO error or null filename           |

### GET /download/{username}
| Field      | Value                               |
|------------|-------------------------------------|
| Method     | `GET`                               |
| Path       | `/download/{username}`              |
| Auth       | `Authorization: Bearer <token>`     |
| Param      | `file` (query string — filename)    |
| `200`      | File bytes returned                 |
| `403`      | Path username ≠ logged-in user      |
| `404`      | File not found on disk              |

## Backend Implementation Notes

```java
// File is stored at: uploads/{username}/{originalFilename}
Path userFolder = Paths.get(basePath, "uploads", username);
Files.createDirectories(userFolder);
Path filePath = userFolder.resolve(file.getOriginalFilename());
file.transferTo(filePath.toFile());
```

> **Known bug — `downloadFile`:** the path is built as
> `Paths.get(basePath, "uploads", filename)` — the `username` subdirectory is
> missing. It should be `Paths.get(basePath, "uploads", username, filename)`.
> Until fixed, downloads will always return `404 Not Found`.

> **Security config note:** `/upload/**` is currently listed under `permitAll()`
> in `SecurityConfig`, but the controller enforces authentication by reading
> `SecurityContextHolder` directly. The `permitAll` entry should be removed and
> replaced with `.authenticated()` to reflect the actual requirement.

## Frontend Responsibilities

| Step | Action |
|------|--------|
| Read JWT from `token` cookie | Include `Authorization: Bearer <token>` in the request |
| File input validation | Ensure a file is selected before submitting |
| Content type | Send `multipart/form-data` — do **not** set `Content-Type` manually (the browser sets the boundary) |
| On `200` | Show success message with filename |
| On `403` | Show "You can only upload to your own folder." |
| On `401` | Redirect to `/login` |
| On `500` | Show "Upload failed. Please try again." |

## Postconditions
- The image file exists at `uploads/{username}/{originalFilename}` on the backend server.
- The `Account` entity does **not** yet store a reference to the file
  (no `profilePicturePath` column) — file lookup relies on knowing the filename.

## Related
- Previous: `UC-03-login.md`
- Next: UC-05 Display Profile Picture