import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testIgnore: ['**/*.gen.ts'],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:5173',
		permissions: ['notifications'],
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		timeout: 60_000
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
