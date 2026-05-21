import { browser } from '$app/environment';
import * as m from '$lib/paraglide/messages.js';
import {
	CUSTOM_SOUND_STORAGE_KEY,
	DEFAULT_DONE_SOUND,
	DEFAULT_STANDUP_SOUND,
	DONE_SOUND_STORAGE_KEY,
	SOUND_STORAGE_KEY,
	isSoundKind,
	playSound
} from '$lib/sounds';

export type TimerPhase = 'idle' | 'working' | 'alert_work' | 'standing' | 'alert_stand';

export const TIMER_STATE_KEY = 'onyourfeet:timerState';
export const WORK_DURATION_KEY = 'onyourfeet:workMinutes';
export const STALE_THRESHOLD_MS = 45 * 60 * 1000;

export const PRESETS_PROD = [30, 45, 60] as const;
export const PRESETS_DEV = [1, 5, 10] as const;
const SNOOZE_SECONDS = 5 * 60;
const STAND_SECONDS = 5 * 60;

const ALERT_MAX_REPEATS = 10;
const ALERT_INTERVAL_PROD_MS = 30_000;
const ALERT_INTERVAL_DEV_MS = 600;

interface PersistedState {
	phase: TimerPhase;
	workValue: number;
	/** ms timestamp when the active countdown ends. Set for working/standing. */
	endAt?: number;
	/** ms timestamp when the alarm first fired. Set for alert_work/alert_stand. */
	alertStartedAt?: number;
}

class TimerStore {
	phase = $state<TimerPhase>('idle');
	workValue = $state(45);
	secondsLeft = $state(0);
	alertCount = $state(0);
	isDevMode = $state(false);
	notificationPermission = $state<NotificationPermission>('default');

	private intervalId: number | null = null;
	private timeoutId: number | null = null;
	private alertRepeatId: number | null = null;
	private lastNotification: Notification | null = null;
	private initialized = false;

	private get multiplier(): number {
		return this.isDevMode ? 1 : 60;
	}

	private get workSeconds(): number {
		return this.workValue * this.multiplier;
	}

	private get snoozeSeconds(): number {
		return this.isDevMode ? 1 : SNOOZE_SECONDS;
	}

	private get standSeconds(): number {
		return this.isDevMode ? 1 : STAND_SECONDS;
	}

	private get alertIntervalMs(): number {
		return this.isDevMode ? ALERT_INTERVAL_DEV_MS : ALERT_INTERVAL_PROD_MS;
	}

	get presets(): ReadonlyArray<number> {
		return this.isDevMode ? PRESETS_DEV : PRESETS_PROD;
	}

	/** Call once on app mount from +layout.svelte. */
	init(opts: { dev: boolean }) {
		if (this.initialized || !browser) return;
		this.initialized = true;

		this.isDevMode = opts.dev;

		if (typeof Notification !== 'undefined') {
			this.notificationPermission = Notification.permission;
		}

		if (opts.dev) {
			this.workValue = PRESETS_DEV[0];
		} else {
			const saved = this.safeRead(WORK_DURATION_KEY);
			if (saved) {
				const n = parseInt(saved, 10);
				if (!Number.isNaN(n) && n > 0) this.workValue = n;
			}
		}

		this.restore();
	}

	selectPreset(d: number) {
		this.workValue = d;
		if (!this.isDevMode) this.safeWrite(WORK_DURATION_KEY, String(d));
	}

	async start() {
		await this.ensureNotificationPermission();
		if (!this.isDevMode) this.safeWrite(WORK_DURATION_KEY, String(this.workValue));
		this.beginCountdown('working', this.workSeconds);
	}

	snooze() {
		this.stopAlertLoop();
		this.beginCountdown('working', this.snoozeSeconds);
	}

	startStanding() {
		this.stopAlertLoop();
		this.beginCountdown('standing', this.standSeconds);
	}

	reset() {
		this.clearAll();
		this.secondsLeft = 0;
		this.phase = 'idle';
		this.clearPersisted();
	}

	async requestNotificationPermission() {
		if (typeof Notification === 'undefined') return;
		const result = await Notification.requestPermission();
		this.notificationPermission = result;
	}

	private beginCountdown(target: 'working' | 'standing', seconds: number) {
		const endAt = Date.now() + seconds * 1000;
		this.phase = target;
		this.persist({ phase: target, workValue: this.workValue, endAt });
		this.runCountdown(seconds, () => {
			if (target === 'working') this.fireStandUpAlarm();
			else this.fireDoneAlarm();
		});
	}

	private fireStandUpAlarm() {
		this.phase = 'alert_work';
		const alertStartedAt = Date.now();
		this.persist({ phase: 'alert_work', workValue: this.workValue, alertStartedAt });
		this.startAlertLoop(m.notify_time_to_stand());
	}

	private fireDoneAlarm() {
		this.phase = 'alert_stand';
		const alertStartedAt = Date.now();
		this.persist({ phase: 'alert_stand', workValue: this.workValue, alertStartedAt });
		this.playAlertSound('done');
		this.notify(m.notify_break_complete());
	}

