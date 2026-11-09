import type { AppDispatch } from '../store';
import { EStateFriend, friendsActions } from './friend.slice';

export const FRIEND_RELATION_SYNC_STORAGE_KEY = 'mezon:friend-relation-sync';

export interface FriendRelationPayload {
	userId: string;
	state: number;
	sourceId: string;
	username?: string;
	display_name?: string;
	avatar_url?: string;
}

interface FriendRelationRefreshPayload {
	type: 'refetch';
	sourceId: string;
	timestamp: number;
}

type FriendRelationSyncPayload = FriendRelationPayload | FriendRelationRefreshPayload;

export function broadcastFriendRelationToOtherTabs(payload: FriendRelationPayload): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(FRIEND_RELATION_SYNC_STORAGE_KEY, JSON.stringify(payload));
}

export function broadcastFriendRelationRefreshToOtherTabs(sourceId: string): void {
	if (typeof window === 'undefined') return;
	const payload: FriendRelationRefreshPayload = { type: 'refetch', sourceId, timestamp: Date.now() };
	localStorage.setItem(FRIEND_RELATION_SYNC_STORAGE_KEY, JSON.stringify(payload));
}

export function initFriendRelationCrossTabSync(dispatch: AppDispatch): () => void {
	if (typeof window === 'undefined') return () => undefined;

	const isValidPayload = (value: unknown): value is FriendRelationSyncPayload => {
		if (!value || typeof value !== 'object') return false;
		const v = value as Record<string, unknown>;
		if (typeof v.sourceId !== 'string') return false;
		if (v.type === 'refetch') {
			return typeof v.timestamp === 'number' && Number.isFinite(v.timestamp);
		}
		return (
			v.type === undefined &&
			typeof v.userId === 'string' &&
			typeof v.state === 'number' &&
			Number.isInteger(v.state) &&
			v.state >= EStateFriend.FRIEND &&
			v.state <= EStateFriend.BLOCK &&
			(v.username === undefined || typeof v.username === 'string') &&
			(v.display_name === undefined || typeof v.display_name === 'string') &&
			(v.avatar_url === undefined || typeof v.avatar_url === 'string')
		);
	};

	const handler = (e: StorageEvent) => {
		if (e.key !== FRIEND_RELATION_SYNC_STORAGE_KEY || !e.newValue) return;
		try {
			const data: unknown = JSON.parse(e.newValue);
			if (!isValidPayload(data)) return;
			if ('type' in data || data.state === EStateFriend.FRIEND) {
				void dispatch(friendsActions.fetchListFriends({ noCache: true }));
				return;
			}
			dispatch(
				friendsActions.applyFriendBlockState({
					userId: data.userId,
					state: data.state,
					sourceId: data.sourceId,
					username: data.username,
					display_name: data.display_name,
					avatar_url: data.avatar_url
				})
			);
		} catch {
			// ignore malformed payload
		}
	};

	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
}
