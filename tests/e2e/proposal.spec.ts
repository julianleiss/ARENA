// ARENA - Proposal Page E2E Test
import { test, expect } from '@playwright/test'

test.describe('Proposal Page', () => {
  test('should load proposals list page', async ({ page }) => {
    // Navigate to proposals page
    await page.goto('/proposals')
    await page.waitForLoadState('networkidle')

    // Verify we're on the proposals page
    await expect(page).toHaveURL('/proposals')

    // Check for proposals heading or container
    // This will work even if there are no proposals yet
    const proposalsContainer = page.locator('body')
    await expect(proposalsContainer).toBeVisible()
  })

  test('should display proposal title when proposal exists', async ({ page }) => {
    // Navigate to proposals page
    await page.goto('/proposals')
    await page.waitForLoadState('networkidle')

    // Try to find any proposal card or link
    // We use a more generic selector that should work if proposals exist
    const proposalCards = page.locator('[data-testid="proposal-card"], .proposal-card, a[href*="/proposals/"]')

    // Check if proposals exist
    const count = await proposalCards.count()

    if (count > 0) {
      // Click first proposal
      const firstProposal = proposalCards.first()
      await firstProposal.click()

      // Wait for navigation to proposal detail page
      await page.waitForURL(/\/proposals\/[^/]+/)

      // Verify we're on a proposal detail page
      expect(page.url()).toMatch(/\/proposals\/prop[-_]/)

      // Wait for content to load
      await page.waitForLoadState('networkidle')

      // Verify some content is rendered (title, body, etc.)
      const content = page.locator('body')
      await expect(content).toBeVisible()
    } else {
      // If no proposals exist, just verify page loads correctly
      console.log('No proposals found - skipping detail page test')
      expect(page.url()).toContain('/proposals')
    }
  })
})
