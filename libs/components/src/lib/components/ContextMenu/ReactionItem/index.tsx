import { useAuth, useChatReaction } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentChannelParentId, selectCurrentChannelPrivate } from '@mezon/store';
import type { IEmoji, IMessageWithUser } from '@mezon/utils';
import { getEmojiUrl, isPublicChannel } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

interface IReactionItem {
	emojiShortCode: string;
	emojiId: string;
	creator_id?: string;
	messageId: string;
	isOption: boolean;
	isAddReactionPanel?: boolean;
	message: IMessageWithUser;
	isTopic: boolean;
	emojis?: IEmoji[];
}

const ReactionItem: React.FC<IReactionItem> = ({
	emojiShortCode,
	emojiId,
	creator_id,
	messageId,
	isOption,
	isAddReactionPanel,
	message,
	isTopic,
	emojis
}) => {
	const { reactionMessageDispatch } = useChatReaction();
	const getUrl = emojis?.find((e) => e.id === emojiId && e.creator_id === creator_id)?.src || getEmojiUrl({ id: emojiId, creator_id });
	const { userProfile } = useAuth();

	// Select individual channel properties to avoid unnecessary rerenders
	const currentChannelObjectId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);

	const handleClickEmoji = useCallback(async () => {
		await reactionMessageDispatch({
			id: emojiId,
			messageId,
			emoji_id: emojiId,
			emoji: emojiShortCode,
			count: 1,
			message_sender_id: (message.sender_id || userProfile?.user?.id) ?? '',
			action_delete: false,
			is_public: isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate }),
			clanId: message?.clan_id ?? '',
			channelId: isTopic ? currentChannelObjectId || '' : (message?.channel_id ?? ''),
			isFocusTopicBox: isTopic,
			channelIdOnMessage: message?.channel_id
		});
	}, [
		reactionMessageDispatch,
		message,
		emojiId,
		messageId,
		emojiShortCode,
		userProfile,
		currentChannelParentId,
		currentChannelPrivate,
		currentChannelObjectId,
		isTopic
	]);

	return (
		<div
			onClick={handleClickEmoji}
			className={
				isOption
					? 'h-full p-1 shadow-sm cursor-pointer  rounded-lg  transform hover:scale-110 transition-transform duration-100'
					: `${isAddReactionPanel ? 'w-5' : 'w-10 h-10 rounded-full flex justify-center items-center  '} cursor-pointer`
			}
		>
			<img src={getUrl} draggable="false" className="w-5 h-5" alt="emoji" />
		</div>
	);
};

export default memo(ReactionItem);
