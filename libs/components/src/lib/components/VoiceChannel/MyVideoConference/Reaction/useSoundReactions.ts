import { getStore, selectEntitesUserClans } from '@mezon/store';
import { useCallback, useState } from 'react';
import type { ActiveSoundReaction } from './types';

export function useSoundReactions() {
	const [activeSoundReactions, setActiveSoundReactions] = useState<Map<string, ActiveSoundReaction>>(new Map());

	const handleSoundReaction = useCallback((participantId: string, soundId: string) => {
		const store = getStore();
		const clanMembersEntities = selectEntitesUserClans(store.getState());

		const userInfo = clanMembersEntities[participantId];
		const userId = userInfo?.user?.id || null;
		if (!userId) {
			return;
		}

		setActiveSoundReactions((prev) => {
			const newMap = new Map(prev);

			newMap.set(userId, {
				participantId,
				soundId,
				timestamp: Date.now()
			});

			return newMap;
		});
	}, []);

	const removeActiveSoundParticipant = (userId: string) => {
		setActiveSoundReactions((current) => {
			const updatedMap = new Map(current);
			updatedMap.delete(userId);
			return updatedMap;
		});
	};
	const clearAllSound = () => {
		setActiveSoundReactions(new Map());
	};

	return {
		activeSoundReactions,
		handleSoundReaction,
		removeActiveSoundParticipant,
		clearAllSound
	};
}
