import { test, type Page } from '@playwright/test';

async function gotoApp(page: Page, path: string = '/') {
	await page.goto(path);
	await page.locator('html[data-hydrated="true"]').waitFor();
}

for (const scheme of ['light', 'dark'] as const) {
	test.describe(`screenshots — ${scheme}`, () => {
		test.use({ colorScheme: scheme, viewport: { width: 900, height: 700 } });

		test(`idle (${scheme})`, async ({ page }) => {
			await gotoApp(page);
			await page.screenshot({ path: `screenshots/idle-${scheme}.png` });
		});

		test(`working (${scheme})`, async ({ page }) => {
			await gotoApp(page, '/?dev=1');
			await page.getByRole('button', { name: '10 sec' }).click();
			await page.getByRole('button', { name: 'Start' }).click();
			await page.getByText('Next break in').waitFor();
			await page.screenshot({ path: `screenshots/working-${scheme}.png` });
		});

		test(`alert (${scheme})`, async ({ page }) => {
			await gotoApp(page, '/?dev=1');
			await page.getByRole('button', { name: '1 sec' }).click();
			await page.getByRole('button', { name: 'Start' }).click();
			await page.getByText('Time to stand up').waitFor();
			await page.screenshot({ path: `screenshots/alert-${scheme}.png` });
		});

		test(`standing (${scheme})`, async ({ page }) => {
			await gotoApp(page, '/?dev=1');
			await page.getByRole('button', { name: '1 sec' }).click();
			await page.getByRole('button', { name: 'Start' }).click();
			await page.getByText('Time to stand up').waitFor();
			await page.getByRole('button', { name: "I'm standing up" }).click();
			await page.getByText('Walk it out').waitFor();
			await page.screenshot({ path: `screenshots/standing-${scheme}.png` });
		});

		test(`why (${scheme})`, async ({ page }) => {
			await gotoApp(page, '/why');
			await page.screenshot({ path: `screenshots/why-${scheme}.png`, fullPage: true });
		});
	});
}
