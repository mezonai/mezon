import { useMezon } from '@mezon/transport';
import { useCallback } from 'react';
import { ReactionType, UseSendReactionParams } from './types';

export const useSendReaction = ({ currentChannel }: UseSendReactionParams) => {
	const { socketRef } = useMezon();

	const sendEmojiReaction = useCallback(
		(emoji: string, emojiId: string) => {
			if (!socketRef.current || !currentChannel?.channel_id) return;

			socketRef.current.writeChatMessage(
				currentChannel.clan_id || '',
				currentChannel.channel_id,
				2,
				!currentChannel.channel_private,
				{
					t: emoji + ' ',
					ej: [
						{
							emojiid: emojiId,
							s: 0,
							e: emoji.length
						}
					],
					vr: ReactionType.VIDEO
				},
				[],
				[],
				[],
				undefined,
				undefined,
				undefined
			);
		},
		[socketRef, currentChannel]
	);

	return sendEmojiReaction;
};
