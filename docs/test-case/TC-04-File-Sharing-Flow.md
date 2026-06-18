# TC-04 File Sharing Flow

**Use Case:** UC-11 File Sharing  
**Tested URL:** `/files`  
**Precondition:** Backend running on `localhost:8080`; at least two active user accounts exist (`user1`, `user2`); `user1` has at least one file uploaded (see TC-03).

---

## TC-04.1 — Share a file with a specific user

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` and navigate to `/files` | **My Files** list shows at least one file; **Shared with me** section is visible |
| 2 | Click **Share** next to a filename | Share panel expands below the file entry |
| 3 | Ensure **Make public** checkbox is unchecked | Username input field is visible |
| 4 | Enter `user2` in the username field | Field accepts input |
| 5 | Click **Share** | Share panel closes; a blue badge `user2` appears below the filename with a × button |
| 6 | Log in as `user2` and navigate to `/files` | The shared file appears in the **Shared with me** section with owner `user1` |

---

## TC-04.2 — Download a file shared with you

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete TC-04.1 | File is shared from `user1` to `user2` |
| 2 | Log in as `user2` and navigate to `/files` | Shared file visible in **Shared with me** |
| 3 | Click **Download** next to the shared file | Browser downloads the file via `/api/shared?owner=user1&file=filename` |
| 4 | Verify | Downloaded file content matches the original |

---

## TC-04.3 — Share a file publicly

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` and navigate to `/files` | My Files list shown |
| 2 | Click **Share** next to a file | Share panel expands |
| 3 | Check **Make public (everyone can access)** | Username input field disappears |
| 4 | Click **Share** | Blue badge `Public` appears below the filename |
| 5 | Log in as `user2` and navigate to `/files` | File appears in **Shared with me** with a green **public** badge and owner `user1` |
| 6 | Log in as any other user and navigate to `/files` | Same file also appears in their **Shared with me** section |

---

## TC-04.4 — Revoke a user-specific share

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete TC-04.1 | File shared with `user2`; blue `user2` badge visible |
| 2 | Log in as `user1` and navigate to `/files` | `user2` badge visible under the file |
| 3 | Click **×** on the `user2` badge | Badge disappears; file list refreshes |
| 4 | Log in as `user2` and navigate to `/files` | The previously shared file no longer appears in **Shared with me** |

---

## TC-04.5 — Revoke a public share

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete TC-04.3 | File shared publicly; `Public` badge visible |
| 2 | Log in as `user1` and navigate to `/files` | `Public` badge visible under the file |
| 3 | Click **×** on the `Public` badge | Badge disappears; file list refreshes |
| 4 | Log in as `user2` and navigate to `/files` | The file no longer appears in **Shared with me** |

---

## TC-04.6 — Share button disabled when no username entered

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` and navigate to `/files` | My Files list shown |
| 2 | Click **Share** next to a file | Share panel expands |
| 3 | Ensure **Make public** is unchecked and leave username field empty | — |
| 4 | Observe the **Share** button inside the panel | Button is grayed out and not clickable |
| 5 | Enter any text in the username field | Share button becomes active |

---

## TC-04.7 — Share with a non-existent user

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` and navigate to `/files` | My Files list shown |
| 2 | Click **Share** next to a file, enter a username that does not exist (e.g. `ghost`) | — |
| 3 | Click **Share** | Error message shown inside the share panel (backend returns an error response) |
| 4 | Verify | No badge is added; the file is not shared |

---

## TC-04.8 — Share the same file twice with the same user

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Complete TC-04.1 | File already shared with `user2` |
| 2 | Expand the share panel for the same file, enter `user2` again | — |
| 3 | Click **Share** | Error message shown (backend returns conflict/duplicate error) or second badge is not added |

---

## TC-04.9 — Multiple shares on one file

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` and navigate to `/files` | My Files list shown |
| 2 | Share one file with `user2` (TC-04.1) | `user2` badge shown |
| 3 | Share the same file publicly (TC-04.3) | Both `user2` and `Public` badges shown |
| 4 | Log in as `user2` and navigate to `/files` | File appears once in **Shared with me** |

---

## TC-04.10 — Files page unauthenticated

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open a private window (no session) | — |
| 2 | Navigate to `/files` | Redirected to `/login` |

---

## TC-04.11 — Download shared file when not authenticated

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Obtain a shared file download URL: `/api/shared?owner=user1&file=filename` | — |
| 2 | Open the URL in a private window (no session cookie) | Response: HTTP 401; file is not served |

---

## TC-04.12 — User cannot download a file not shared with them

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user2` | Authenticated |
| 2 | Manually request `/api/shared?owner=user1&file=privatefile` for a file `user1` has **not** shared | Response: HTTP 403 or 404; file is not downloaded |