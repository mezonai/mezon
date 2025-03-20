import { useChatReaction } from '@mezon/core';
import { selectAllAccount, selectClickedOnTopicStatus, selectCurrentChannel } from '@mezon/store';
import { EmojiDataOptionals, IMessageWithUser, SenderInfoOptionals, calculateTotalCount, getSrcEmoji, isPublicChannel } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import UserReactionPanel from './UserReactionPanel';

type EmojiItemProps = {
	emoji: EmojiDataOptionals;
	mode: number;
	message: IMessageWithUser;
};

function ItemEmoji({ emoji, mode, message }: EmojiItemProps) {
	const userId = useSelector(selectAllAccount)?.user?.id as string;
	const { reactionMessageDispatch } = useChatReaction();
	const getUrlItem = getSrcEmoji(emoji.emojiId || '');
	const count = calculateTotalCount(emoji.senders);
	const userSenderCount = emoji.senders.find((sender: SenderInfoOptionals) => sender.sender_id === userId)?.count;
	const currentChannel = useSelector(selectCurrentChannel);
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);

	async function reactOnExistEmoji(
		id: string,
		mode: number,
		messageId: string,
		emojiId: string,
		emoji: string,
		count: number,
		message_sender_id: string,
		action_delete: boolean
	) {
		await reactionMessageDispatch(
			id,

			messageId ?? '',
			emojiId ?? '',
			emoji ?? '',
			1,
			message_sender_id ?? '',
			false,
			isPublicChannel(currentChannel),
			isFocusTopicBox,
			message?.channel_id
		);
	}

	return (
		<Tooltip overlay={<UserReactionPanel message={message} emojiShowPanel={emoji} mode={mode} />} placement="top">
			<div
				style={{ height: 24 }}
				className={`rounded-md w-fit min-w-12 gap-3 h-6 flex flex-row noselect
          cursor-pointer justify-center items-center relative pl-7 text-sm font-medium dark:text-[#E6E6E6] text-black
          ${Number(userSenderCount) > 0 ? 'dark:bg-[#373A54] bg-gray-200 border-blue-600 border' : 'dark:bg-[#2B2D31] bg-bgLightMode border-[#313338]'}`}
				onClick={() =>
					reactOnExistEmoji(
						emoji.emojiId ?? '',
						mode,
						emoji.message_id ?? '',
						emoji.emojiId ?? '',
						emoji.emoji ?? '',
						1,
						userId ?? '',
						false
					)
				}
			>
				<img src={getUrlItem} className="absolute left-[5px] w-4 h-4 object-scale-down" alt="" />
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
	return Math.floor(value) + units[unitIndex];
};
