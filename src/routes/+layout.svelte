<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
	import SoundSwitcher from '$lib/SoundSwitcher.svelte';
	import ThemeToggle from '$lib/ThemeToggle.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		document.documentElement.dataset.hydrated = 'true';
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="fixed top-3 right-3 z-50 flex items-center gap-1">
	<ThemeToggle />
	<SoundSwitcher />
	<LanguageSwitcher />
</div>

{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
