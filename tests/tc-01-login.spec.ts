import { test, expect, type Page } from '@playwright/test'

// Seeded test credentials (data.sql)
const VALID_USER = { username: 'user1', password: 'password123' }
const WRONG_PASSWORD = 'wrongpassword'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fillAndSubmit(page: Page, username: string, password: string) {
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

// ---------------------------------------------------------------------------
// TC-01.1 — Successful login with valid credentials
// Precondition: backend running on localhost:8080
// ---------------------------------------------------------------------------
test('TC-01.1 – successful login redirects to home', async ({ page }) => {
  await page.goto('/login')

  await expect(page.locator('h1')).toContainText('Sign in')

  await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)

  await expect(page).toHaveURL('/')
})

// ---------------------------------------------------------------------------
// TC-01.2 — Login with wrong password
// Precondition: backend running on localhost:8080
// ---------------------------------------------------------------------------
test('TC-01.2 – wrong password shows error banner', async ({ page }) => {
  await page.goto('/login')

  await fillAndSubmit(page, VALID_USER.username, WRONG_PASSWORD)

  await expect(page.locator('text=Invalid username or password.')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

// ---------------------------------------------------------------------------
// TC-01.3 — Empty username — client-side validation (no backend call)
// ---------------------------------------------------------------------------
test('TC-01.3 – empty username shows field error', async ({ page }) => {
  await page.goto('/login')

  // Leave username empty, fill password
  await page.fill('#password', VALID_USER.password)
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Username is required.')).toBeVisible()
  // Must not navigate away
  await expect(page).toHaveURL('/login')
})

// ---------------------------------------------------------------------------
// TC-01.4 — Empty password — client-side validation (no backend call)
// ---------------------------------------------------------------------------
test('TC-01.4 – empty password shows field error', async ({ page }) => {
  await page.goto('/login')

  await page.fill('#username', VALID_USER.username)
  // Leave password empty
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Password is required.')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

// ---------------------------------------------------------------------------
// TC-01.5 — Backend unreachable
// Precondition: backend on localhost:8080 must NOT be running.
// Run this test separately with: npx playwright test --grep "TC-01.5"
// ---------------------------------------------------------------------------
test('TC-01.5 – backend unreachable shows server error', async ({ page }) => {
  // Block all requests to the backend so the action's fetch() throws.
  await page.route('**/auth/signIn', (route) => route.abort('connectionrefused'))

  await page.goto('/login')
  await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)

  await expect(
    page.locator('text=Could not reach the server. Please try again.')
  ).toBeVisible()
  await expect(page).toHaveURL('/login')
})

// ---------------------------------------------------------------------------
// TC-01.6 — Protected routes redirect unauthenticated users to /login
// No backend needed.
// ---------------------------------------------------------------------------
test('TC-01.6a – /profile redirects to /login when unauthenticated', async ({ page }) => {
  // Navigate in a fresh context (no token cookie)
  await page.goto('/profile')
  await expect(page).toHaveURL('/login')
})

test('TC-01.6b – /files redirects to /login when unauthenticated', async ({ page }) => {
  await page.goto('/files')
  await expect(page).toHaveURL('/login')
})

// ---------------------------------------------------------------------------
// TC-01.7 — Session persists after page reload
// Precondition: backend running on localhost:8080
// ---------------------------------------------------------------------------
test('TC-01.7 – session persists after reload', async ({ page }) => {
  // Log in via the UI
  await page.goto('/login')
  await fillAndSubmit(page, VALID_USER.username, VALID_USER.password)
  await expect(page).toHaveURL('/')

  // Reload and verify still authenticated (protected page loads without redirect)
  await page.goto('/profile')
  await expect(page).not.toHaveURL('/login')
  await expect(page.locator('h1')).toContainText('Profile picture')
})

// ---------------------------------------------------------------------------
// TC-01.8 — Activation banner shown after registration confirmation
// No backend needed — just a query parameter.
// ---------------------------------------------------------------------------
test('TC-01.8 – activation banner shown with ?activated=true', async ({ page }) => {
  await page.goto('/login?activated=true')

  await expect(
    page.locator('text=Account activated — you can now sign in.')
  ).toBeVisible()
})