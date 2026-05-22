<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CUSTOM_SOUND_MAX_BYTES,
		CUSTOM_SOUND_NAME_KEY,
		CUSTOM_SOUND_STORAGE_KEY,
		DEFAULT_DONE_SOUND,
		DEFAULT_STANDUP_SOUND,
		DONE_SOUND_STORAGE_KEY,
		SOUND_STORAGE_KEY,
		isSoundKind,
		playSound,
		type SoundKind
	} from '$lib/sounds';
	import * as m from '$lib/paraglide/messages.js';

	type Target = 'standUp' | 'done';

	let standUpKind = $state<SoundKind>(DEFAULT_STANDUP_SOUND);
	let doneKind = $state<SoundKind>(DEFAULT_DONE_SOUND);
	let customSound = $state<string | null>(null);
	let customSoundName = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let isOpen = $state(false);
	let pendingTarget = $state<Target | null>(null);

	let panelEl = $state<HTMLElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	onMount(() => {
		const stand = localStorage.getItem(SOUND_STORAGE_KEY);
		if (stand && isSoundKind(stand)) standUpKind = stand;
		const done = localStorage.getItem(DONE_SOUND_STORAGE_KEY);
		if (done && isSoundKind(done)) doneKind = done;
		customSound = localStorage.getItem(CUSTOM_SOUND_STORAGE_KEY);
		customSoundName = localStorage.getItem(CUSTOM_SOUND_NAME_KEY);
	});

	$effect(() => {
		if (!isOpen) return;
		function onDocClick(e: MouseEvent) {
			if (panelEl && !panelEl.contains(e.target as Node)) {
				isOpen = false;
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') isOpen = false;
		}
		document.addEventListener('mousedown', onDocClick, true);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDocClick, true);
			document.removeEventListener('keydown', onKey);
		};
	});

	function toggle() {
		isOpen = !isOpen;
		errorMessage = null;
	}

	function applyKind(target: Target, next: SoundKind, preview: boolean) {
		if (target === 'standUp') {
			standUpKind = next;
			localStorage.setItem(SOUND_STORAGE_KEY, next);
		} else {
			doneKind = next;
			localStorage.setItem(DONE_SOUND_STORAGE_KEY, next);
		}
		if (preview) playSound(next, customSound);
	}

	function onSelect(target: Target, event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const value = select.value;
		if (!isSoundKind(value)) return;
		errorMessage = null;
		if (value === 'custom' && !customSound) {
			pendingTarget = target;
			fileInput?.click();
			select.value = target === 'standUp' ? standUpKind : doneKind;
			return;
		}
		applyKind(target, value, true);
	}

	function openFilePicker() {
		errorMessage = null;
		fileInput?.click();
	}

	function clearCustomSound() {
		try {
			localStorage.removeItem(CUSTOM_SOUND_STORAGE_KEY);
			localStorage.removeItem(CUSTOM_SOUND_NAME_KEY);
		} catch {
			// ignore
		}
		customSound = null;
		customSoundName = null;
		errorMessage = null;
		// Revert any dropdown using 'custom' to its default
		if (standUpKind === 'custom') applyKind('standUp', DEFAULT_STANDUP_SOUND, false);
		if (doneKind === 'custom') applyKind('done', DEFAULT_DONE_SOUND, false);
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
				localStorage.setItem(CUSTOM_SOUND_NAME_KEY, file.name);
				customSound = dataUrl;
				customSoundName = file.name;
				if (pendingTarget) {
					applyKind(pendingTarget, 'custom', true);
					pendingTarget = null;
				} else {
					// Replace flow — preview the new file directly
					playSound('custom', dataUrl);
				}
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

{#snippet options(customLabel: string)}
	<option value="beeps">{m.sound_beeps()}</option>
	<option value="bell">{m.sound_bell()}</option>
	<option value="chimes">{m.sound_chimes()}</option>
	<option value="knock">{m.sound_knock()}</option>
	<option value="silent">{m.sound_silent()}</option>
	<option value="custom">{customLabel}</option>
{/snippet}

<div class="relative">
	<button
		type="button"
		onclick={toggle}
		aria-label={m.sound_settings_label()}
		aria-expanded={isOpen}
		title={m.sound_settings_label()}
		data-testid="sound-settings-button"
		class="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
	>
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
			<path d="M11 5 6 9H2v6h4l5 4z" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
		</svg>
	</button>

	{#if isOpen}
		<div
			bind:this={panelEl}
			data-testid="sound-settings-panel"
			class="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
		>
			<div class="space-y-3">
				<label class="block">
					<span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
						{m.sound_standup_label()}
					</span>
					<select
						value={standUpKind}
						onchange={(e) => onSelect('standUp', e)}
						data-testid="standup-sound-select"
						class="mt-1 w-full cursor-pointer rounded-md border border-zinc-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-700 transition hover:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
					>
						{@render options(customSound ? m.sound_custom_saved() : m.sound_custom_choose())}
					</select>
				</label>
				<label class="block">
					<span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
						{m.sound_done_label()}
					</span>
					<select
						value={doneKind}
						onchange={(e) => onSelect('done', e)}
						data-testid="done-sound-select"
						class="mt-1 w-full cursor-pointer rounded-md border border-zinc-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-700 transition hover:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
					>
						{@render options(customSound ? m.sound_custom_saved() : m.sound_custom_choose())}
					</select>
				</label>
			</div>
			<input
				type="file"
				accept="audio/*"
				class="hidden"
				bind:this={fileInput}
				onchange={onFileChange}
				data-testid="sound-file-input"
			/>

			{#if customSound}
				<div
					data-testid="custom-sound-row"
					class="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
				>
					<div class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
						{m.sound_custom_current_label()}
					</div>
					<div
						data-testid="custom-sound-name"
						class="mt-1 truncate text-sm text-zinc-900 dark:text-zinc-100"
						title={customSoundName ?? ''}
					>
						{customSoundName ?? m.sound_custom_saved()}
					</div>
					<div class="mt-2 flex gap-3">
						<button
							type="button"
							onclick={openFilePicker}
							data-testid="custom-sound-replace"
							class="text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
						>
							{m.sound_custom_replace()}
						</button>
						<button
							type="button"
							onclick={clearCustomSound}
							data-testid="custom-sound-clear"
							class="text-xs text-zinc-500 underline hover:text-zinc-700 hover:no-underline dark:hover:text-zinc-300"
						>
							{m.sound_custom_clear()}
						</button>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<p class="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
			{/if}
			<p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
				{m.sound_settings_hint()}
			</p>
		</div>
	{/if}
</div>