	private runCountdown(seconds: number, onDone: () => void) {
		this.stopCountdown();
		const endAt = Date.now() + seconds * 1000;
		this.secondsLeft = seconds;
		this.intervalId = window.setInterval(() => {
			const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
			this.secondsLeft = remaining;
		}, 250);
		this.timeoutId = window.setTimeout(() => {
			this.stopCountdown();
			this.secondsLeft = 0;
			onDone();
		}, seconds * 1000);
	}

	private stopCountdown() {
		if (this.intervalId !== null) clearInterval(this.intervalId);
		if (this.timeoutId !== null) clearTimeout(this.timeoutId);
		this.intervalId = null;
		this.timeoutId = null;
	}

	private startAlertLoop(message: string) {
		this.stopAlertLoop();
		this.alertCount = 1;
		this.playAlertSound('standUp');
		this.notify(message);
		this.alertRepeatId = window.setInterval(() => {
			if (this.alertCount >= ALERT_MAX_REPEATS) {
				this.stopAlertLoop();
				return;
			}
			this.alertCount++;
			this.playAlertSound('standUp');
			this.notify(message);
		}, this.alertIntervalMs);
	}

	private stopAlertLoop() {
		if (this.alertRepeatId !== null) clearInterval(this.alertRepeatId);
		this.alertRepeatId = null;
		this.alertCount = 0;
		this.lastNotification?.close();
		this.lastNotification = null;
	}

	private clearAll() {
		this.stopCountdown();
		this.stopAlertLoop();
	}

	private playAlertSound(alarm: 'standUp' | 'done') {
		const key = alarm === 'standUp' ? SOUND_STORAGE_KEY : DONE_SOUND_STORAGE_KEY;
		const fallback = alarm === 'standUp' ? DEFAULT_STANDUP_SOUND : DEFAULT_DONE_SOUND;
		const saved = this.safeRead(key);
		const kind = saved && isSoundKind(saved) ? saved : fallback;
		const customSound = this.safeRead(CUSTOM_SOUND_STORAGE_KEY);
		playSound(kind, customSound);
	}

	private notify(message: string) {
		if (typeof Notification === 'undefined') return;
		if (Notification.permission !== 'granted') return;
		this.lastNotification?.close();
		const n = new Notification(m.app_name(), {
			body: message,
			tag: 'onyourfeet-alert',
			requireInteraction: true,
			silent: false
		});
		n.onclick = () => {
			window.focus();
			n.close();
		};
		this.lastNotification = n;
	}

	private async ensureNotificationPermission() {
		if (typeof Notification === 'undefined') return;
		if (Notification.permission === 'default') {
			this.notificationPermission = await Notification.requestPermission();
		}
	}

	private persist(state: PersistedState) {
		this.safeWrite(TIMER_STATE_KEY, JSON.stringify(state));
	}

	private clearPersisted() {
		this.safeRemove(TIMER_STATE_KEY);
	}

	private safeRead(key: string): string | null {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	}

	private safeWrite(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			// Ignore — private/incognito or storage full.
		}
	}

	private safeRemove(key: string) {
		try {
			localStorage.removeItem(key);
		} catch {
			// Ignore.
		}
	}

	private restore() {
		const raw = this.safeRead(TIMER_STATE_KEY);
		if (!raw) return;

		let state: PersistedState;
		try {
			state = JSON.parse(raw) as PersistedState;
		} catch {
			this.clearPersisted();
			return;
		}

		if (typeof state.workValue === 'number' && state.workValue > 0) {
			this.workValue = state.workValue;
		}

		const now = Date.now();

		if (state.phase === 'working' || state.phase === 'standing') {
			if (typeof state.endAt !== 'number') {
				this.clearPersisted();
				return;
			}
			const remainingMs = state.endAt - now;
			if (remainingMs > 500) {
				// Mid-countdown — resume.
				const target = state.phase;
				this.phase = target;
				this.persist({ phase: target, workValue: this.workValue, endAt: state.endAt });
				this.runCountdown(Math.round(remainingMs / 1000), () => {
					if (target === 'working') this.fireStandUpAlarm();
					else this.fireDoneAlarm();
				});
				return;
			}
			// Countdown already ended. Check staleness.
			const overshoot = now - state.endAt;
			if (overshoot > STALE_THRESHOLD_MS) {
				this.clearPersisted();
				return;
			}
			// Within 45 min — fire the alarm now.
			if (state.phase === 'working') this.fireStandUpAlarm();
			else this.fireDoneAlarm();
			return;
		}

		if (state.phase === 'alert_work' || state.phase === 'alert_stand') {
			if (typeof state.alertStartedAt !== 'number') {
				this.clearPersisted();
				return;
			}
			const elapsed = now - state.alertStartedAt;
			if (elapsed > STALE_THRESHOLD_MS) {
				this.clearPersisted();
				return;
			}
			if (state.phase === 'alert_work') {
				this.phase = 'alert_work';
				this.persist({
					phase: 'alert_work',
					workValue: this.workValue,
					alertStartedAt: state.alertStartedAt
				});
				this.startAlertLoop(m.notify_time_to_stand());
			} else {
				this.phase = 'alert_stand';
				this.persist({
					phase: 'alert_stand',
					workValue: this.workValue,
					alertStartedAt: state.alertStartedAt
				});
				this.playAlertSound('done');
				this.notify(m.notify_break_complete());
			}
			return;
		}

		this.clearPersisted();
	}
}

export const timer = new TimerStore();
