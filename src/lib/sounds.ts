export type SoundKind = 'beeps' | 'bell' | 'chimes' | 'knock' | 'silent' | 'custom';

export const SOUND_KINDS: ReadonlyArray<SoundKind> = [
	'beeps',
	'bell',
	'chimes',
	'knock',
	'silent',
	'custom'
];

export const SOUND_STORAGE_KEY = 'onyourfeet:sound';
export const DONE_SOUND_STORAGE_KEY = 'onyourfeet:doneSound';

export const CUSTOM_SOUND_KEYS = {
	standUp: {
		data: 'onyourfeet:customSoundStandUp',
		name: 'onyourfeet:customSoundStandUpName'
	},
	done: {
		data: 'onyourfeet:customSoundDone',
		name: 'onyourfeet:customSoundDoneName'
	}
} as const;

/** Legacy shared-custom keys from before the per-alarm split. Migrated on mount. */
export const LEGACY_CUSTOM_SOUND_KEY = 'onyourfeet:customSound';
export const LEGACY_CUSTOM_SOUND_NAME_KEY = 'onyourfeet:customSoundName';

export const CUSTOM_SOUND_MAX_BYTES = 500_000;

export function migrateLegacyCustomSound() {
	try {
		const oldData = localStorage.getItem(LEGACY_CUSTOM_SOUND_KEY);
		if (!oldData) return;
		const oldName = localStorage.getItem(LEGACY_CUSTOM_SOUND_NAME_KEY);
		// Only seed the standUp slot if it's empty so we don't clobber a new upload.
		if (!localStorage.getItem(CUSTOM_SOUND_KEYS.standUp.data)) {
			localStorage.setItem(CUSTOM_SOUND_KEYS.standUp.data, oldData);
			if (oldName) localStorage.setItem(CUSTOM_SOUND_KEYS.standUp.name, oldName);
		}
		localStorage.removeItem(LEGACY_CUSTOM_SOUND_KEY);
		localStorage.removeItem(LEGACY_CUSTOM_SOUND_NAME_KEY);
	} catch {
		// ignore
	}
}

export const DEFAULT_STANDUP_SOUND: SoundKind = 'beeps';
export const DEFAULT_DONE_SOUND: SoundKind = 'chimes';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
	if (!audioCtx) {
		const Ctx =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioCtx = new Ctx();
	}
	return audioCtx;
}

function tone(
	freq: number,
	durationMs: number,
	delayMs: number,
	type: OscillatorType,
	peakGain: number
) {
	const ctx = getCtx();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	osc.connect(gain);
	gain.connect(ctx.destination);
	const start = ctx.currentTime + delayMs / 1000;
	const stop = start + durationMs / 1000;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
	gain.gain.setValueAtTime(peakGain, stop - 0.03);
	gain.gain.linearRampToValueAtTime(0, stop);
	osc.start(start);
	osc.stop(stop);
}

function playBeeps() {
	for (let i = 0; i < 3; i++) tone(880, 180, i * 280, 'sine', 0.25);
}

function playBell() {
	const ctx = getCtx();
	const start = ctx.currentTime;
	const duration = 0.9;
	for (const f of [660, 880]) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = f;
		osc.connect(gain);
		gain.connect(ctx.destination);
		gain.gain.setValueAtTime(0.22, start);
		gain.gain.exponentialRampToValueAtTime(0.0005, start + duration);
		osc.start(start);
		osc.stop(start + duration);
	}
}

function playChimes() {
	tone(1100, 150, 0, 'triangle', 0.2);
	tone(1320, 150, 200, 'triangle', 0.2);
	tone(1500, 220, 400, 'triangle', 0.22);
}

function playKnock() {
	tone(200, 70, 0, 'square', 0.18);
	tone(200, 70, 160, 'square', 0.18);
}

function playCustom(dataUrl: string | null | undefined) {
	if (!dataUrl) {
		playBeeps();
		return;
	}
	const audio = new Audio(dataUrl);
	audio.volume = 0.6;
	audio.play().catch(() => playBeeps());
}

export function playSound(kind: SoundKind, customDataUrl?: string | null) {
	switch (kind) {
		case 'beeps':
			playBeeps();
			break;
		case 'bell':
			playBell();
			break;
		case 'chimes':
			playChimes();
			break;
		case 'knock':
			playKnock();
			break;
		case 'silent':
			break;
		case 'custom':
			playCustom(customDataUrl);
			break;
	}
}

export function isSoundKind(value: unknown): value is SoundKind {
	return typeof value === 'string' && (SOUND_KINDS as ReadonlyArray<string>).includes(value);
}
