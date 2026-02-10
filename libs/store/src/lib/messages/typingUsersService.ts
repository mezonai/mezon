import { Subject } from 'rxjs';
import type { UserTypingState } from './messages.slice';

type ChannelTypingMap = Map<string, UserTypingState>;

const TYPING_TIMEOUT = 3000;
const CLEANUP_INTERVAL = 1000;
const EMPTY_ARRAY: UserTypingState[] = [];

class TypingUsersService {
	private channels = new Map<string, ChannelTypingMap>();
	private cachedArrays = new Map<string, UserTypingState[]>();
	private notify$ = new Subject<void>();
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;

	getNotify$() {
		return this.notify$.asObservable();
	}

	getTypingUsersByChannel(channelId: string): UserTypingState[] {
		return this.cachedArrays.get(channelId) || EMPTY_ARRAY;
	}

	hasTypingUser(channelId: string, userId: string | string[]): boolean {
		const channelMap = this.channels.get(channelId);
		if (!channelMap) return false;

		if (Array.isArray(userId)) {
			for (const id of userId) {
				if (channelMap.has(id)) return true;
			}
			return false;
		}
		return channelMap.has(userId);
	}

	addTypingUser(channelId: string, userId: string, typingName: string) {
		let channelMap = this.channels.get(channelId);
		if (!channelMap) {
			channelMap = new Map();
			this.channels.set(channelId, channelMap);
		}

		channelMap.set(userId, { id: userId, typingName, timeAt: Date.now() });

		this.rebuildChannelCache(channelId, channelMap);
		this.notify$.next();
		this.startCleanupIfNeeded();
	}

	removeTypingUser(channelId: string, userId: string) {
		const channelMap = this.channels.get(channelId);
		if (!channelMap || !channelMap.has(userId)) return;

		channelMap.delete(userId);

		if (channelMap.size === 0) {
			this.channels.delete(channelId);
			this.cachedArrays.delete(channelId);
		} else {
			this.rebuildChannelCache(channelId, channelMap);
		}

		this.notify$.next();
	}

	private rebuildChannelCache(channelId: string, channelMap: ChannelTypingMap) {
		this.cachedArrays.set(channelId, Array.from(channelMap.values()));
	}

	private startCleanupIfNeeded() {
		if (this.cleanupTimer) return;

		this.cleanupTimer = setInterval(() => {
			this.sweepExpired();
		}, CLEANUP_INTERVAL);
	}

	private sweepExpired() {
		const now = Date.now();
		let hasChanges = false;

		for (const [channelId, channelMap] of this.channels) {
			const expiredIds: string[] = [];

			for (const [userId, entry] of channelMap) {
				if (now - entry.timeAt >= TYPING_TIMEOUT) {
					expiredIds.push(userId);
				}
			}

			if (expiredIds.length === 0) continue;

			hasChanges = true;
			for (const id of expiredIds) {
				channelMap.delete(id);
			}

			if (channelMap.size === 0) {
				this.channels.delete(channelId);
				this.cachedArrays.delete(channelId);
			} else {
				this.rebuildChannelCache(channelId, channelMap);
			}
		}

		if (hasChanges) {
			this.notify$.next();
		}

		if (this.channels.size === 0) {
			this.stopCleanup();
		}
	}

	private stopCleanup() {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
	}

	clearAll() {
		this.stopCleanup();
		this.channels.clear();
		this.cachedArrays.clear();
		this.notify$.next();
	}
}

export const typingUsersService = new TypingUsersService();
