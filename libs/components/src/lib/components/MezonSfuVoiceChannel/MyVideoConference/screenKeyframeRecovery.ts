const VISIBLE_GRACE_MS = 350;
const FOREGROUND_GRACE_MS = 1500;
const SHORT_BACKGROUND_MS = 5000;
const PER_PUBLISHER_INTERVAL_MS = 1500;
const GLOBAL_INTERVAL_MS = 250;
// One initial request plus two retries, shared across renderers.
const RETRY_DELAYS_MS = [1500, 3000];

type ScreenSource = {
	publisherId: number;
	track: MediaStreamTrack;
	visible: boolean;
	focused: boolean;
	pip: boolean;
	urgent: boolean;
	frameAt?: number;
	frameSince: number;
	readyAt: number;
};

type RecoveryState = {
	publisherId: number;
	attempts: number;
	lastSentAt: number;
};

type RecoveryOptions = {
	canSend: () => boolean;
	isCurrent: (publisherId: number, track: MediaStreamTrack) => boolean;
	send: (publisherId: number) => void;
	now?: () => number;
	random?: () => number;
};

/** One queue per SFU connection, shared by grid, focus view and PiP renderers. */
export class ScreenKeyframeRecovery {
	private readonly sources = new Map<symbol, ScreenSource>();
	private readonly states = new Map<MediaStreamTrack, RecoveryState>();
	private readonly lastSentByPublisher = new Map<number, number>();
	private readonly now: () => number;
	private readonly random: () => number;
	private timer?: ReturnType<typeof setTimeout>;
	private nextSendAt = 0;
	private lastRequestAt = -Infinity;
	private documentVisible = true;
	private hiddenAt?: number;

	constructor(private readonly options: RecoveryOptions) {
		this.now = options.now ?? (() => performance.now());
		this.random = options.random ?? Math.random;
	}

	register(token: symbol, peerId: string | undefined, track: MediaStreamTrack, focused = false) {
		// Only the numeric SFU peer ID is valid here; slot IDs and user IDs are not targets.
		const publisherId = peerId && /^\d+$/.test(peerId) ? Number(peerId) : 0;
		if (!Number.isInteger(publisherId) || publisherId <= 0 || publisherId > 0xffffffff) {
			return;
		}
		const now = this.now();
		const source: ScreenSource = {
			publisherId,
			track,
			focused,
			visible: false,
			pip: false,
			urgent: focused,
			frameSince: now,
			readyAt: now + (focused ? 0 : VISIBLE_GRACE_MS + this.random() * 150)
		};
		this.sources.set(token, source);
		this.wake();
	}

	unregister(token: symbol) {
		this.sources.delete(token);
		this.wake();
	}

	setVisible(token: symbol, visible: boolean) {
		const source = this.sources.get(token);
		if (!source || source.visible === visible) return;
		source.visible = visible;
		if (visible && source.frameAt === undefined) {
			source.readyAt = Math.max(source.readyAt, this.now() + (source.focused ? 0 : VISIBLE_GRACE_MS + this.random() * 150));
		}
		this.wake();
	}

	setFocused(token: symbol, focused: boolean) {
		const source = this.sources.get(token);
		if (!source || source.focused === focused) return;
		source.focused = focused;
		if (focused && source.frameAt === undefined) {
			source.readyAt = this.now();
			source.urgent = true;
		}
		this.wake();
	}

	setPictureInPicture(token: symbol, pip: boolean) {
		const source = this.sources.get(token);
		if (!source) return;
		source.pip = pip;
		if (pip && source.frameAt === undefined) {
			source.readyAt = this.now();
			source.urgent = true;
		}
		this.wake();
	}

	reportFrame(token: symbol) {
		const source = this.sources.get(token);
		if (!source || source.track.readyState !== 'live') return;
		const wasMissing = source.frameAt === undefined || source.frameAt < source.frameSince;
		if (wasMissing && !this.options.isCurrent(source.publisherId, source.track)) return;
		source.frameAt = this.now();
		// Healthy high-FPS streams only update a timestamp, without scanning the queue per frame.
		if (wasMissing) this.wake();
	}

	/** The renderer lost its image; silence from a static screen alone is not a failure. */
	reportFrameUnavailable(token: symbol) {
		const source = this.sources.get(token);
		// Repeated loading events must not postpone recovery or replenish its budget.
		if (!source || source.frameAt === undefined) return;
		source.frameAt = undefined;
		source.frameSince = this.now();
		source.readyAt = this.now() + PER_PUBLISHER_INTERVAL_MS;
		source.urgent = false;
		this.wake();
	}

