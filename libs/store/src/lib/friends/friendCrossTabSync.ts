import type { UnknownAction } from '@reduxjs/toolkit';
import { friendsActions } from './friend.slice';

export const FRIEND_RELATION_SYNC_STORAGE_KEY = 'mezon:friend-relation-sync';

export interface FriendRelationPayload {
	userId: string;
	state: number;
	sourceId: string;
	username?: string;
	display_name?: string;
	avatar_url?: string;
}

export function broadcastFriendRelationToOtherTabs(payload: FriendRelationPayload): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(FRIEND_RELATION_SYNC_STORAGE_KEY, JSON.stringify(payload));
}

export function initFriendRelationCrossTabSync(dispatch: (action: UnknownAction) => void): () => void {
	if (typeof window === 'undefined') return () => undefined;

	const isValidPayload = (value: unknown): value is FriendRelationPayload => {
		if (!value || typeof value !== 'object') return false;
		const v = value as Record<string, unknown>;
		return (
			typeof v.userId === 'string' &&
			typeof v.sourceId === 'string' &&
			typeof v.state === 'number' &&
			Number.isFinite(v.state) &&
			(v.username === undefined || typeof v.username === 'string') &&
			(v.display_name === undefined || typeof v.display_name === 'string') &&
			(v.avatar_url === undefined || typeof v.avatar_url === 'string')
		);
	};

	const handler = (e: StorageEvent) => {
		if (e.key !== FRIEND_RELATION_SYNC_STORAGE_KEY || !e.newValue) return;
		try {
			const data = JSON.parse(e.newValue);
			if (!isValidPayload(data)) return;
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
