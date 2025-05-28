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
	};
};

export interface ReactionCallHandlerProps {
	currentChannel?: ReactionChannelInfo;
}
