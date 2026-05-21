<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CUSTOM_SOUND_MAX_BYTES,
		CUSTOM_SOUND_STORAGE_KEY,
		SOUND_STORAGE_KEY,
		isSoundKind,
		playSound,
		type SoundKind
	} from '$lib/sounds';
	import * as m from '$lib/paraglide/messages.js';

	let kind = $state<SoundKind>('beeps');
	let customSound = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	onMount(() => {
		const saved = localStorage.getItem(SOUND_STORAGE_KEY);
		if (saved && isSoundKind(saved)) kind = saved;
		customSound = localStorage.getItem(CUSTOM_SOUND_STORAGE_KEY);
	});

	function applyKind(next: SoundKind, preview: boolean) {
		kind = next;
		localStorage.setItem(SOUND_STORAGE_KEY, next);
		if (preview) playSound(next, customSound);
	}

	function onSelect(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (!isSoundKind(value)) return;
		errorMessage = null;

		if (value === 'custom' && !customSound) {
			fileInput?.click();
			// Don't actually switch yet; wait for file load
			(event.currentTarget as HTMLSelectElement).value = kind;
			return;
		}
		applyKind(value, true);
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (file.size > CUSTOM_SOUND_MAX_BYTES) {
			errorMessage = m.sound_too_large();
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			if (typeof dataUrl !== 'string') return;
			try {
				localStorage.setItem(CUSTOM_SOUND_STORAGE_KEY, dataUrl);
				customSound = dataUrl;
				applyKind('custom', true);
			} catch {
				errorMessage = m.sound_storage_error();
			}
		};
		reader.onerror = () => {
			errorMessage = m.sound_storage_error();
		};
		reader.readAsDataURL(file);
	}
</script>

<div class="relative">
	<label class="relative block">
		<span class="sr-only">{m.sound_label()}</span>
		<select
			value={kind}
			onchange={onSelect}
			data-testid="sound-switcher"
			class="cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-600 transition hover:bg-zinc-200/60 hover:text-zinc-900 focus:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
		>
			<option value="beeps">{m.sound_beeps()}</option>
			<option value="bell">{m.sound_bell()}</option>
			<option value="chimes">{m.sound_chimes()}</option>
			<option value="knock">{m.sound_knock()}</option>
			<option value="silent">{m.sound_silent()}</option>
			<option value="custom">{customSound ? m.sound_custom_saved() : m.sound_custom_choose()}</option>
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
	<input
		type="file"
		accept="audio/*"
		class="hidden"
		bind:this={fileInput}
		onchange={onFileChange}
		data-testid="sound-file-input"
	/>
	{#if errorMessage}
		<span
			class="absolute top-full right-0 mt-1 max-w-xs rounded bg-red-600 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg"
		>
			{errorMessage}
		</span>
	{/if}
</div>
