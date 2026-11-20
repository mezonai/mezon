import { consumeReactionEffect, useChatReaction } from '@mezon/core';
import { getStore, selectAllAccount, selectCurrentChannel, selectEmojiSrcById, useAppSelector } from '@mezon/store';
import type { EmojiDataOptionals, IMessageWithUser, SenderInfoOptionals } from '@mezon/utils';
import { calculateTotalCount, getSrcEmoji, isPublicChannel } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import type { CSSProperties } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import UserReactionPanel from './UserReactionPanel';

export const REACTION_POP_KEYFRAMES: Keyframe[] = [
	{ transform: 'scale(1)' },
	{ transform: 'scale(1.3)', offset: 0.35 },
	{ transform: 'scale(0.94)', offset: 0.7 },
	{ transform: 'scale(1)' }
];
const REACTION_FLY_OFFSETS = [-14, 0, 14];

type EmojiItemProps = {
	emoji: EmojiDataOptionals;
	message: IMessageWithUser;
	isTopic: boolean;
};

function ItemEmoji({ emoji, message, isTopic }: EmojiItemProps) {
	const { reactionMessageDispatch } = useChatReaction();
	const emojiSrc = useAppSelector((state) => selectEmojiSrcById(state, emoji.emojiId || ''));
	const getUrlItem = getSrcEmoji(emoji.emojiId || '', emojiSrc);
	const count = calculateTotalCount(emoji.senders);
	const userId = useSelector(selectAllAccount)?.user?.id as string;
	const userSenderCount = emoji.senders?.find((sender: SenderInfoOptionals) => sender.sender_id === userId)?.count;
	const chipRef = useRef<HTMLDivElement>(null);
	const [flyKey, setFlyKey] = useState(0);

	useEffect(() => {
		if (!consumeReactionEffect(emoji.message_id ?? '', emoji.emojiId ?? '')) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		chipRef.current?.animate(REACTION_POP_KEYFRAMES, { duration: 380, easing: 'ease-out' });
		setFlyKey(Date.now());
	}, [count, emoji.message_id, emoji.emojiId]);

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
				ref={chipRef}
				className={`relative h-6 rounded-md w-fit min-w-12 px-1.5 gap-1.5 flex flex-row noselect
          cursor-pointer justify-center items-center text-sm leading-none font-medium text-theme-primary
          ${Number(userSenderCount) > 0 ? 'highlight-react-theme' : 'bg-theme-primary'}`}
				onClick={() => reactOnExistEmoji(emoji.emojiId ?? '', emoji.message_id ?? '', emoji.emojiId ?? '', emoji.emoji ?? '', 1, false)}
			>
				<img src={getUrlItem} className="w-4 h-4 shrink-0 object-scale-down" alt="" />
				{formatCount(count)}
				{flyKey > 0 && (
					<span key={flyKey} className="pointer-events-none absolute left-1/2 top-0 z-10">
						{REACTION_FLY_OFFSETS.map((offset, index) => (
							<img
								key={offset}
								src={getUrlItem}
								alt=""
								className="absolute left-0 top-0 w-4 h-4 max-w-none object-scale-down animate-reaction_fly"
								style={{ '--reaction-fly-x': `${offset}px`, animationDelay: `${index * 70}ms` } as CSSProperties}
								onAnimationEnd={index === REACTION_FLY_OFFSETS.length - 1 ? () => setFlyKey(0) : undefined}
							/>
						))}
					</span>
				)}
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
