import { useSyncExternalStore } from 'react';
import { soundReactionsService } from './soundReactionsService';
import type { ActiveSoundReaction } from './types';

export function useActiveSoundReaction(userId: string | undefined): ActiveSoundReaction | undefined {
	return useSyncExternalStore(
		(callback) => {
			const subscription = soundReactionsService.getActiveSoundReactions$().subscribe({
				next: () => callback()
			});

			return () => {
				subscription.unsubscribe();
			};
		},
		() => {
			if (!userId) return undefined;
			return soundReactionsService.getCurrentValue().get(userId);
		},
		() => undefined
	);
}
