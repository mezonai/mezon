/* eslint-disable prettier/prettier */
import { getStore, selectAllUsesInAllClansEntities } from '@mezon/store-mobile';
import { useCallback, useEffect, useState } from 'react';
import { RAISE_HAND_DOWN_EMOJI_PREFIX, RAISE_HAND_UP_EMOJI_PREFIX } from '../screens/home/homedrawer/components/ChannelVoice/CallReactionHandler';
import { RAISE_HAND_COOLDOWN_MS } from '../screens/home/homedrawer/components/ChannelVoice/ControlBottomBar/ButtonRaiseHand';

export interface ActiveSoundReaction {
	participantId: string;
	soundId: string;
	timestamp: number;
	timeoutId: NodeJS.Timeout;
}

export function useSoundReactions() {
	const [activeSoundReactions, setActiveSoundReactions] = useState<Map<string, ActiveSoundReaction>>(new Map());

	const handleSoundReaction = useCallback((participantId: string, soundId: string) => {
		const store = getStore();
		const clanMembersEntities = selectAllUsesInAllClansEntities(store.getState());

		const userInfo = clanMembersEntities[participantId];
		const userId = userInfo?.id || null;
		if (!userId) {
			return;
		}

		setActiveSoundReactions((prev) => {
			const newMap = new Map(prev);
			const existing = newMap.get(userId);
			if (existing) {
				clearTimeout(existing.timeoutId);
			}
			const timeoutMillis = soundId === RAISE_HAND_UP_EMOJI_PREFIX ? RAISE_HAND_COOLDOWN_MS : 2000;
			if (soundId === RAISE_HAND_DOWN_EMOJI_PREFIX) {
				setActiveSoundReactions((current) => {
					const updatedMap = new Map(current);
					updatedMap.delete(userId);
					return updatedMap;
				});
			}
			const timeoutId = setTimeout(() => {
				setActiveSoundReactions((current) => {
					const updatedMap = new Map(current);
					updatedMap.delete(userId);
					return updatedMap;
				});
			}, timeoutMillis);

			newMap.set(userId, {
				participantId,
				soundId,
				timestamp: Date.now(),
				timeoutId
			});

			return newMap;
		});
	}, []);

	useEffect(() => {
		return () => {
			activeSoundReactions.forEach((reaction) => {
				clearTimeout(reaction.timeoutId);
			});
		};
	}, []);

	return {
		activeSoundReactions,
		handleSoundReaction
	};
}
