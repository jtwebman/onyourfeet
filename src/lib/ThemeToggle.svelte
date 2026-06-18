<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type Theme = 'system' | 'light' | 'dark';
	const STORAGE_KEY = 'onyourfeet:theme';
	const ORDER: Theme[] = ['system', 'light', 'dark'];

	let theme = $state<Theme>('system');
	let mediaQuery: MediaQueryList | null = null;

	onMount(() => {
		const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
		if (saved && ORDER.includes(saved)) theme = saved;
		applyTheme(theme);

		mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemChange);
	});

	onDestroy(() => {
		mediaQuery?.removeEventListener('change', handleSystemChange);
	});

	function handleSystemChange() {
		if (theme === 'system') applyTheme('system');
	}

	function applyTheme(t: Theme) {
		const html = document.documentElement;
		const isDark =
			t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		html.classList.toggle('dark', isDark);
	}

	function cycle() {
		const idx = ORDER.indexOf(theme);
		theme = ORDER[(idx + 1) % ORDER.length];
		localStorage.setItem(STORAGE_KEY, theme);
		applyTheme(theme);
	}

	const label = $derived(
		theme === 'system' ? 'System theme' : theme === 'light' ? 'Light theme' : 'Dark theme'
	);
</script>

<button
	type="button"
	onclick={cycle}
	aria-label={label}
	title={label}
	data-testid="theme-toggle"
	data-theme={theme}
	class="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
>
	{#if theme === 'system'}
		<!-- laptop / auto -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<rect x="3" y="4" width="18" height="12" rx="2" />
			<path d="M2 20h20" />
		</svg>
	{:else if theme === 'light'}
		<!-- sun -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
			/>
		</svg>
	{:else}
		<!-- moon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{/if}
</button>
