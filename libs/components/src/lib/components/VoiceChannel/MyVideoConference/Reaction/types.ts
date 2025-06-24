export interface ReactionChannelInfo {
	channel_id: string;
	clan_id: string;
	channel_private: number;
}

export interface UseSendReactionParams {
	currentChannel?: ReactionChannelInfo;
}

export enum ReactionType {
	NONE = 0,
	VIDEO = 1
}

export type DisplayedEmoji = {
	id: string;
	emoji: string;
	emojiId: string;
	timestamp: number;
	position?: {
		left: string;
		bottom?: string;
		duration?: string;
		animation?: string;
		animationName?: string;
		delay?: string;
		baseScale?: number;
	};
};

export interface ReactionCallHandlerProps {
	currentChannel?: ReactionChannelInfo;
	emojiReactions?: string[];
	onEmojiProcessed?: () => void;
	soundReactions?: string[];
	onSoundProcessed?: () => void;
}

export interface VoiceSoundSend {
	channel_id: string;
	sounds: string[];
}
