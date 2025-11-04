export interface ReactionChannelInfo {
	channel_id: string;
	clan_id: string;
	channel_private: number;
}

export enum ReactionType {
	NONE = 0,
	VIDEO = 1
}

export interface DisplayedEmoji {
	id: string;
	emoji: string;
	emojiId: string;
	timestamp: number;
	displayName?: string;
	position?: {
		left: string;
		bottom: string;
		duration: string;
		animationName: string;
		delay?: string;
	};
}

export interface DisplayedSound {
	id: string;
	soundId: string;
	soundUrl: string;
	timestamp: number;
}

export interface ActiveSoundReaction {
	participantId: string;
	soundId: string;
	timestamp: number;
	timeoutId: NodeJS.Timeout;
}

export interface ReactionCallHandlerProps {
	onSoundReaction?: (participantId: string, soundId: string) => void;
}
