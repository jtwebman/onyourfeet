import { expect, test, type Page } from '@playwright/test';

async function gotoApp(page: Page, path: string = '/') {
	await page.goto(path);
	await page.locator('html[data-hydrated="true"]').waitFor();
}

test.describe('idle state', () => {
	test('renders heading, presets, and Start button', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByRole('heading', { name: 'On Your Feet' })).toBeVisible();
		await expect(page.getByRole('button', { name: '30 min' })).toBeVisible();
		await expect(page.getByRole('button', { name: '45 min' })).toBeVisible();
		await expect(page.getByRole('button', { name: '60 min' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('dev badge is hidden by default', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByTestId('dev-badge')).toHaveCount(0);
	});

	test('default preset is 45 min on fresh load', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByRole('button', { name: '45 min' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('preset selection persists across reload', async ({ page }) => {
		await gotoApp(page);
		await page.getByRole('button', { name: '60 min' }).click();
		await expect(page.getByRole('button', { name: '60 min' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByRole('button', { name: '60 min' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
});

test.describe('dev mode', () => {
	test('shows DEV badge and 1/5/10 sec presets', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await expect(page.getByTestId('dev-badge')).toBeVisible();
		await expect(page.getByRole('button', { name: '1 sec' })).toBeVisible();
		await expect(page.getByRole('button', { name: '5 sec' })).toBeVisible();
		await expect(page.getByRole('button', { name: '10 sec' })).toBeVisible();
	});

	test('full cycle: work → alert → standing → done → idle', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByText('Next break in')).toBeVisible();
		await expect(page.getByText('Time to stand up')).toBeVisible({ timeout: 5000 });

		await page.getByRole('button', { name: "I'm standing up" }).click();
		await expect(page.getByText('Walk it out')).toBeVisible();
		await expect(page.getByText('Nice work')).toBeVisible({ timeout: 5000 });

		await page.getByRole('button', { name: 'Done' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('snooze restarts the work timer and re-alerts', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByText('Time to stand up')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: 'Snooze 5 min' }).click();
		await expect(page.getByText('Next break in')).toBeVisible();
		await expect(page.getByText('Time to stand up')).toBeVisible({ timeout: 5000 });
	});

	test('cancel mid-timer returns to idle', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '5 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByText('Next break in')).toBeVisible();
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('end standing early returns to idle', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByText('Time to stand up')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: "I'm standing up" }).click();
		await expect(page.getByText('Walk it out')).toBeVisible();

		await page.getByRole('button', { name: 'End early' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('document title shows countdown during working phase', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '10 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page).toHaveTitle(/— On Your Feet/);
	});

	test('dev-mode preset selection does not pollute production localStorage', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '10 sec' }).click();
		const stored = await page.evaluate(() => window.localStorage.getItem('onyourfeet:workMinutes'));
		expect(stored).toBeNull();
	});
});

test.describe('why page', () => {
	test('renders and links back to the timer', async ({ page }) => {
		await gotoApp(page, '/why');
		await expect(page.getByRole('heading', { name: 'Why this exists' })).toBeVisible();
		await expect(page.getByRole('link', { name: '← Back to timer' })).toBeVisible();
		await expect(page.getByText('Duran AT')).toBeVisible();
	});

	test('timer page has link to why page', async ({ page }) => {
		await gotoApp(page);
		await page.getByRole('link', { name: /Why this exists/ }).click();
		await expect(page.getByRole('heading', { name: 'Why this exists' })).toBeVisible();
	});
});

test.describe('i18n', () => {
	test('/ redirects to /en/ by default', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.url()).toMatch(/\/en\/?$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	test('/ honors Accept-Language header (French)', async ({ browser }) => {
		const ctx = await browser.newContext({ locale: 'fr-FR' });
		const page = await ctx.newPage();
		const response = await page.goto('/');
		expect(response?.url()).toMatch(/\/fr\/?$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
		await ctx.close();
	});

	test('/es/ renders Spanish text', async ({ page }) => {
		await gotoApp(page, '/es/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'es');
		await expect(page.getByRole('button', { name: /Iniciar/ })).toBeVisible();
	});

	test('/de/ renders German text', async ({ page }) => {
		await gotoApp(page, '/de/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.getByText('Min.').first()).toBeVisible();
	});

	test('non-English why page shows translation notice', async ({ page }) => {
		await gotoApp(page, '/fr/why');
		await expect(page.getByTestId('translation-notice')).toBeVisible();
	});

	test('translation notice link actually switches to English', async ({ page }) => {
		await gotoApp(page, '/pt/why');
		await expect(page.getByTestId('translation-notice')).toBeVisible();
		await page.getByTestId('translation-notice').getByRole('link').click();
		await page.waitForURL(/\/en\/why\/?$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-notice')).toHaveCount(0);
	});

	test('English why page does not show translation notice', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await expect(page.getByTestId('translation-notice')).toHaveCount(0);
	});

	test('locale-aware number formatting in preset buttons (hi)', async ({ page }) => {
		await gotoApp(page, '/hi/');
		// Hindi locale uses Latin digits in NumberFormat by default; verify still readable
		const buttons = page.getByRole('button');
		await expect(buttons.filter({ hasText: /30/ })).toHaveCount(1);
	});
});

test.describe('theme toggle', () => {
	test('cycles system → light → dark → system and persists', async ({ page }) => {
		await gotoApp(page);
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toHaveAttribute('data-theme', 'system');

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'light');
		await expect(page.locator('html')).not.toHaveClass(/dark/);

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'dark');
		await expect(page.locator('html')).toHaveClass(/dark/);

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'system');

		// persistence across reload
		await toggle.click(); // back to light
		await expect(toggle).toHaveAttribute('data-theme', 'light');
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme', 'light');
	});

	test('explicit light overrides system dark preference', async ({ browser }) => {
		const ctx = await browser.newContext({ colorScheme: 'dark' });
		const page = await ctx.newPage();
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.locator('html')).toHaveClass(/dark/);

		const toggle = page.getByTestId('theme-toggle');
		await toggle.click(); // system → light
		await expect(page.locator('html')).not.toHaveClass(/dark/);
		await ctx.close();
	});
});

test.describe('language switcher', () => {
	test('switching to French navigates to /fr/', async ({ page }) => {
		await gotoApp(page, '/en/');
		await page.getByTestId('language-switcher').selectOption('fr');
		await page.waitForURL(/\/fr\/?/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
		await expect(page.getByTestId('language-switcher')).toHaveValue('fr');
	});

	test('switching from why page preserves the route', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await page.getByTestId('language-switcher').selectOption('de');
		await page.waitForURL(/\/de\/why\/?$/);
		await expect(page.getByTestId('translation-notice')).toBeVisible();
	});

	test('language selection persists across reload via cookie', async ({ page }) => {
		await gotoApp(page, '/en/');
		await page.getByTestId('language-switcher').selectOption('es');
		await page.waitForURL(/\/es\/?/);

		await page.goto('/');
		await page.waitForURL(/\/es\/?/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	});

	test('all 13 locales listed', async ({ page }) => {
		await gotoApp(page);
		const options = await page.getByTestId('language-switcher').locator('option').all();
		expect(options.length).toBe(13);
	});
});

test.describe('color scheme', () => {
	test('applies dark variant classes when prefers-color-scheme is dark', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await gotoApp(page);
		await expect(page.locator('main')).toHaveClass(/dark:bg-zinc-950/);
	});

	test('applies light defaults when prefers-color-scheme is light', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await gotoApp(page);
		await expect(page.locator('main')).toHaveClass(/bg-zinc-50/);
	});
});
