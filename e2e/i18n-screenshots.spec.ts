import { test, type Page } from '@playwright/test';

async function gotoApp(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-hydrated="true"]').waitFor();
}

test.use({ viewport: { width: 900, height: 700 } });

const SCENARIOS: Array<{ name: string; path: string; scheme: 'light' | 'dark' }> = [
	{ name: 'idle-es-light', path: '/es/', scheme: 'light' },
	{ name: 'idle-ja-dark', path: '/ja/', scheme: 'dark' },
	{ name: 'idle-zh-light', path: '/zh/', scheme: 'light' },
	{ name: 'idle-de-dark', path: '/de/', scheme: 'dark' },
	{ name: 'why-fr-light', path: '/fr/why', scheme: 'light' },
	{ name: 'why-ja-dark', path: '/ja/why', scheme: 'dark' },
	{ name: 'why-hi-light', path: '/hi/why', scheme: 'light' }
];

for (const { name, path, scheme } of SCENARIOS) {
	test(`screenshot ${name}`, async ({ browser }) => {
		const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 900, height: 700 } });
		const page = await ctx.newPage();
		await gotoApp(page, path);
		await page.screenshot({ path: `screenshots/${name}.png`, fullPage: path.includes('/why') });
		await ctx.close();
	});
}
