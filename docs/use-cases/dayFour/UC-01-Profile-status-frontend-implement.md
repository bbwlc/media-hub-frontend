# UC-01 — Profile Status: Frontend Implementation

## Description

The backend now manages a three-state lifecycle for every account:
`UNVERIFIED` → `VERIFIED` ↔ `LOCKED` (see backend UC-01).  
The frontend needs an **admin panel** that lets a user with `ROLE_ADMIN` view all accounts
and change their status. No changes are needed to the login page — a `LOCKED` account
returns the same `401` as wrong credentials (intentional, no information leak).

## Actor

Admin user (`ROLE_ADMIN`)

## Preconditions

- Backend running with the updated `Account` entity (status field present).
- Admin is authenticated and their JWT encodes `ROLE_ADMIN`.

---

## Current State

The frontend has no admin section and no way to read or change account status.
The `getMe()` action in `app/actions.ts` already fetches `role` from `GET /auth/me`,
so the logged-in user's role is available without touching the JWT directly.

---

## Step 1 — Server Action: list all users

New file `app/admin/users/actions.ts`:

```typescript
'use server'

import { cookies } from 'next/headers'

export type UserRecord = {
  username: string
  email: string | null
  role: string
  status: 'UNVERIFIED' | 'VERIFIED' | 'LOCKED'
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('token')?.value ?? null
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch('http://localhost:8080/users', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function updateUserStatus(
  username: string,
  status: 'VERIFIED' | 'LOCKED'
): Promise<{ error?: string }> {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated.' }
  try {
    const res = await fetch(
      `http://localhost:8080/users/${encodeURIComponent(username)}/status?status=${status}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (res.status === 403) return { error: 'Admin access required.' }
    if (!res.ok) return { error: 'Status update failed.' }
    return {}
  } catch {
    return { error: 'Could not reach the server.' }
  }
}
```

---

## Step 2 — Client Component: UserStatusManager

New file `app/admin/users/UserStatusManager.tsx`:

```typescript
'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserStatus, type UserRecord } from './actions'

const STATUS_COLORS: Record<string, string> = {
  VERIFIED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNVERIFIED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOCKED:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function UserStatusManager({ users }: { users: UserRecord[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(username: string, status: 'VERIFIED' | 'LOCKED') {
    setPending(username)
    setError(null)
    startTransition(async () => {
      const result = await updateUserStatus(username, status)
      setPending(null)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 pt-16 dark:bg-zinc-900">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          User Management
        </h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <th className="pb-2">Username</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {users.map((user) => (
              <tr key={user.username}>
                <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">
                  {user.username}
                </td>
                <td className="py-3 text-zinc-500 dark:text-zinc-400">{user.role}</td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status]}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 flex gap-2">
                  {user.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleStatusChange(user.username, 'VERIFIED')}
                      disabled={pending === user.username}
                      className="appearance-none rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
                    >
                      Verify
                    </button>
                  )}
                  {user.status !== 'LOCKED' && (
                    <button
                      onClick={() => handleStatusChange(user.username, 'LOCKED')}
                      disabled={pending === user.username}
                      className="appearance-none rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Lock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Step 3 — Admin Page (Server Component)

New file `app/admin/users/page.tsx`:

```typescript
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMe } from '@/app/actions'
import { getAllUsers } from './actions'
import UserStatusManager from './UserStatusManager'

export default async function AdminUsersPage() {
  const me = await getMe()

  // Only ROLE_ADMIN may access this page
  if (me.role !== 'ROLE_ADMIN') redirect('/')

  const users = await getAllUsers()

  return <UserStatusManager users={users} />
}
```

---

## Step 4 — Navigation link for admins

In the root layout or nav component, conditionally render a link to `/admin/users`
only when the logged-in user is an admin. Because the layout is a Server Component,
call `getMe()` there:

```typescript
// app/layout.tsx — example addition
const me = await getMe()
{me.role === 'ROLE_ADMIN' && (
  <a href="/admin/users">Admin</a>
)}
```

---

## Endpoints Used

| Method  | Path                             | Auth          | Description                   |
|---------|----------------------------------|---------------|-------------------------------|
| `GET`   | `/users`                         | Bearer token  | List all accounts (admin only) |
| `PATCH` | `/users/{username}/status?status=` | Bearer token | Change account status (admin only) |

---

## Allowed Status Transitions (reflected in UI)

| Current status | Available actions |
|----------------|-------------------|
| `UNVERIFIED`   | **Verify**, **Lock** |
| `VERIFIED`     | **Lock** |
| `LOCKED`       | **Verify** |

The `UNVERIFIED → UNVERIFIED` and `LOCKED → UNVERIFIED` transitions are not allowed
by the backend — the UI hides the corresponding buttons.

---

## Login Page — No Change Required

A `LOCKED` account returns `401 Unauthorized` — identical to wrong credentials.
The existing error message "Invalid username or password." is intentionally kept
to avoid revealing to an attacker whether an account exists and why login was denied.

---

## Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `app/admin/users/actions.ts` | Server actions: `getAllUsers`, `updateUserStatus` |
| 2 | `app/admin/users/UserStatusManager.tsx` | Client component: user table with Verify / Lock buttons |
| 3 | `app/admin/users/page.tsx` | Server Component: admin guard + data fetch |
| 4 | `app/layout.tsx` | Conditional "Admin" nav link for `ROLE_ADMIN` |

---

## Open TODOs

| # | Description |
|---|-------------|
| 1 | Implement `GET /users` endpoint in backend (`UserController`, admin only) |
| 2 | Create `app/admin/users/actions.ts` |
| 3 | Create `app/admin/users/UserStatusManager.tsx` |
| 4 | Create `app/admin/users/page.tsx` |
| 5 | Add conditional admin nav link in layout |
| 6 | Write TC-05 test cases for admin status management flow |

## Related

- Backend: `media-hub-backend/docs/use-cases/dayFour/UC-01-Profil-Status-implement.md`
- Previous: `UC-10.3.5-Register-workflow-new.md`