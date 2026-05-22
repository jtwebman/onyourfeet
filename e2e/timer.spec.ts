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

test.describe('persistent alarm', () => {
	test('the alert repeats until acknowledged (dev-scaled interval)', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByTestId('alert-heading')).toBeVisible({ timeout: 5000 });
		// The repeat counter only appears once the alarm has fired at least twice.
		await expect(page.getByTestId('alert-count')).toBeVisible({ timeout: 3000 });
	});

	test('clicking snooze stops the repeating alarm', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByTestId('alert-heading')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: 'Snooze 5 min' }).click();
		await expect(page.getByText('Next break in')).toBeVisible();
		await expect(page.getByTestId('alert-count')).toHaveCount(0);
	});

	test('clicking "I\'m standing up" stops the repeating alarm', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByTestId('alert-heading')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: "I'm standing up" }).click();
		await expect(page.getByText('Walk it out')).toBeVisible();
		await expect(page.getByTestId('alert-count')).toHaveCount(0);
	});
});

test.describe('sound settings', () => {
	test('panel opens with two independent dropdowns', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByTestId('sound-settings-panel')).toHaveCount(0);
		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('sound-settings-panel')).toBeVisible();
		await expect(page.getByTestId('standup-sound-select')).toBeVisible();
		await expect(page.getByTestId('done-sound-select')).toBeVisible();

		const standupOptions = await page.getByTestId('standup-sound-select').locator('option').all();
		const doneOptions = await page.getByTestId('done-sound-select').locator('option').all();
		expect(standupOptions.length).toBe(6);
		expect(doneOptions.length).toBe(6);
	});

	test('default values: stand-up = beeps, done = chimes', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('standup-sound-select')).toHaveValue('beeps');
		await expect(page.getByTestId('done-sound-select')).toHaveValue('chimes');
	});

	test('stand-up and done alarms persist independently', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('standup-sound-select').selectOption('knock');
		await page.getByTestId('done-sound-select').selectOption('bell');

		expect(await page.evaluate(() => localStorage.getItem('onyourfeet:sound'))).toBe('knock');
		expect(await page.evaluate(() => localStorage.getItem('onyourfeet:doneSound'))).toBe('bell');

		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('standup-sound-select')).toHaveValue('knock');
		await expect(page.getByTestId('done-sound-select')).toHaveValue('bell');
	});

	test('panel closes on Escape', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('sound-settings-panel')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('sound-settings-panel')).toHaveCount(0);
	});

	test('picking a preset does not touch custom-sound storage', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('standup-sound-select').selectOption('silent');
		const custom = await page.evaluate(() => localStorage.getItem('onyourfeet:customSound'));
		expect(custom).toBeNull();
	});

	test('custom sound row appears with filename, replace and clear buttons', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		// Pre-seed a custom sound (real audio file would normally come from FileReader)
		await page.evaluate(() => {
			localStorage.setItem('onyourfeet:customSound', 'data:audio/wav;base64,UklGRiQAAABXQVZF');
			localStorage.setItem('onyourfeet:customSoundName', 'morning-bell.mp3');
			localStorage.setItem('onyourfeet:sound', 'custom');
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();

		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('custom-sound-row')).toBeVisible();
		await expect(page.getByTestId('custom-sound-name')).toHaveText('morning-bell.mp3');
		await expect(page.getByTestId('custom-sound-replace')).toBeVisible();
		await expect(page.getByTestId('custom-sound-clear')).toBeVisible();
	});

	test('clear button removes custom sound and reverts dropdowns', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.evaluate(() => {
			localStorage.setItem('onyourfeet:customSound', 'data:audio/wav;base64,UklGRiQAAABXQVZF');
			localStorage.setItem('onyourfeet:customSoundName', 'buzz.mp3');
			localStorage.setItem('onyourfeet:sound', 'custom');
			localStorage.setItem('onyourfeet:doneSound', 'custom');
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();

		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('custom-sound-clear').click();

		await expect(page.getByTestId('custom-sound-row')).toHaveCount(0);
		// Both selects should fall back to their defaults
		await expect(page.getByTestId('standup-sound-select')).toHaveValue('beeps');
		await expect(page.getByTestId('done-sound-select')).toHaveValue('chimes');

		const stored = await page.evaluate(() => ({
			data: localStorage.getItem('onyourfeet:customSound'),
			name: localStorage.getItem('onyourfeet:customSoundName')
		}));
		expect(stored.data).toBeNull();
		expect(stored.name).toBeNull();
	});

	test('replace button triggers file picker (input is clickable)', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.evaluate(() => {
			localStorage.setItem('onyourfeet:customSound', 'data:audio/wav;base64,UklGRiQAAABXQVZF');
			localStorage.setItem('onyourfeet:customSoundName', 'old.mp3');
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();

		await page.getByTestId('sound-settings-button').click();
		// Use setInputFiles to simulate the picker selecting a new file
		await page.getByTestId('sound-file-input').setInputFiles({
			name: 'new-alarm.mp3',
			mimeType: 'audio/mpeg',
			buffer: Buffer.from([0xff, 0xfb, 0x90, 0x44])
		});
		await expect(page.getByTestId('custom-sound-name')).toHaveText('new-alarm.mp3');
		const storedName = await page.evaluate(() =>
			localStorage.getItem('onyourfeet:customSoundName')
		);
		expect(storedName).toBe('new-alarm.mp3');
	});
});

