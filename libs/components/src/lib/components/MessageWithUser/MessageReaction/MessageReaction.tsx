import { useIdleRender } from '@mezon/core';
import { selectMessageByMessageId, useAppSelector } from '@mezon/store';
import type { EmojiDataOptionals, IMessageWithUser } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import ItemEmoji from './ItemEmoji';
import ItemEmojiSkeleton from './ItemEmojiSkeleton';
import ReactionBottom from './ReactionBottom';

type MessageReactionProps = {
	message: IMessageWithUser;
	isTopic: boolean;
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
				<div className="w-6 h-6 flex justify-center items-center cursor-pointer relative">
					<ReactionBottom messageIdRefReaction={message.id} smileButtonRef={smileButtonRef} />
				</div>
			)}
		</div>
	);
};

const MessageReaction: React.FC<MessageReactionProps> = ({ message, isTopic }) => {
	const messageReaction = useAppSelector((state) => selectMessageByMessageId(state, message.channelId, message.id));

	if (messageReaction?.reactions && messageReaction?.reactions?.length > 0) {
		return (
			<ReactionContent message={{ ...message, reactions: combineMessageReactions(messageReaction.reactions, message.id) }} isTopic={isTopic} />
		);
	}
	return null;
};

export default MessageReaction;

export function combineMessageReactions(reactions: any[], messageId: string): any[] {
	const dataCombined: Record<string, EmojiDataOptionals> = {};

	for (const reaction of reactions) {
		const emojiId = reaction.emojiId || ('' as string);
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
				messageId,
				id: '',
				channelId: ''
			};
		}
		//if (!reaction.senderName) continue;
		const newSender = {
			senderId: reaction.senderId,
			count: reaction.count
		};

		const reactionData = dataCombined[emojiId];
		const senderIndex = reactionData.senders.findIndex((sender) => sender.senderId === newSender.senderId);

		if (senderIndex === -1) {
			reactionData.senders.push(newSender);
		} else if (reactionData?.senders[senderIndex]) {
			reactionData.senders[senderIndex].count = newSender.count;
		}
	}

	const dataCombinedArray = Object.values(dataCombined);

	return dataCombinedArray;
}
