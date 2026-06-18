# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tc-01-login.spec.ts >> TC-01.5 – backend unreachable shows server error
- Location: tests/tc-01-login.spec.ts:78:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Could not reach the server. Please try again.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Could not reach the server. Please try again.')

```

```yaml
- alert
- heading "Media Hub" [level=1]
- text: U
- paragraph: Signed in as user1
- text: Admin
- button "Sign out"
- navigation:
  - link "→ Register":
    - /url: /register
  - link "→ Login":
    - /url: /login
  - link "→ Profile picture":
    - /url: /profile
  - link "→ My Files":
    - /url: /files
- paragraph: Auth test
- button "Test protected endpoint"
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test'
  2   | 
  3   | // Seeded test credentials (data.sql)
  4   | const VALID_USER = { username: 'user1', password: 'password123' }
  5   | const WRONG_PASSWORD = 'wrongpassword'
  6   | 
  7   | // ---------------------------------------------------------------------------
  8   | // Helpers
  9   | // ---------------------------------------------------------------------------
  10  | 
  11  | async function fillAndSubmit(page: Page, username: string, password: string) {
  12  |   await page.fill('#username', username)
  13  |   await page.fill('#password', password)
  14  |   await page.click('button[type="submit"]')
  15  | }
  16  | 
  17  | // ---------------------------------------------------------------------------
  18  | // TC-01.1 — Successful login with valid credentials
  19  | // Precondition: backend running on localhost:8080
  20  | // ---------------------------------------------------------------------------
  21  | test('TC-01.1 – successful login redirects to home', async ({ page }) => {
  22  |   await page.goto('/login')
  23  | 
  24  |   await expect(page.locator('h1')).toContainText('Sign in')
  25  | 
  26  |   await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)
  27  | 
  28  |   await expect(page).toHaveURL('/')
  29  | })
  30  | 
  31  | // ---------------------------------------------------------------------------
  32  | // TC-01.2 — Login with wrong password
  33  | // Precondition: backend running on localhost:8080
  34  | // ---------------------------------------------------------------------------
  35  | test('TC-01.2 – wrong password shows error banner', async ({ page }) => {
  36  |   await page.goto('/login')
  37  | 
  38  |   await fillAndSubmit(page, VALID_USER.username, WRONG_PASSWORD)
  39  | 
  40  |   await expect(page.locator('text=Invalid username or password.')).toBeVisible()
  41  |   await expect(page).toHaveURL('/login')
  42  | })
  43  | 
  44  | // ---------------------------------------------------------------------------
  45  | // TC-01.3 — Empty username — client-side validation (no backend call)
  46  | // ---------------------------------------------------------------------------
  47  | test('TC-01.3 – empty username shows field error', async ({ page }) => {
  48  |   await page.goto('/login')
  49  | 
  50  |   // Leave username empty, fill password
  51  |   await page.fill('#password', VALID_USER.password)
  52  |   await page.click('button[type="submit"]')
  53  | 
  54  |   await expect(page.locator('text=Username is required.')).toBeVisible()
  55  |   // Must not navigate away
  56  |   await expect(page).toHaveURL('/login')
  57  | })
  58  | 
  59  | // ---------------------------------------------------------------------------
  60  | // TC-01.4 — Empty password — client-side validation (no backend call)
  61  | // ---------------------------------------------------------------------------
  62  | test('TC-01.4 – empty password shows field error', async ({ page }) => {
  63  |   await page.goto('/login')
  64  | 
  65  |   await page.fill('#username', VALID_USER.username)
  66  |   // Leave password empty
  67  |   await page.click('button[type="submit"]')
  68  | 
  69  |   await expect(page.locator('text=Password is required.')).toBeVisible()
  70  |   await expect(page).toHaveURL('/login')
  71  | })
  72  | 
  73  | // ---------------------------------------------------------------------------
  74  | // TC-01.5 — Backend unreachable
  75  | // Precondition: backend on localhost:8080 must NOT be running.
  76  | // Run this test separately with: npx playwright test --grep "TC-01.5"
  77  | // ---------------------------------------------------------------------------
  78  | test('TC-01.5 – backend unreachable shows server error', async ({ page }) => {
  79  |   // Block all requests to the backend so the action's fetch() throws.
  80  |   await page.route('**/auth/signIn', (route) => route.abort('connectionrefused'))
  81  | 
  82  |   await page.goto('/login')
  83  |   await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)
  84  | 
  85  |   await expect(
  86  |     page.locator('text=Could not reach the server. Please try again.')
> 87  |   ).toBeVisible()
      |     ^ Error: expect(locator).toBeVisible() failed
  88  |   await expect(page).toHaveURL('/login')
  89  | })
  90  | 
  91  | // ---------------------------------------------------------------------------
  92  | // TC-01.6 — Protected routes redirect unauthenticated users to /login
  93  | // No backend needed.
  94  | // ---------------------------------------------------------------------------
  95  | test('TC-01.6a – /profile redirects to /login when unauthenticated', async ({ page }) => {
  96  |   // Navigate in a fresh context (no token cookie)
  97  |   await page.goto('/profile')
  98  |   await expect(page).toHaveURL('/login')
  99  | })
  100 | 
  101 | test('TC-01.6b – /files redirects to /login when unauthenticated', async ({ page }) => {
  102 |   await page.goto('/files')
  103 |   await expect(page).toHaveURL('/login')
  104 | })
  105 | 
  106 | // ---------------------------------------------------------------------------
  107 | // TC-01.7 — Session persists after page reload
  108 | // Precondition: backend running on localhost:8080
  109 | // ---------------------------------------------------------------------------
  110 | test('TC-01.7 – session persists after reload', async ({ page }) => {
  111 |   // Log in via the UI
  112 |   await page.goto('/login')
  113 |   await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)
  114 |   await expect(page).toHaveURL('/')
  115 | 
  116 |   // Reload and verify still authenticated (protected page loads without redirect)
  117 |   await page.goto('/profile')
  118 |   await expect(page).not.toHaveURL('/login')
  119 |   await expect(page.locator('h1')).toContainText('Profile picture')
  120 | })
  121 | 
  122 | // ---------------------------------------------------------------------------
  123 | // TC-01.8 — Activation banner shown after registration confirmation
  124 | // No backend needed — just a query parameter.
  125 | // ---------------------------------------------------------------------------
  126 | test('TC-01.8 – activation banner shown with ?activated=true', async ({ page }) => {
  127 |   await page.goto('/login?activated=true')
  128 | 
  129 |   await expect(
  130 |     page.locator('text=Account activated — you can now sign in.')
  131 |   ).toBeVisible()
  132 | })
```