test.describe('timer persistence', () => {
	test('timer keeps running when navigating to /why and back', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '10 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText('Next break in')).toBeVisible();

		// Navigate to why page
		await page.getByRole('link', { name: /Why this exists/ }).click();
		await expect(page.getByRole('heading', { name: 'Why this exists' })).toBeVisible();

		// Wait a bit so the countdown ticks while we're "away"
		await page.waitForTimeout(1500);

		// Navigate back to timer
		await page.getByRole('link', { name: /Back to timer/ }).click();
		await expect(page.getByText('Next break in')).toBeVisible();
	});

	test('timer survives a full page reload (browser close simulation)', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '10 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText('Next break in')).toBeVisible();

		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByText('Next break in')).toBeVisible();
	});

	test('within stale window: alarm fires on restore', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		// Seed a state where the work timer "ended" 10 min ago — well inside the 45-min window
		await page.evaluate(() => {
			const tenMinAgo = Date.now() - 10 * 60 * 1000;
			localStorage.setItem(
				'onyourfeet:timerState',
				JSON.stringify({ phase: 'working', workValue: 30, endAt: tenMinAgo })
			);
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('alert-heading')).toBeVisible();
	});

	test('beyond stale window: timer resets to idle and clears state', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		// Seed a state where the work timer "ended" 60 min ago — beyond 45-min window
		await page.evaluate(() => {
			const sixtyMinAgo = Date.now() - 60 * 60 * 1000;
			localStorage.setItem(
				'onyourfeet:timerState',
				JSON.stringify({ phase: 'working', workValue: 30, endAt: sixtyMinAgo })
			);
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
		const stored = await page.evaluate(() => localStorage.getItem('onyourfeet:timerState'));
		expect(stored).toBeNull();
	});

	test('alert_work state restored when within window', async ({ page }) => {
		await page.goto('/');
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.evaluate(() => {
			const fiveMinAgo = Date.now() - 5 * 60 * 1000;
			localStorage.setItem(
				'onyourfeet:timerState',
				JSON.stringify({ phase: 'alert_work', workValue: 45, alertStartedAt: fiveMinAgo })
			);
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('alert-heading')).toBeVisible();
	});

	test('reset clears persisted state', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '10 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText('Next break in')).toBeVisible();

		const beforeCancel = await page.evaluate(() => localStorage.getItem('onyourfeet:timerState'));
		expect(beforeCancel).not.toBeNull();

		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

		const afterCancel = await page.evaluate(() => localStorage.getItem('onyourfeet:timerState'));
		expect(afterCancel).toBeNull();
	});
});

test.describe('restart from done state', () => {
	test('"Start another" button immediately restarts the work timer', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByTestId('alert-heading')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: "I'm standing up" }).click();
		await expect(page.getByText('Walk it out')).toBeVisible();
		await expect(page.getByText('Nice work')).toBeVisible({ timeout: 5000 });

		await page.getByTestId('restart-timer').click();
		await expect(page.getByText('Next break in')).toBeVisible();
	});

	test('"Done" button still returns to idle', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByRole('button', { name: '1 sec' }).click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByTestId('alert-heading')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: "I'm standing up" }).click();
		await expect(page.getByText('Nice work')).toBeVisible({ timeout: 5000 });

		await page.getByRole('button', { name: 'Done', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
	});
});

test.describe('notification permission UI', () => {
	async function withPermission(page: Page, value: NotificationPermission) {
		await page.addInitScript((perm) => {
			Object.defineProperty(window.Notification, 'permission', {
				get() {
					return perm as NotificationPermission;
				},
				configurable: true
			});
		}, value);
	}

	test('granted: no banner, no enable link', async ({ page }) => {
		await withPermission(page, 'granted');
		await gotoApp(page);
		await expect(page.getByTestId('notification-denied-banner')).toHaveCount(0);
		await expect(page.getByTestId('enable-notifications')).toHaveCount(0);
	});

	test('default: shows enable link, no denied banner', async ({ page }) => {
		await withPermission(page, 'default');
		await gotoApp(page);
		await expect(page.getByTestId('notification-denied-banner')).toHaveCount(0);
		await expect(page.getByTestId('enable-notifications')).toBeVisible();
	});

	test('denied: shows banner, no enable link', async ({ page }) => {
		await withPermission(page, 'denied');
		await gotoApp(page);
		await expect(page.getByTestId('notification-denied-banner')).toBeVisible();
		await expect(page.getByTestId('enable-notifications')).toHaveCount(0);
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
