<script lang="ts">
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';

	const NAMES: Record<string, string> = {
		en: 'English',
		es: 'Español',
		pt: 'Português',
		fr: 'Français',
		de: 'Deutsch',
		it: 'Italiano',
		nl: 'Nederlands',
		pl: 'Polski',
		ru: 'Русский',
		ja: '日本語',
		ko: '한국어',
		zh: '中文',
		hi: 'हिन्दी'
	};

	const current = $derived(getLocale());

	function onChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		const newLocale = target.value as (typeof locales)[number];
		if (newLocale !== current) {
			setLocale(newLocale);
		}
	}
</script>

<label class="relative">
	<span class="sr-only">Language</span>
	<select
		value={current}
		onchange={onChange}
		data-testid="language-switcher"
		class="cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-600 transition hover:bg-zinc-200/60 hover:text-zinc-900 focus:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
	>
		{#each locales as locale (locale)}
			<option value={locale} class="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
				{NAMES[locale] ?? locale}
			</option>
		{/each}
	</select>
	<svg
		class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400"
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
</label>
