import { test, expect, type Page, type Route } from '@playwright/test'

// ── helpers ──────────────────────────────────────────────────────────────────

const LEGAL_TOKEN = 'test-legal-token'

async function mockAuthAsLegal(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('skipa_access_token', token)
    localStorage.setItem('skipa_refresh_token', 'test-refresh-token')
  }, LEGAL_TOKEN)
}

function mockCurrentCycle(page: Page, deadline = '2026-06-30') {
  return page.route('**/review-cycles/current', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          year: 2026,
          quarter: 2,
          startDate: '2026-04-01',
          endDate: '2026-06-30',
          deadline,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    }),
  )
}

function mockReviewList(page: Page) {
  return page.route('**/reviews**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 },
      }),
    }),
  )
}

async function goToReevaluation(page: Page) {
  await mockAuthAsLegal(page)
  await page.goto('/legal/reevaluation')
}

// ── due-date display ──────────────────────────────────────────────────────────

test('given current review cycle with deadline, when page loads, then deadline is displayed in header', async ({ page }) => {
  mockCurrentCycle(page, '2026-06-30')
  mockReviewList(page)
  await goToReevaluation(page)

  await expect(page.locator('.deadline-date')).toHaveText('2026-06-30')
})

// ── modal open / cancel ───────────────────────────────────────────────────────

test('given reevaluation page loaded, when clicking 변경 button, then due-date modal opens', async ({ page }) => {
  mockCurrentCycle(page)
  mockReviewList(page)
  await goToReevaluation(page)

  await page.locator('.btn-change-deadline').click()

  await expect(page.locator('.modal__title', { hasText: '재평가 기한 변경' })).toBeVisible()
})

test('given due-date modal is open, when clicking 취소, then modal closes without API call', async ({ page }) => {
  mockCurrentCycle(page)
  mockReviewList(page)
  let patchCalled = false
  await page.route('**/review-cycles/*/deadline', () => { patchCalled = true })
  await goToReevaluation(page)

  await page.locator('.btn-change-deadline').click()
  await page.locator('.btn-cancel').last().click()

  await expect(page.locator('.modal__title', { hasText: '재평가 기한 변경' })).not.toBeVisible()
  expect(patchCalled).toBe(false)
})

test('given due-date modal is open with no date entered, when checking confirm button, then button is disabled', async ({ page }) => {
  mockCurrentCycle(page, '')
  mockReviewList(page)
  await goToReevaluation(page)

  await page.locator('.btn-change-deadline').click()
  await page.locator('input.due-date-input').fill('')

  await expect(page.locator('.btn-confirm').last()).toBeDisabled()
})

// ── success path ──────────────────────────────────────────────────────────────

test('given valid new date entered, when clicking 적용, then PATCH /review-cycles/{id}/deadline is called with correct payload', async ({ page }) => {
  mockCurrentCycle(page, '2026-06-30')
  mockReviewList(page)

  let capturedBody: unknown = null
  await page.route('**/review-cycles/1/deadline', async (route: Route) => {
    capturedBody = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { id: 1, deadline: '2026-07-31' } }),
    })
  })

  await goToReevaluation(page)
  await page.locator('.btn-change-deadline').click()
  await page.locator('input.due-date-input').fill('2026-07-31')
  await page.locator('.btn-confirm').last().click()

  expect(capturedBody).toEqual({ deadline: '2026-07-31' })
})

test('given API call succeeds, when clicking 적용, then modal closes and header shows new deadline', async ({ page }) => {
  mockCurrentCycle(page, '2026-06-30')
  mockReviewList(page)
  await page.route('**/review-cycles/*/deadline', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { id: 1, deadline: '2026-07-31' } }),
    }),
  )

  await goToReevaluation(page)
  await page.locator('.btn-change-deadline').click()
  await page.locator('input.due-date-input').fill('2026-07-31')
  await page.locator('.btn-confirm').last().click()

  await expect(page.locator('.modal__title', { hasText: '재평가 기한 변경' })).not.toBeVisible()
  await expect(page.locator('.deadline-date')).toHaveText('2026-07-31')
})

// ── error path ────────────────────────────────────────────────────────────────

test('given API returns 500, when clicking 적용, then error alert is shown and modal stays open', async ({ page }) => {
  mockCurrentCycle(page, '2026-06-30')
  mockReviewList(page)
  await page.route('**/review-cycles/*/deadline', (route: Route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ success: false }) }),
  )

  await goToReevaluation(page)

  const dialogPromise = page.waitForEvent('dialog')
  await page.locator('.btn-change-deadline').click()
  await page.locator('input.due-date-input').fill('2026-07-31')
  await page.locator('.btn-confirm').last().click()

  const dialog = await dialogPromise
  expect(dialog.message()).toContain('기한 변경에 실패했습니다')
  await dialog.accept()

  await expect(page.locator('.modal__title', { hasText: '재평가 기한 변경' })).toBeVisible()
})

test('given API returns 500, when clicking 적용, then deadline in header remains unchanged', async ({ page }) => {
  mockCurrentCycle(page, '2026-06-30')
  mockReviewList(page)
  await page.route('**/review-cycles/*/deadline', (route: Route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ success: false }) }),
  )

  await goToReevaluation(page)

  const dialogPromise = page.waitForEvent('dialog')
  await page.locator('.btn-change-deadline').click()
  await page.locator('input.due-date-input').fill('2026-07-31')
  await page.locator('.btn-confirm').last().click()

  const dialog = await dialogPromise
  await dialog.accept()

  await expect(page.locator('.deadline-date')).toHaveText('2026-06-30')
})
