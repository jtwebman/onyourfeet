import { test } from '@playwright/test';

test.use({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' });

test('generate og image', async ({ page }) => {
	await page.goto('/');
	await page.locator('html[data-hydrated="true"]').waitFor();
	await page.screenshot({ path: 'static/og-image.png' });
});
