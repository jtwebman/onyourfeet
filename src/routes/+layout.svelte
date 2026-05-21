<script lang="ts">
	import type { Pathname } from '$app/types';
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
	import SoundSettings from '$lib/SoundSettings.svelte';
	import ThemeToggle from '$lib/ThemeToggle.svelte';
	import { timer } from '$lib/timer.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		timer.init({ dev: dev && params.has('dev') });
		document.documentElement.dataset.hydrated = 'true';
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="fixed top-3 right-3 z-50 flex items-center gap-1">
	<ThemeToggle />
	<SoundSettings />
	<LanguageSwitcher />
</div>

{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