	setDocumentVisible(visible: boolean) {
		if (this.documentVisible === visible) return;
		this.documentVisible = visible;
		const now = this.now();
		if (!visible) {
			this.hiddenAt = now;
		} else {
			const hiddenAt = this.hiddenAt ?? now;
			this.hiddenAt = undefined;
			for (const source of this.sources.values()) {
				if (!source.visible && !source.pip) continue;
				const frameAt = source.frameAt;
				if (frameAt !== undefined && (now - hiddenAt < SHORT_BACKGROUND_MS || (frameAt >= hiddenAt && now - frameAt < FOREGROUND_GRACE_MS))) {
					continue;
				}
				source.frameSince = now;
				source.readyAt = now + FOREGROUND_GRACE_MS;
				// A new foreground recovery episode may retry; scrolling or pinning cannot reset the budget.
				this.states.delete(source.track);
			}
		}
		this.wake();
	}

	isRecentRequestError(message: string) {
		return (message === 'must_join_room_first' || message === 'session_not_found') && this.now() - this.lastRequestAt < 5000;
	}

	/** Reset only for a new transport/leave, not on each visibility change. */
	reset() {
		this.cancelTimer();
		this.states.clear();
		this.lastSentByPublisher.clear();
		this.lastRequestAt = -Infinity;
		this.nextSendAt = 0;
		for (const source of this.sources.values()) {
			source.frameAt = undefined;
			source.frameSince = this.now();
			source.readyAt = this.now() + (source.focused ? 0 : VISIBLE_GRACE_MS + this.random() * 150);
		}
	}

	private cancelTimer() {
		if (this.timer !== undefined) clearTimeout(this.timer);
		this.timer = undefined;
	}

	wake() {
		this.cancelTimer();
		const activePublishers = new Set<number>();
		for (const [track, state] of this.states) {
			if (track.readyState !== 'live' || !this.options.isCurrent(state.publisherId, track)) this.states.delete(track);
			else activePublishers.add(state.publisherId);
		}
		for (const source of this.sources.values()) activePublishers.add(source.publisherId);
		for (const publisherId of this.lastSentByPublisher.keys()) {
			if (!activePublishers.has(publisherId)) this.lastSentByPublisher.delete(publisherId);
		}
		if (!this.options.canSend()) return;
		const now = this.now();
		const pending = new Map<number, { source: ScreenSource; state: RecoveryState; due: number; priority: number }>();
		for (const source of this.sources.values()) {
			if (
				!(source.pip || (this.documentVisible && source.visible)) ||
				source.track.readyState !== 'live' ||
				!this.options.isCurrent(source.publisherId, source.track)
			) {
				continue;
			}
			if (source.frameAt !== undefined && source.frameAt >= source.frameSince) continue;
			let state = this.states.get(source.track);
			if (!state || state.publisherId !== source.publisherId) {
				state = { publisherId: source.publisherId, attempts: 0, lastSentAt: -Infinity };
				this.states.set(source.track, state);
			}
			if (state.attempts > RETRY_DELAYS_MS.length) continue;
			const due = Math.max(
				source.readyAt,
				this.nextSendAt,
				(this.lastSentByPublisher.get(source.publisherId) ?? -Infinity) + PER_PUBLISHER_INTERVAL_MS,
				state.attempts === 0 || source.urgent ? 0 : state.lastSentAt + RETRY_DELAYS_MS[state.attempts - 1]
			);
			const priority = source.focused || source.pip ? 0 : 1;
			const existing = pending.get(source.publisherId);
			if (!existing || priority < existing.priority || (priority === existing.priority && due < existing.due)) {
				pending.set(source.publisherId, { source, state, due, priority });
			}
		}
		const ordered = [...pending.values()].sort((a, b) => a.priority - b.priority || a.due - b.due || a.source.publisherId - b.source.publisherId);
		const next = ordered.find((item) => item.due <= now);
		if (next) {
			const { source, state } = next;
			this.lastSentByPublisher.set(source.publisherId, now);
			this.nextSendAt = now + GLOBAL_INTERVAL_MS + this.random() * 75;
			try {
				this.options.send(source.publisherId);
				this.lastRequestAt = now;
				state.attempts++;
				state.lastSentAt = now;
				for (const renderer of this.sources.values()) {
					if (renderer.publisherId === source.publisherId) renderer.urgent = false;
				}
			} catch {
				// Failed enqueue backs off without consuming the bounded retry budget.
			}
			this.timer = setTimeout(() => this.wake(), this.nextSendAt - now);
		} else if (ordered.length) {
			const due = Math.min(...ordered.map((item) => item.due));
			this.timer = setTimeout(() => this.wake(), Math.max(1, due - now));
		}
	}
}
