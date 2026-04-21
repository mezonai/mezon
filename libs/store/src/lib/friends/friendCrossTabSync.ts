import type { UnknownAction } from '@reduxjs/toolkit';
import { friendsActions } from './friend.slice';

export const FRIEND_RELATION_SYNC_STORAGE_KEY = 'mezon:friend-relation-sync';

export interface FriendRelationPayload {
	userId: string;
	state: number;
	sourceId: string;
}

export function broadcastFriendRelationToOtherTabs(payload: FriendRelationPayload): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(FRIEND_RELATION_SYNC_STORAGE_KEY, JSON.stringify(payload));
}

export function initFriendRelationCrossTabSync(dispatch: (action: UnknownAction) => void): () => void {
	if (typeof window === 'undefined') return () => {};

	const isValidPayload = (value: unknown): value is FriendRelationPayload => {
		if (!value || typeof value !== 'object') return false;
		const v = value as Record<string, unknown>;
		return typeof v.userId === 'string' && typeof v.sourceId === 'string' && typeof v.state === 'number' && Number.isFinite(v.state);
	};

	const handler = (e: StorageEvent) => {
		if (e.key !== FRIEND_RELATION_SYNC_STORAGE_KEY || !e.newValue) return;
		try {
			const data = JSON.parse(e.newValue);
			if (!isValidPayload(data)) return;
			dispatch(friendsActions.applyFriendBlockState({ userId: data.userId, state: data.state, sourceId: data.sourceId }));
		} catch {
			// ignore malformed payload
		}
	};

	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
}
