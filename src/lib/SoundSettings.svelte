<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CUSTOM_SOUND_KEYS,
		CUSTOM_SOUND_MAX_BYTES,
		DEFAULT_DONE_SOUND,
		DEFAULT_STANDUP_SOUND,
		DONE_SOUND_STORAGE_KEY,
		SOUND_STORAGE_KEY,
		isSoundKind,
		migrateLegacyCustomSound,
		playSound,
		type SoundKind
	} from '$lib/sounds';
	import * as m from '$lib/paraglide/messages.js';

	type Target = 'standUp' | 'done';

	interface AlarmSlot {
		kind: SoundKind;
		customSound: string | null;
		customSoundName: string | null;
	}

	const DEFAULTS: Record<Target, SoundKind> = {
		standUp: DEFAULT_STANDUP_SOUND,
		done: DEFAULT_DONE_SOUND
	};

	const KIND_STORAGE: Record<Target, string> = {
		standUp: SOUND_STORAGE_KEY,
		done: DONE_SOUND_STORAGE_KEY
	};

	let standUp = $state<AlarmSlot>({
		kind: DEFAULT_STANDUP_SOUND,
		customSound: null,
		customSoundName: null
	});
	let done = $state<AlarmSlot>({
		kind: DEFAULT_DONE_SOUND,
		customSound: null,
		customSoundName: null
	});

	let errorMessage = $state<string | null>(null);
	let isOpen = $state(false);
	let pendingTarget = $state<Target | null>(null);
	let editingTarget = $state<Target | null>(null);
	let editingName = $state('');

	let panelEl = $state<HTMLElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let editingInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (editingTarget && editingInputEl) editingInputEl.focus();
	});

	function slotFor(target: Target): AlarmSlot {
		return target === 'standUp' ? standUp : done;
	}

	function setSlot(target: Target, next: AlarmSlot) {
		if (target === 'standUp') standUp = next;
		else done = next;
	}

	onMount(() => {
		migrateLegacyCustomSound();

		const standKind = localStorage.getItem(SOUND_STORAGE_KEY);
		const doneKind = localStorage.getItem(DONE_SOUND_STORAGE_KEY);

		standUp = {
			kind: standKind && isSoundKind(standKind) ? standKind : DEFAULT_STANDUP_SOUND,
			customSound: localStorage.getItem(CUSTOM_SOUND_KEYS.standUp.data),
			customSoundName: localStorage.getItem(CUSTOM_SOUND_KEYS.standUp.name)
		};
		done = {
			kind: doneKind && isSoundKind(doneKind) ? doneKind : DEFAULT_DONE_SOUND,
			customSound: localStorage.getItem(CUSTOM_SOUND_KEYS.done.data),
			customSoundName: localStorage.getItem(CUSTOM_SOUND_KEYS.done.name)
		};
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
		const slot = slotFor(target);
		setSlot(target, { ...slot, kind: next });
		localStorage.setItem(KIND_STORAGE[target], next);
		if (preview) playSound(next, slot.customSound);
	}

	function onSelect(target: Target, event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const value = select.value;
		if (!isSoundKind(value)) return;
		errorMessage = null;
		const slot = slotFor(target);
		if (value === 'custom' && !slot.customSound) {
			pendingTarget = target;
			fileInput?.click();
			select.value = slot.kind;
			return;
		}
		applyKind(target, value, true);
	}

	function openFilePicker(target: Target) {
		errorMessage = null;
		pendingTarget = target;
		fileInput?.click();
	}

	function clearCustomSound(target: Target) {
		try {
			localStorage.removeItem(CUSTOM_SOUND_KEYS[target].data);
			localStorage.removeItem(CUSTOM_SOUND_KEYS[target].name);
		} catch {
			// ignore
		}
		const slot = slotFor(target);
		const reverted: SoundKind = slot.kind === 'custom' ? DEFAULTS[target] : slot.kind;
		setSlot(target, { kind: reverted, customSound: null, customSoundName: null });
		if (slot.kind === 'custom') {
			localStorage.setItem(KIND_STORAGE[target], reverted);
		}
		errorMessage = null;
	}

	function startRename(target: Target) {
		const slot = slotFor(target);
		editingName = slot.customSoundName ?? '';
		editingTarget = target;
		errorMessage = null;
	}

	function saveRename() {
		const target = editingTarget;
		if (!target) return;
		const name = editingName.trim();
		const slot = slotFor(target);
		if (name && name !== slot.customSoundName) {
			setSlot(target, { ...slot, customSoundName: name });
			try {
				localStorage.setItem(CUSTOM_SOUND_KEYS[target].name, name);
			} catch {
				errorMessage = m.sound_storage_error();
			}
		}
		editingTarget = null;
	}

	function cancelRename() {
		editingTarget = null;
	}

	function onRenameKey(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			saveRename();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			cancelRename();
		}
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		const target = pendingTarget;
		pendingTarget = null;
		if (!file || !target) return;
		if (file.size > CUSTOM_SOUND_MAX_BYTES) {
			errorMessage = m.sound_too_large();
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			if (typeof dataUrl !== 'string') return;
			try {
				localStorage.setItem(CUSTOM_SOUND_KEYS[target].data, dataUrl);
				localStorage.setItem(CUSTOM_SOUND_KEYS[target].name, file.name);
				setSlot(target, { kind: 'custom', customSound: dataUrl, customSoundName: file.name });
				localStorage.setItem(KIND_STORAGE[target], 'custom');
				playSound('custom', dataUrl);
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

{#snippet customCard(target: Target, slot: AlarmSlot)}
	{#if slot.customSound}
		<div
			data-testid={target === 'standUp' ? 'standup-custom-row' : 'done-custom-row'}
			class="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/50"
		>
			<div class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
				{m.sound_custom_current_label()}
			</div>
			{#if editingTarget === target}
				<input
					bind:this={editingInputEl}
					bind:value={editingName}
					onkeydown={onRenameKey}
					onblur={saveRename}
					data-testid={target === 'standUp' ? 'standup-custom-rename-input' : 'done-custom-rename-input'}
					class="mt-0.5 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
				/>
				<div class="mt-1.5 flex gap-3">
					<button
						type="button"
						onmousedown={(e) => e.preventDefault()}
						onclick={saveRename}
						data-testid={target === 'standUp' ? 'standup-custom-rename-save' : 'done-custom-rename-save'}
						class="text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
					>
						{m.sound_custom_rename_save()}
					</button>
					<button
						type="button"
						onmousedown={(e) => e.preventDefault()}
						onclick={cancelRename}
						data-testid={target === 'standUp' ? 'standup-custom-rename-cancel' : 'done-custom-rename-cancel'}
						class="text-xs text-zinc-500 underline hover:text-zinc-700 hover:no-underline dark:hover:text-zinc-300"
					>
						{m.sound_custom_rename_cancel()}
					</button>
				</div>
			{:else}
				<div
					data-testid={target === 'standUp' ? 'standup-custom-name' : 'done-custom-name'}
					class="mt-0.5 truncate text-sm text-zinc-900 dark:text-zinc-100"
					title={slot.customSoundName ?? ''}
				>
					{slot.customSoundName ?? m.sound_custom_saved()}
				</div>
				<div class="mt-1.5 flex gap-3">
					<button
						type="button"
						onclick={() => startRename(target)}
						data-testid={target === 'standUp' ? 'standup-custom-rename' : 'done-custom-rename'}
						class="text-xs text-zinc-500 underline hover:text-zinc-700 hover:no-underline dark:hover:text-zinc-300"
					>
						{m.sound_custom_rename()}
					</button>
					<button
						type="button"
						onclick={() => openFilePicker(target)}
						data-testid={target === 'standUp' ? 'standup-custom-replace' : 'done-custom-replace'}
						class="text-xs text-emerald-700 underline hover:no-underline dark:text-emerald-400"
					>
						{m.sound_custom_replace()}
					</button>
					<button
						type="button"
						onclick={() => clearCustomSound(target)}
						data-testid={target === 'standUp' ? 'standup-custom-clear' : 'done-custom-clear'}
						class="text-xs text-zinc-500 underline hover:text-zinc-700 hover:no-underline dark:hover:text-zinc-300"
					>
						{m.sound_custom_clear()}
					</button>
				</div>
			{/if}
		</div>
	{/if}
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
			<div class="space-y-4">
				<div>
					<label class="block">
						<span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
							{m.sound_standup_label()}
						</span>
						<select
							value={standUp.kind}
							onchange={(e) => onSelect('standUp', e)}
							data-testid="standup-sound-select"
							class="mt-1 w-full cursor-pointer rounded-md border border-zinc-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-700 transition hover:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
						>
							{@render options(
								standUp.customSound ? m.sound_custom_saved() : m.sound_custom_choose()
							)}
						</select>
					</label>
					{@render customCard('standUp', standUp)}
				</div>
				<div>
					<label class="block">
						<span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
							{m.sound_done_label()}
						</span>
						<select
							value={done.kind}
							onchange={(e) => onSelect('done', e)}
							data-testid="done-sound-select"
							class="mt-1 w-full cursor-pointer rounded-md border border-zinc-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-zinc-700 transition hover:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
						>
							{@render options(done.customSound ? m.sound_custom_saved() : m.sound_custom_choose())}
						</select>
					</label>
					{@render customCard('done', done)}
				</div>
			</div>
			<input
				type="file"
				accept="audio/*"
				class="hidden"
				bind:this={fileInput}
				onchange={onFileChange}
				data-testid="sound-file-input"
			/>

			{#if errorMessage}
				<p class="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
			{/if}
			<p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
				{m.sound_settings_hint()}
			</p>
		</div>
	{/if}
</div>
