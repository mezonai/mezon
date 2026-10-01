export type SfuCloseAction = 'stop' | 'refresh-token' | 'reset-transport' | 'retry';

export const sfuCloseAction = (code: number): SfuCloseAction => {
	switch (code) {
		case 1000:
		case 4006:
		case 4011:
		case 4012:
			return 'stop';
		case 4003:
		case 4004:
		case 4005:
			return 'refresh-token';
		case 4013:
			return 'reset-transport';
		default:
			return 'retry'; // Includes 1001, 1006, 1011, 4001, 4008 and missing close frames.
	}
};

// Zero-based attempts; equal jitter gives 0.5–1 / 1–2 / 2–4 / 4–8 seconds.
export const sfuReconnectDelay = (attempt: number, jitter = Math.random()): number =>
	Math.floor(1000 * 2 ** Math.min(Math.max(attempt, 0), 3) * (0.5 + 0.5 * Math.min(Math.max(jitter, 0), 1)));

// One instance per WebSocket. Revisions are diagnostic until the SFU echoes
// them; match ordered ACKs on the same socket, never across reconnects.
export class SfuMuteSync {
	private pending: { muted: boolean; revision: number; sentAt: number }[] = [];
	private revision = 0;
	private forcedMuteAt: number | undefined;

	sent(muted: boolean, now: number): number {
		this.cancelInference();
		const revision = ++this.revision;
		this.pending.push({ muted, revision, sentAt: now });
		return revision;
	}

	acknowledge(muted: boolean): number | undefined {
		if (this.pending[0]?.muted !== muted) return undefined;
		this.cancelInference();
		return this.pending.shift()?.revision;
	}

	observeSelf(remoteMuted: boolean, localMuted: boolean, now: number): void {
		if (this.pending.length || !remoteMuted || localMuted) this.cancelInference();
		else this.forcedMuteAt ??= now + 300;
	}

	cancelInference(): void {
		this.forcedMuteAt = undefined;
	}

	get deadline(): number | undefined {
		return this.forcedMuteAt;
	}

	get pendingCount(): number {
		return this.pending.length;
	}

	takeForcedMute(now: number): boolean {
		if (this.pending.length || this.forcedMuteAt === undefined || now < this.forcedMuteAt) return false;
		this.cancelInference();
		return true;
	}

	timedOutRevision(now: number): number | undefined {
		const request = this.pending[0];
		return request && now - request.sentAt >= 10_000 ? request.revision : undefined;
	}
}

export const withSfuTimeout = <T>(operation: Promise<T>, timeoutMs: number): Promise<T> =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('SFU operation timed out')), timeoutMs);
		operation.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
