/* eslint-disable prettier/prettier */
import { getStore, selectAllUsesInAllClansEntities } from '@mezon/store-mobile';
import { useCallback, useEffect, useState } from 'react';

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
        const username = userInfo?.username || null;
        if (!username) {
            return;
        }

        setActiveSoundReactions((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(username);
            if (existing) {
                clearTimeout(existing.timeoutId);
            }
            const timeoutId = setTimeout(() => {
                setActiveSoundReactions((current) => {
                    const updatedMap = new Map(current);
                    updatedMap.delete(username);
                    return updatedMap;
                });
            }, 2000);

            newMap.set(username, {
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
