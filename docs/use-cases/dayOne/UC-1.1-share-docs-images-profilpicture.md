# UC-1.1: Share Documents, Images & Profile Picture

## Status
**Design specification** — not yet implemented.
The current download endpoint (`GET /download/{username}`) forbids all cross-user
access. This UC defines what must be built to enable sharing.

## Description
An authenticated user can make individual files (documents, images) or their
profile picture visible to other users. Three visibility levels are supported:

| Level | Who can access |
|-------|---------------|
| **Private** (default) | Owner only |
| **Shared** | Specific other users named by the owner |
| **Public** | Any authenticated user |

The profile picture is a special case: it is always **public** among authenticated
users and does not require an explicit share action.

## Actors
- **Owner** — the authenticated user who uploads and shares files
- **Viewer** — another authenticated user who accesses a shared file
- **Admin** — user with `ROLE_ADMIN` (can access all files)

---

## Part A — Profile Picture (semi-public)

### Current problem
`GET /download/{username}` checks `username == loggedInUser` and returns `403`
for any other caller. This makes it impossible to display another user's avatar.

### Required change
Add a dedicated public avatar endpoint that any authenticated user can call:

```
GET /users/{username}/avatar
```

- No ownership check — any logged-in user may call it.
- Reads `uploads/{username}/` and returns the file stored as the profile picture.
- Returns `404` if no profile picture has been uploaded.

### Flow
1. User A views a page that shows User B's profile.
2. The frontend calls `GET /users/userB/avatar`.
3. The backend reads `uploads/userB/{profilePicture}` and returns the bytes.
4. The browser renders the image.

### Backend changes needed

```java
@GetMapping("/users/{username}/avatar")
public ResponseEntity<?> getAvatar(@PathVariable String username) {
    // No ownership check — any authenticated user may view avatars
    Optional<byte[]> data = fileService.downloadFile(username, "avatar"); // or lookup filename
    return data.map(bytes -> ResponseEntity.ok()
            .header("Content-Type", "image/jpeg")
            .body(bytes))
        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
}
```

### Database change needed
`Account` needs a `profile_picture` column so the backend knows which filename
is the avatar:

```sql
ALTER TABLE account ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL;
```

---

## Part B — Controlled File Sharing

### New entity: `SharedFile`

A file can be shared with specific users or made public. A new table tracks this:

```sql
CREATE TABLE shared_file (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner       VARCHAR(255) NOT NULL,
    filename    VARCHAR(255) NOT NULL,
    shared_with VARCHAR(255),          -- NULL means public to all authenticated users
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Meaning |
|--------|---------|
| `owner` | Username of the file owner |
| `filename` | Original filename in `uploads/{owner}/` |
| `shared_with` | Target username, or `NULL` for public |

### New endpoints

#### Share a file
```
POST /share/{filename}
Body: { "sharedWith": "userB" }   // omit for public
Auth: Bearer token (owner only)
201 Created  — share record created
404 Not Found — file does not exist in owner's folder
409 Conflict  — already shared with this user
```

#### List my shares
```
GET /share
Auth: Bearer token
200 OK — array of shared file records
```

#### Access a shared file
```
GET /shared/{ownerUsername}?file={filename}
Auth: Bearer token
200 OK   — file bytes (if viewer is listed in shared_file or file is public)
403 Forbidden — not shared with this user
404 Not Found — file or share record not found
```

#### Revoke a share
```
DELETE /share/{filename}?sharedWith={username}
Auth: Bearer token (owner only)
200 OK   — share revoked
404 Not Found — share record not found
```

---

## Part C — Admin Access

The `account` table now has a `role` column (`ROLE_USER` / `ROLE_ADMIN`).
Admins should be able to access all files regardless of sharing settings.

```java
// FileUploadController — download
String loggedInUser = SecurityContextHolder.getContext().getAuthentication().getName();
boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
        .getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

if (!username.equals(loggedInUser) && !isAdmin) {
    // check shared_file table before returning 403
}
```

---

## Security Considerations

### Ownership check on upload
Always enforce that the uploader matches the path variable — already done in
`FileUploadController`. Never relax this.

### Path traversal
Filenames must be validated before being used in filesystem paths.
A filename like `../../etc/passwd` would escape the uploads directory.

```java
// Reject filenames with path separators
if (filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
    return ResponseEntity.status(400).body("Invalid filename.");
}
```

### MIME type validation
Only allow safe MIME types for shared files to prevent XSS via uploaded HTML/SVG.

```java
if (!file.getContentType().startsWith("image/") &&
    !file.getContentType().equals("application/pdf")) {
    return ResponseEntity.status(415).build();
}
```

### `Content-Disposition` header
Always serve downloaded files with `Content-Disposition: attachment` to prevent
the browser from executing HTML or SVG files inline.

```java
.header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
```

---

## Frontend Changes Needed

| Feature | Page | Action |
|---------|------|--------|
| Display other users' avatars | Any page showing users | `GET /users/{username}/avatar` via Route Handler proxy |
| Share a file | `/profile` or new `/files` page | Button → `POST /share/{filename}` |
| List shared files | `/files` page | `GET /share` |
| View a file shared with me | `/files` page | `GET /shared/{owner}?file={filename}` via Route Handler |
| Revoke a share | `/files` page | `DELETE /share/{filename}` |

All download calls still go through a **Next.js Route Handler** proxy
(see UC-06) because the JWT token is in an HTTP-only cookie.

---

## Database Summary

```
account
  id, username, password_hash, email, role, token, profile_picture (NEW)

shared_file (NEW TABLE)
  id, owner, filename, shared_with (nullable = public), created_at
```

## Related
- Previous: `UC-06-display-profile-picture.md`
- Depends on: `UC-04-load-profile-picture-by-registering.md`
- Security: `EX-3.7-Security-aspects.md`, `EX-10.2-3.7-Security-aspects2.md`