import { useIdleRender, useQuickReactionEmoji } from '@mezon/core';
import { selectBanMeInChannel, selectEmojiSrcById, selectMessageByMessageId, useAppSelector } from '@mezon/store';
import type { EmojiDataOptionals, IMessageWithUser } from '@mezon/utils';
import { getSrcEmoji } from '@mezon/utils';
import type { CSSProperties } from 'react';
import React, { useRef, useState } from 'react';
import ReactionItem from '../../ContextMenu/ReactionItem';
import ItemEmoji, { REACTION_POP_KEYFRAMES } from './ItemEmoji';
import ItemEmojiSkeleton from './ItemEmojiSkeleton';
import ReactionBottom from './ReactionBottom';

type MessageReactionProps = {
	message: IMessageWithUser;
	isTopic: boolean;
};

const QUICK_REACTION_BURST = Array.from({ length: 8 }, (_, index) => {
	const angle = (index * Math.PI) / 4 - Math.PI / 2;
	const distance = index % 2 ? 20 : 28;
	return { x: Math.round(Math.cos(angle) * distance), y: Math.round(Math.sin(angle) * distance) };
});

export const QuickReaction = ({ message, isTopic, className }: MessageReactionProps & { className: string }) => {
	const quickReaction = useQuickReactionEmoji();
	const emojiSrc = useAppSelector((state) => selectEmojiSrcById(state, quickReaction?.id || ''));
	const isBanned = useAppSelector((state) => selectBanMeInChannel(state, message.channel_id));
	const popRef = useRef<HTMLSpanElement>(null);
	const [burstKey, setBurstKey] = useState(0);

	if (!quickReaction?.id || isBanned) {
		return null;
	}

	const handleClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		popRef.current?.animate(REACTION_POP_KEYFRAMES, { duration: 420, easing: 'ease-out' });
		setBurstKey(Date.now());
	};

	return (
		<span className={`absolute invisible group-hover:visible select-none ${className}`} onClick={handleClick}>
			<span ref={popRef} className="flex">
				<ReactionItem
					emojiShortCode={quickReaction.shortname || ''}
					emojiId={quickReaction.id}
					messageId={message.id}
					isOption={false}
					message={message}
					isTopic={isTopic}
					className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer bg-theme-contexify border-theme-primary shadow-md transition-transform duration-100 hover:scale-110 [&>img]:w-4 [&>img]:h-4"
				/>
			</span>
			{burstKey > 0 && (
				<span key={burstKey} className="pointer-events-none absolute left-1/2 top-1/2">
					{QUICK_REACTION_BURST.map(({ x, y }, index) => (
						<img
							key={index}
							src={getSrcEmoji(quickReaction.id || '', emojiSrc)}
							alt=""
							className="absolute z-100 left-0 top-0 w-3.5 h-3.5 max-w-none object-scale-down animate-reaction_burst"
							style={{ '--reaction-burst-x': `${x}px`, '--reaction-burst-y': `${y}px` } as CSSProperties}
							onAnimationEnd={index === 0 ? () => setBurstKey(0) : undefined}
						/>
					))}
				</span>
			)}
		</span>
	);
};

const ReactionContent: React.FC<MessageReactionProps> = ({ message, isTopic }) => {
	const smileButtonRef = useRef<HTMLDivElement | null>(null);
	const [showIconSmile, setShowIconSmile] = useState<boolean>(false);
	const shouldRender = useIdleRender();

	return (
		<div
			className="pl-[72px] w-fit flex flex-wrap gap-2 whitespace-pre-wrap"
			onMouseEnter={() => setShowIconSmile(true)}
			onMouseLeave={() => setShowIconSmile(false)}
		>
			{!shouldRender && message?.reactions?.map((emoji, index) => <ItemEmojiSkeleton key={`${index}-${message.id}`} />)}
			{shouldRender &&
				message?.reactions?.map((emoji, index) => (
					<ItemEmoji key={`${index}-${message.id}`} message={message} emoji={emoji as any} isTopic={isTopic} />
				))}
			{showIconSmile && (
				<div className="w-6 h-6 flex justify-center items-center cursor-pointer relative bg-item-hover hover:bg-item-theme rounded-md">
					<ReactionBottom messageIdRefReaction={message.id} smileButtonRef={smileButtonRef} />
				</div>
			)}
		</div>
	);
};

const MessageReaction: React.FC<MessageReactionProps> = ({ message, isTopic }) => {
	const messageReaction = useAppSelector((state) => selectMessageByMessageId(state, message.channel_id, message.id));

	if (messageReaction?.reactions && messageReaction?.reactions?.length > 0) {
		return (
			<ReactionContent message={{ ...message, reactions: combineMessageReactions(messageReaction.reactions, message.id) }} isTopic={isTopic} />
		);
	}
	return null;
};

export default MessageReaction;

export function combineMessageReactions(reactions: any[], message_id: string): any[] {
	const dataCombined: Record<string, EmojiDataOptionals> = {};

	for (const reaction of reactions) {
		const emojiId = reaction.emoji_id || ('' as string);
		const emoji = reaction.emoji || ('' as string);

		if (reaction.count < 1) {
			continue;
		}

		if (!dataCombined[emojiId]) {
			dataCombined[emojiId] = {
				emojiId,
				emoji,
				senders: [],
				action: false,
				message_id,
				id: '',
				channel_id: ''
			};
		}
		//if (!reaction.sender_name) continue;
		const newSender = {
			sender_id: reaction.sender_id,
			count: reaction.count
		};

		const reactionData = dataCombined[emojiId];
		const senderIndex = reactionData.senders.findIndex((sender) => sender.sender_id === newSender.sender_id);

		if (senderIndex === -1) {
			reactionData.senders.push(newSender);
		} else if (reactionData?.senders[senderIndex]) {
			reactionData.senders[senderIndex].count = newSender.count;
		}
	}

	const dataCombinedArray = Object.values(dataCombined);

	return dataCombinedArray;
}
