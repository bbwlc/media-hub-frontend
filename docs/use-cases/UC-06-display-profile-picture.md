# UC-06: Display Profile Picture

## Description
After a user has uploaded a profile picture (UC-04), the image is displayed on the
profile page and on the home page. Because the backend download endpoint requires a
JWT token, the browser cannot request the image directly. A Next.js Route Handler
acts as a server-side proxy: it reads the HTTP-only cookies, fetches the image from
the backend, and returns the bytes to the browser.

## Actor
Authenticated user who has previously uploaded a profile picture

## Preconditions
- The user is logged in (`token` cookie is set — UC-03).
- The user has uploaded a profile picture (`profilePicture` cookie holds the filename — UC-04).
- The file exists at `uploads/{username}/{filename}` on the backend server.

## Flow

```
Browser                Next.js Route Handler          Spring Boot Backend
  |                           |                               |
  |-- GET /api/profile-picture-->                             |
  |                    read cookies:                          |
  |                    token, profilePicture                  |
  |                    decode username from JWT               |
  |                           |-- GET /download/{username}    |
  |                           |   ?file={filename}            |
  |                           |   Authorization: Bearer token |
  |                           |                               |
  |                           |<------ 200 OK (bytes) --------|
  |<-- 200 OK (image bytes) --|                               |
  | (Content-Type: image/jpeg)                                |
```

## Main Flow
1. The browser (or Next.js Server Component) renders `<img src="/api/profile-picture">`.
2. The browser sends `GET /api/profile-picture` to the Next.js server.
3. The Route Handler reads the `token` and `profilePicture` cookies.
4. The Route Handler decodes the username from the JWT payload.
5. The Route Handler calls `GET http://localhost:8080/download/{username}?file={filename}`
   with `Authorization: Bearer <token>`.
6. The backend verifies that `{username}` matches the authenticated user,
   reads the file from disk, and returns the bytes.
7. The Route Handler forwards the bytes to the browser with the original `Content-Type`.
8. The browser renders the image.

## Alternative Flows

### A — No profile picture uploaded yet
- At step 3: `profilePicture` cookie is absent.
- The Route Handler returns `404 Not Found`.
- The frontend shows a fallback avatar (first letter of the username).

### B — User not logged in
- At step 3: `token` cookie is absent or JWT cannot be decoded.
- The Route Handler returns `401 Unauthorized`.
- The frontend shows the fallback avatar.

### C — File missing on disk
- At step 6: `FileService` cannot find the file.
- The backend returns `404 Not Found`.
- The Route Handler forwards the `404` to the browser.
- The frontend shows the fallback avatar (broken image handled by CSS).

### D — Backend unreachable
- At step 5: `fetch` throws a network error.
- The Route Handler returns `502 Bad Gateway`.

## Why a Route Handler is needed

The backend `GET /download/{username}` endpoint requires an
`Authorization: Bearer <token>` header. The token is stored in an **HTTP-only
cookie**, which JavaScript and `<img src>` requests cannot access. The Route
Handler runs on the Next.js server where `cookies()` from `next/headers` can
read HTTP-only cookies, making it the only place that can bridge the two.

```
Browser  ──────  <img src="/api/profile-picture">  ──────  Next.js Route Handler
                        (no auth header needed)             (reads httpOnly cookie,
                                                             adds Bearer header)
                                                                     │
                                                          Spring Boot /download/...
```

## Endpoint

### GET /api/profile-picture (Next.js Route Handler)
| Field         | Value                                     |
|---------------|-------------------------------------------|
| Method        | `GET`                                     |
| Path          | `/api/profile-picture`                    |
| Auth          | None — reads `token` cookie automatically |
| `200`         | Image bytes, `Content-Type` from backend  |
| `401`         | Token missing or invalid                  |
| `404`         | No `profilePicture` cookie or file not found |
| `502`         | Backend unreachable                       |
| `Cache-Control` | `private, max-age=60`                  |

### GET /download/{username} (Spring Boot — called by the Route Handler)
| Field   | Value                                      |
|---------|--------------------------------------------|
| Method  | `GET`                                      |
| Path    | `/download/{username}`                     |
| Auth    | `Authorization: Bearer <token>`            |
| Param   | `file` (query string — original filename)  |
| `200`   | File bytes                                 |
| `403`   | Path username ≠ logged-in user             |
| `404`   | File not found on disk                     |

## Cookie: `profilePicture`

Set by the upload Server Action (UC-04) immediately after a successful upload.

| Property   | Value                        |
|------------|------------------------------|
| Name       | `profilePicture`             |
| Value      | Original filename (e.g. `avatar.jpg`) |
| `httpOnly` | `true`                       |
| `path`     | `/`                          |
| Expiry     | Session (no `maxAge` set)    |

## Where the picture is displayed

| Location | Component | Source used |
|----------|-----------|-------------|
| `/profile` page — on load | `UploadForm` (Client) | `/api/profile-picture` |
| `/profile` page — immediately after upload | `UploadForm` (Client) | `URL.createObjectURL` (blob, instant) |
| `/` home page | `page.tsx` (Server Component) | `/api/profile-picture` |

### Fallback avatar
When no picture is available, a circular div shows the first letter of the username:
```tsx
<div className="h-10 w-10 rounded-full bg-zinc-100 ...">
  {username[0].toUpperCase()}
</div>
```

## Postconditions
- The profile picture is visible on the profile page and the home page.
- After a new upload, the blob URL displays the image instantly (no round-trip).
- On the next page load, `/api/profile-picture` fetches the persisted image from the backend.

## Limitations
- The `profilePicture` cookie stores only the filename, not the path.
  If a user uploads multiple files only the last filename is remembered.
- The cookie has no `maxAge` — it is a session cookie and is lost when the browser
  is closed. A `maxAge` matching the JWT expiry (3600 s) would be more consistent.
- The `Account` entity has no `profilePicturePath` column.
  A proper solution would persist the filename in the database.

## Related
- Previous: `UC-05-sign-out.md`
- Depends on: `UC-04-load-profile-picture-by-registering.md`