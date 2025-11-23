import { useChatReaction } from '@mezon/core';
import { getStore, selectAllAccount, selectCurrentChannel } from '@mezon/store';
import type { EmojiDataOptionals, IMessageWithUser, SenderInfoOptionals } from '@mezon/utils';
import { calculateTotalCount, getEmojiUrl, isPublicChannel } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import UserReactionPanel from './UserReactionPanel';

type EmojiItemProps = {
	emoji: EmojiDataOptionals;
	message: IMessageWithUser;
	isTopic: boolean;
};

function ItemEmoji({ emoji, message, isTopic }: EmojiItemProps) {
	const { reactionMessageDispatch } = useChatReaction();
	const emojiData = {
		src: emoji.url,
		id: emoji.id,
		emojiId: emoji.emojiId,
		creator_id: emoji.creator_id
	};
	const getUrlItem = getEmojiUrl(emojiData);
	const count = calculateTotalCount(emoji.senders);
	const userId = useSelector(selectAllAccount)?.user?.id as string;
	const userSenderCount = emoji.senders?.find((sender: SenderInfoOptionals) => sender.sender_id === userId)?.count;

	async function reactOnExistEmoji(id: string, messageId: string, emojiId: string, emoji: string, count: number, action_delete: boolean) {
		const store = getStore();
		const currentChannel = selectCurrentChannel(store.getState());

		await reactionMessageDispatch({
			id,
			messageId: messageId ?? '',
			emoji_id: emojiId ?? '',
			emoji: emoji ?? '',
			count: 1,
			message_sender_id: userId ?? '',
			action_delete: false,
			is_public: isPublicChannel(currentChannel),
			clanId: message?.clan_id ?? '',
			channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
			isFocusTopicBox: isTopic,
			channelIdOnMessage: message?.channel_id
		});
	}

	return (
		<Tooltip overlay={<UserReactionPanel message={message} emojiShowPanel={emoji} isTopic={isTopic} />} placement="top">
			<div
				className={`h-[24px] rounded-md w-fit min-w-12 gap-3 h-6 flex flex-row noselect
          cursor-pointer justify-center  items-center relative pl-7 text-sm font-medium text-theme-primary
          ${Number(userSenderCount) > 0 ? 'highlight-react-theme' : ''}`}
				onClick={() => reactOnExistEmoji(emoji.emojiId ?? '', emoji.message_id ?? '', emoji.emojiId ?? '', emoji.emoji ?? '', 1, false)}
			>
				<img src={getUrlItem} className="absolute left-[5px] w-4 h-4 object-scale-down " alt="" />
				{formatCount(count)}
			</div>
		</Tooltip>
	);
}

export default memo(ItemEmoji);

const formatCount = (count: number) => {
	if (count < 1000) {
		return count;
	}

	const units = ['', 'K', 'M', 'G', 'T'];
	const unitIndex = Math.min(Math.floor(Math.log10(Math.abs(count)) / 3), units.length - 1);
	const value = count / Math.pow(1000, unitIndex);
	return value.toFixed(1) + units[unitIndex];
};
