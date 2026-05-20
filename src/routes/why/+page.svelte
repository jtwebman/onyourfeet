<script lang="ts">
	import { baseLocale, getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';

	const locale = $derived(getLocale());
	const isTranslated = $derived(locale !== baseLocale);
</script>

<svelte:head>
	<title>{m.why_title()} — {m.app_name()}</title>
	<meta name="description" content={m.why_meta_description()} />
</svelte:head>

<div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
	<header class="mx-auto flex max-w-2xl items-center justify-between px-6 pt-6">
		<a
			href={localizeHref('/')}
			class="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
		>
			{m.why_back_to_timer()}
		</a>
		<span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{m.app_name()}</span>
	</header>

	<main class="mx-auto max-w-2xl px-6 py-12">
		{#if isTranslated}
			<div
				data-testid="translation-notice"
				class="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
			>
				{m.why_translation_notice()}<a
					href="/en/why"
					data-sveltekit-reload
					class="font-semibold underline hover:no-underline">{m.why_translation_notice_link()}</a
				>.
			</div>
		{/if}

		<h1 class="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{m.why_title()}</h1>

		<p class="mb-6 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
			{m.why_intro()}
		</p>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_headline()}</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{m.why_headline_p1()}<a
					href="#cite-1"
					class="text-emerald-600 hover:underline dark:text-emerald-400">[1]</a
				>
			</p>
			<ul class="ml-5 list-disc space-y-2 text-zinc-700 dark:text-zinc-300">
				<li>{m.why_headline_bullet1()}</li>
				<li>{m.why_headline_bullet2()}</li>
				<li>{m.why_headline_bullet3()}</li>
			</ul>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">{m.why_headline_caveat()}</p>
		</section>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_sitting()}</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{m.why_sitting_p1()}<a
					href="#cite-2"
					class="text-emerald-600 hover:underline dark:text-emerald-400">[2]</a
				>
			</p>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">{m.why_sitting_p2()}</p>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">{m.why_sitting_p3()}</p>
		</section>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_who()}</h2>
			<blockquote
				class="border-l-2 border-emerald-500 pl-4 italic text-zinc-700 dark:text-zinc-300"
			>
				{m.why_who_quote()}<a
					href="#cite-3"
					class="text-emerald-600 not-italic hover:underline dark:text-emerald-400">[3]</a
				>
			</blockquote>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">{m.why_who_caveat()}</p>
		</section>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_app()}</h2>
			<ul class="ml-5 list-disc space-y-2 text-zinc-700 dark:text-zinc-300">
				<li>{m.why_app_bullet1()}</li>
				<li>{m.why_app_bullet2()}</li>
				<li>{m.why_app_bullet3()}</li>
				<li>{m.why_app_bullet4()}</li>
			</ul>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">{m.why_app_outro()}</p>
		</section>

		<section class="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase">{m.why_references()}</h2>
			<ol class="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
				<li id="cite-1">
					<span class="font-semibold text-zinc-700 dark:text-zinc-300">[1]</span> Duran AT, Friel CP,
					Serafini MA, Ensari I, Cheung YK, Diaz KM.
					<em
						>Breaking Up Prolonged Sitting to Improve Cardiometabolic Risk: Dose-Response Analysis
						of a Randomized Crossover Trial.</em
					>
					<em>Medicine &amp; Science in Sports &amp; Exercise</em>. 2023;55(5):847–855.
					<a
						href="https://pubmed.ncbi.nlm.nih.gov/36728338/"
						target="_blank"
						rel="noopener"
						class="text-emerald-600 hover:underline dark:text-emerald-400">PubMed</a
					>
				</li>
				<li id="cite-2">
					<span class="font-semibold text-zinc-700 dark:text-zinc-300">[2]</span> Ekelund U,
					Steene-Johannessen J, Brown WJ, et al.
					<em
						>Does physical activity attenuate, or even eliminate, the detrimental association of
						sitting time with mortality? A harmonised meta-analysis of data from more than 1 million
						men and women.</em
					>
					<em>The Lancet</em>. 2016;388(10051):1302–1310.
					<a
						href="https://pubmed.ncbi.nlm.nih.gov/27475271/"
						target="_blank"
						rel="noopener"
						class="text-emerald-600 hover:underline dark:text-emerald-400">PubMed</a
					>
				</li>
				<li id="cite-3">
					<span class="font-semibold text-zinc-700 dark:text-zinc-300">[3]</span> Bull FC, Al-Ansari
					SS, Biddle S, et al.
					<em
						>World Health Organization 2020 guidelines on physical activity and sedentary
						behaviour.</em
					>
					<em>British Journal of Sports Medicine</em>. 2020;54(24):1451–1462.
					<a
						href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/"
						target="_blank"
						rel="noopener"
						class="text-emerald-600 hover:underline dark:text-emerald-400">PMC</a
					>
				</li>
			</ol>
		</section>
	</main>
</div>
