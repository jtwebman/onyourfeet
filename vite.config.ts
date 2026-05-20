import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const LOCALES = ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi'];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
			urlPatterns: [
				{
					pattern: '/:path(.*)?',
					localized: LOCALES.map((locale) => [locale, `/${locale}/:path(.*)?`])
				}
			]
		})
	]
});
