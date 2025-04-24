import { selectMessageByMessageId, useAppSelector } from '@mezon/store';
import { EmojiDataOptionals, IMessageWithUser } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import ItemEmoji from './ItemEmoji';
import ReactionBottom from './ReactionBottom';

type MessageReactionProps = {
	message: IMessageWithUser;
	mode: number;
	isTopic: boolean;
};

const ReactionContent: React.FC<MessageReactionProps> = ({ message, mode, isTopic }) => {
	const smileButtonRef = useRef<HTMLDivElement | null>(null);
	const [showIconSmile, setShowIconSmile] = useState<boolean>(false);

	return (
		<div
			className="pl-[72px] w-fit flex flex-wrap gap-2 whitespace-pre-wrap"
			onMouseEnter={() => setShowIconSmile(true)}
			onMouseLeave={() => setShowIconSmile(false)}
		>
			{message?.reactions?.map((emoji, index) => (
				<ItemEmoji key={`${index}-${message.id}`} message={message} mode={mode} emoji={emoji as any} isTopic={isTopic} />
			))}
			{showIconSmile && (
				<div className="w-6 h-6 flex justify-center items-center cursor-pointer relative">
					<ReactionBottom messageIdRefReaction={message.id} smileButtonRef={smileButtonRef} />
				</div>
			)}
		</div>
	);
};

const MessageReaction: React.FC<MessageReactionProps> = ({ message, mode, isTopic }) => {
	const messageReaction = useAppSelector((state) => selectMessageByMessageId(state, message.channel_id, message.id));

	if (messageReaction?.reactions && messageReaction?.reactions?.length > 0) {
		return (
			<ReactionContent
				message={{ ...message, reactions: combineMessageReactions(messageReaction.reactions, message.id) }}
				mode={mode}
				isTopic={isTopic}
			/>
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
				message_id: message_id,
				// TODO: TBD
				id: '',
				channel_id: ''
			};
		}
		if (!reaction.sender_name) continue;
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
