<script lang="ts">
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';
	import { timer } from '$lib/timer.svelte';

	const canonicalUrl = $derived(`https://onyourfeet.app/${getLocale()}/`);

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: 'On Your Feet',
			alternateName: ['Stand-Up Reminder', 'Desk Break Timer'],
			url: canonicalUrl,
			description: m.meta_description(),
			applicationCategory: 'HealthApplication',
			applicationSubCategory: 'Wellness',
			operatingSystem: 'Web Browser',
			browserRequirements: 'Requires JavaScript',
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
			license: 'https://www.gnu.org/licenses/agpl-3.0.html',
			inLanguage: ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi'],
			keywords: [
				'desk break timer',
				'stand-up reminder',
				'work break timer',
				'walking break',
				'standing break',
				'sedentary health',
				'sitting timer',
				'office worker wellness',
				'pomodoro alternative',
				'movement break',
				'health timer'
			].join(', ')
		})
	);

	const unitLabel = $derived(
		timer.isDevMode ? m.timer_unit_seconds_short() : m.timer_unit_minutes_short()
	);

	const title = $derived(
		timer.phase === 'working' || timer.phase === 'standing'
			? `${formatDuration(timer.secondsLeft)} — ${m.app_name()}`
			: timer.phase === 'alert_work'
				? `${m.title_alert_stand()} — ${m.app_name()}`
				: timer.phase === 'alert_stand'
					? `${m.title_done()} — ${m.app_name()}`
					: m.app_name()
	);

	function formatInt(n: number): string {
		return new Intl.NumberFormat(getLocale()).format(n);
	}

	function formatDuration(seconds: number): string {
		const locale = getLocale();
		const min = Math.floor(seconds / 60);
		const sec = seconds % 60;
		const minStr = new Intl.NumberFormat(locale, { useGrouping: false }).format(min);
		const secStr = new Intl.NumberFormat(locale, {
			useGrouping: false,
			minimumIntegerDigits: 2
		}).format(sec);
		return `${minStr}:${secStr}`;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={m.meta_description()} />
	<meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={m.app_name()} />
	<meta property="og:title" content={m.app_name()} />
	<meta property="og:description" content={m.meta_description()} />
	<meta property="og:image" content="https://onyourfeet.app/og-image.png" />
	<meta property="og:url" content={canonicalUrl} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={m.app_name()} />
	<meta name="twitter:description" content={m.meta_description()} />
	<meta name="twitter:image" content="https://onyourfeet.app/og-image.png" />

	<link rel="canonical" href={canonicalUrl} />
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<main
	class="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
>
	{#if timer.isDevMode}
		<div
			data-testid="dev-badge"
			class="fixed top-3 left-3 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300"
		>
			Dev
		</div>
	{/if}

	<a
		href={localizeHref('/why')}
		class="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
	>
		{m.timer_why_link()}
	</a>

	<div class="w-full max-w-md text-center">
		<h1 class="mb-12 text-2xl font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
			{m.app_name()}
		</h1>

		{#if timer.phase === 'idle'}
			<div class="space-y-8">
				<div class="text-sm text-zinc-500 dark:text-zinc-400">{m.timer_work_for()}</div>
				<div class="flex justify-center gap-3">
					{#each timer.presets as d (d)}
						<button
							type="button"
							aria-pressed={timer.workValue === d}
							onclick={() => timer.selectPreset(d)}
							class="rounded-full border px-4 py-2 transition {timer.workValue === d
								? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
								: 'border-zinc-300 text-zinc-500 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500'}"
						>
							{formatInt(d)}
							{unitLabel}
						</button>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => timer.start()}
					class="w-full rounded-2xl bg-emerald-500 py-6 text-lg font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 dark:text-zinc-950"
				>
					{m.timer_start()}
				</button>
				{#if timer.notificationPermission === 'denied'}
					<div
						data-testid="notification-denied-banner"
						class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
					>
						{m.notification_denied_banner()}
					</div>
				{:else if timer.notificationPermission === 'default'}
					<button
						type="button"
						onclick={() => timer.requestNotificationPermission()}
						data-testid="enable-notifications"
						class="text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
					>
						{m.notification_enable_link()}
					</button>
				{/if}
			</div>
		{:else if timer.phase === 'working'}
			<div class="space-y-8">
				<div class="text-sm text-zinc-500 dark:text-zinc-400">{m.timer_next_break_in()}</div>
				<div class="font-mono text-7xl font-light tabular-nums">
					{formatDuration(timer.secondsLeft)}
				</div>
				<button
					type="button"
					onclick={() => timer.reset()}
					class="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
				>
					{m.timer_cancel()}
				</button>
			</div>
		{:else if timer.phase === 'alert_work'}
			<div class="space-y-6">
				<div
					data-testid="alert-heading"
					class="text-3xl font-semibold text-emerald-700 dark:text-emerald-400"
				>
					{m.timer_time_to_stand()}
				</div>
				<p class="text-zinc-500 dark:text-zinc-400">{m.timer_take_walk()}</p>
				{#if timer.alertCount > 1}
					<p
						data-testid="alert-count"
						class="text-xs text-zinc-400 tabular-nums dark:text-zinc-500"
					>
						{m.alert_repeated_count({ count: timer.alertCount })}
					</p>
				{/if}
				<div class="flex flex-col gap-3 pt-2">
					<button
						type="button"
						onclick={() => timer.startStanding()}
						class="w-full rounded-2xl bg-emerald-500 py-5 font-semibold text-white transition hover:bg-emerald-400 dark:text-zinc-950"
					>
						{m.timer_im_standing()}
					</button>
					<button
						type="button"
						onclick={() => timer.snooze()}
						class="w-full rounded-2xl border border-zinc-300 py-4 text-zinc-700 transition hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
					>
						{m.timer_snooze()}
					</button>
				</div>
			</div>
		{:else if timer.phase === 'standing'}
			<div class="space-y-8">
				<div class="text-sm text-zinc-500 dark:text-zinc-400">{m.timer_walk_it_out()}</div>
				<div
					class="font-mono text-7xl font-light text-emerald-700 tabular-nums dark:text-emerald-400"
				>
					{formatDuration(timer.secondsLeft)}
				</div>
				<button
					type="button"
					onclick={() => timer.reset()}
					class="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
				>
					{m.timer_end_early()}
				</button>
			</div>
		{:else if timer.phase === 'alert_stand'}
			<div class="space-y-6">
				<div class="text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
					{m.timer_nice_work()}
				</div>
				<p class="text-zinc-500 dark:text-zinc-400">{m.timer_hit_start_again()}</p>
				<div class="flex flex-col gap-3 pt-2">
					<button
						type="button"
						onclick={() => timer.start()}
						data-testid="restart-timer"
						class="w-full rounded-2xl bg-emerald-500 py-5 font-semibold text-white transition hover:bg-emerald-400 dark:text-zinc-950"
					>
						{m.timer_start_another({ minutes: formatInt(timer.workValue), unit: unitLabel })}
					</button>
					<button
						type="button"
						onclick={() => timer.reset()}
						class="w-full rounded-2xl border border-zinc-300 py-4 text-zinc-700 transition hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
					>
						{m.timer_done()}
					</button>
				</div>
			</div>
		{/if}
	</div>
</main>
