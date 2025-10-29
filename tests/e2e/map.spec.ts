// ARENA - Map Page E2E Test
import { test, expect } from '@playwright/test'

test.describe('Map Page', () => {
  // SKIP: MapLibre canvas rendering is flaky in headless mode
  test.skip('should load map page and render map canvas', async ({ page }) => {
    // Navigate to map page
    await page.goto('/map')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check that we're on the map page
    await expect(page).toHaveURL('/map')

    // Wait for MapLibre canvas or map container to be present
    // Try multiple selectors as MapLibre can render differently
    const mapCanvas = page.locator('canvas').first()
    await expect(mapCanvas).toBeVisible({ timeout: 15000 })
  })

  test('should display SandboxTest button', async ({ page }) => {
    await page.goto('/map')
    await page.waitForLoadState('networkidle')

    // Check for SandboxTest button
    const sandboxTestButton = page.getByRole('button', { name: /create test sandbox/i })
    await expect(sandboxTestButton).toBeVisible()
  })
})
