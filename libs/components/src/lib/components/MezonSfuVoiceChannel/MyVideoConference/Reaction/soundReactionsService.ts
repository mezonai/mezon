import { getStore, selectEntitesUserClans } from '@mezon/store';
import { BehaviorSubject } from 'rxjs';
import type { ActiveSoundReaction } from './types';

class SoundReactionsService {
	private activeSoundReactions$ = new BehaviorSubject<Map<string, ActiveSoundReaction>>(new Map());

	getActiveSoundReactions$() {
		return this.activeSoundReactions$.asObservable();
	}

	getCurrentValue() {
		return this.activeSoundReactions$.getValue();
	}

	handleSoundReaction(participantId: string, soundId: string) {
		const store = getStore();
		const clanMembersEntities = selectEntitesUserClans(store.getState());
		const userInfo = clanMembersEntities[participantId];
		const userId = userInfo?.user?.id || null;

		if (!userId) {
			return;
		}

		const currentMap = this.activeSoundReactions$.getValue();
		const newMap = new Map(currentMap);

		newMap.set(userId, {
			participantId,
			soundId,
			timestamp: Date.now()
		});

		this.activeSoundReactions$.next(newMap);
	}

	removeActiveSoundParticipant(userId: string) {
		const currentMap = this.activeSoundReactions$.getValue();
		const updatedMap = new Map(currentMap);
		updatedMap.delete(userId);
		this.activeSoundReactions$.next(updatedMap);
	}

	clearAllSound() {
		this.activeSoundReactions$.next(new Map());
	}
}

export const soundReactionsService = new SoundReactionsService();
