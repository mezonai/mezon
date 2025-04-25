import { useAuth, useChatReaction } from '@mezon/core';
import { selectCurrentChannel } from '@mezon/store';
import { IMessageWithUser, getSrcEmoji, isPublicChannel } from '@mezon/utils';
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
	const userId = useAuth();

	const currentChannel = useSelector(selectCurrentChannel);

	const handleClickEmoji = useCallback(async () => {
		await reactionMessageDispatch({
			id: emojiId,
			messageId,
			emoji_id: emojiId,
			emoji: emojiShortCode,
			count: 1,
			message_sender_id: userId.userId ?? '',
			action_delete: false,
			is_public: isPublicChannel(currentChannel),
			clanId: message?.clan_id ?? '',
			channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
			isFocusTopicBox: isTopic,
			channelIdOnMessage: message?.channel_id
		});
	}, [reactionMessageDispatch, message, emojiId, emojiShortCode, userId.userId, currentChannel, isTopic]);

	return (
		<div
			onClick={handleClickEmoji}
			className={
				isOption
					? 'h-full p-1 cursor-pointer hover:bg-[#E3E5E8] dark:hover:bg-[#232428] rounded-sm transform hover:scale-110 transition-transform duration-100'
					: `${isAddReactionPanel ? 'w-5' : 'w-10 h-10 rounded-full flex justify-center items-center dark:hover:bg-[#232428] dark:bg-[#1E1F22] bg-[#E3E5E8] hover:bg-[#EBEDEF] '} cursor-pointer`
			}
		>
			<img src={getUrl} draggable="false" className="w-5 h-5" alt="emoji" />
		</div>
	);
};

export default memo(ReactionItem);
