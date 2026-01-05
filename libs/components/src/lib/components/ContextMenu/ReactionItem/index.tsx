import { useAuth, useChatReaction } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentChannelParentId, selectCurrentChannelPrivate } from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { getSrcEmoji, isPublicChannel } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

interface IReactionItem {
	emojiShortCode: string;
	emojiId: string;
	messageId: string;
	isOption: boolean;
	isAddReactionPanel?: boolean;
	message: IMessageWithUser;
	isTopic: boolean;
}

const ReactionItem: React.FC<IReactionItem> = ({ emojiShortCode, emojiId, messageId, isOption, isAddReactionPanel, message, isTopic }) => {
	const { reactionMessageDispatch } = useChatReaction();
	const getUrl = getSrcEmoji(emojiId);
	const { userProfile } = useAuth();

	// Select individual channel properties to avoid unnecessary rerenders
	const currentChannelObjectId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);

	const handleClickEmoji = useCallback(async () => {
		await reactionMessageDispatch({
			id: emojiId,
			messageId,
			emojiId: emojiId,
			emoji: emojiShortCode,
			count: 1,
			messageSenderId: (message.senderId || userProfile?.user?.id) ?? '',
			action_delete: false,
			isPublic: isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate }),
			clanId: message?.clanId ?? '',
			channelId: isTopic ? currentChannelObjectId || '' : (message?.channelId ?? ''),
			isFocusTopicBox: isTopic,
			channelIdOnMessage: message?.channelId
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
