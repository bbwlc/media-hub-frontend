# TC-03 Upload Flow

**Use Case:** UC-10 File Upload  
**Tested URLs:** `/profile`, `/files`  
**Precondition:** Backend running on `localhost:8080`; user is logged in (valid session cookie present).

---

## TC-03.1 — Successful image upload (sets profile picture)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/profile` | Profile page shown; avatar area displays either the current picture or the user's initial letter |
| 2 | Click **Choose file** | OS file picker opens; all file types are selectable |
| 3 | Select a JPEG or PNG image file (< 20 MB) | File picker closes; selected filename appears in the input; image preview is shown below the label; **Upload** button becomes active |
| 4 | Click **Upload** | Button shows "Uploading…" while the request is pending |
| 5 | (automatic) | Success banner: `"filename.jpg" uploaded successfully.`; avatar area updates to show the new profile picture |
| 6 | Navigate to `/files` | Uploaded filename appears in the **My Files** list |

**Pass criteria:** Profile picture is updated and the file is visible in the file manager.

---

## TC-03.2 — Successful non-image file upload (PDF, ZIP, etc.)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/profile` | Profile page shown |
| 2 | Click **Choose file** and select a non-image file (e.g. `document.pdf`) | File picker closes; filename appears in input; **no image preview** is shown; **Upload** button becomes active |
| 3 | Click **Upload** | Button shows "Uploading…" |
| 4 | (automatic) | Success banner: `"document.pdf" uploaded successfully.`; avatar area is unchanged (non-image does not update profile picture) |
| 5 | Navigate to `/files` | `document.pdf` appears in the **My Files** list |

---

## TC-03.3 — Upload button disabled before file is selected

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/profile` | Profile page shown |
| 2 | Do **not** select a file | **Upload** button is grayed out and not clickable |
| 3 | Click **Choose file**, then cancel the file picker | **Upload** button remains grayed out |
| 4 | Click **Choose file** and select a file | **Upload** button becomes active |

---

## TC-03.4 — Upload file exceeding 20 MB limit

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Navigate to `/profile` | Profile page shown |
| 2 | Select a file larger than 20 MB | File appears selected in input; Upload button becomes active |
| 3 | Click **Upload** | Error banner shown: "Upload failed. Please try again." (backend rejects with 413 or 500) |
| 4 | Verify | No file is added to `/files` |

---

## TC-03.5 — Upload when not authenticated

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Clear the session cookie (or open a private window) | — |
| 2 | Navigate to `/profile` | Redirected to `/login` |

---

## TC-03.6 — Upload when backend is unreachable

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Stop the backend (`localhost:8080`) | — |
| 2 | Navigate to `/profile` and select any file | Upload button becomes active |
| 3 | Click **Upload** | Error banner: "Could not reach the server. Please try again." |

---

## TC-03.7 — Upload attempt to another user's folder (authorization)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Log in as `user1` | Authenticated as user1 |
| 2 | Manually craft a request to `POST /upload/user2` with a valid file | Backend returns HTTP 403 |
| 3 | Verify via the frontend action | Error banner: "You are not allowed to upload to this folder." |

*Note: This scenario is only reachable by bypassing the frontend (e.g. via curl or browser DevTools), since the UI always uploads to the logged-in user's own folder.*

---

## TC-03.8 — Profile picture displays correctly after upload

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Upload a valid image file (TC-03.1) | Success banner shown; avatar updates immediately (blob URL preview) |
| 2 | Reload the page (`Cmd+R` / `F5`) | Avatar is still shown (loaded from `/api/profile-picture` → backend `/users/{username}/avatar`) |
| 3 | Log out and log back in | Avatar is still visible after re-authentication |

---

## TC-03.9 — Replace existing profile picture

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Ensure a profile picture is already set (TC-03.1 completed) | Avatar shown on `/profile`; label reads **Replace picture** |
| 2 | Click **Choose file** and select a different image | New image preview replaces the old one |
| 3 | Click **Upload** | Success banner with the new filename; avatar updates to the new image |
| 4 | Reload the page | New image is displayed |

---

## TC-03.10 — Uploaded files visible in file manager

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Upload two files with different names via `/profile` (e.g. `photo.jpg` and `report.pdf`) | Both uploads succeed |
| 2 | Navigate to `/files` | Both filenames appear in the **My Files** list, sorted alphabetically |
| 3 | Log in as a different user and navigate to `/files` | The other user's files are **not** visible |