# UC-05: Sign Out

## Description
A logged-in user signs out. The backend invalidates the JWT by clearing `account.token`
in the database. The frontend deletes the token cookie and redirects to the login page.

## Actor
Authenticated user

## Preconditions
- The user is logged in and holds a valid `token` cookie (set by UC-03).

## Main Flow
1. User clicks the "Sign out" button.
2. The frontend calls the `signOut` Server Action.
3. The Server Action reads the `token` cookie and calls `POST /auth/signOut`
   with `Authorization: Bearer <token>`.
4. The backend reads the authenticated user from `SecurityContextHolder`,
   sets `account.token = null`, and saves the account.
5. The backend responds `200 OK`.
6. The Server Action deletes the `token` cookie.
7. The user is redirected to `/login`.

## Alternative Flows

### A — Already unauthenticated / token missing
- At step 3: no cookie → Server Action skips the backend call, deletes the cookie
  (no-op), and redirects to `/login`.

### B — Backend call fails (network error)
- At step 3: `fetch` throws → Server Action still deletes the cookie and redirects.
  The token row in the DB may remain set until it expires, but the user is logged out
  client-side.

### C — Backend returns 401
- The cookie is deleted and the redirect happens regardless — the user is signed out
  locally even if the backend could not verify the session.

## Endpoint

| Field   | Value                           |
|---------|---------------------------------|
| Method  | `POST`                          |
| Path    | `/auth/signOut`                 |
| Auth    | `Authorization: Bearer <token>` |
| `200`   | Token cleared in DB             |
| `401`   | User not authenticated          |

## Backend Implementation

```java
@PostMapping("/signOut")
public ResponseEntity<?> signOut() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated()) {
        String username = auth.getName();
        accountRepository.findByUsername(username).ifPresent(account -> {
            account.setToken(null);
            accountRepository.save(account);
        });
        return ResponseEntity.ok().build();
    }
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
}
```

## Frontend Implementation

```typescript
// app/actions.ts — signOut Server Action
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (token) {
    try {
      await fetch('http://localhost:8080/auth/signOut', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* local sign-out proceeds regardless */ }
  }
  cookieStore.delete('token')
  redirect('/login')
}
```

The cookie is always deleted — even if the backend call fails — so the user
is never left in a stuck half-logged-in state.

## Postconditions
- `account.token` is `null` in the database — the token cannot be reused.
- The `token` cookie is deleted from the browser.
- The user is on the `/login` page.

## Security Note
Clearing the token in the database is what makes sign-out effective.
Without this, a leaked JWT would remain valid until its 1-hour expiry.
The `JWTAuthenticationFilter` could be extended to reject tokens that no longer
match `account.token` for true server-side invalidation.

## Related
- Previous: `UC-04-load-profile-picture-by-registering.md`
- Next: UC-06 Display Profile Picture