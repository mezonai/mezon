import { selectComputedReactionsByMessageId } from '@mezon/store';
import { IMessageWithUser } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ItemEmoji from './ItemEmoji';
import ReactionBottom from './ReactionBottom';

type MessageReactionProps = {
	message: IMessageWithUser;
	mode: number;
};

const ReactionContent: React.FC<MessageReactionProps> = ({ message, mode }) => {
	const smileButtonRef = useRef<HTMLDivElement | null>(null);
	const [showIconSmile, setShowIconSmile] = useState<boolean>(false);

	return (
		<div
			className="pl-[72px] w-fit flex flex-wrap gap-2 whitespace-pre-wrap"
			onMouseEnter={() => setShowIconSmile(true)}
			onMouseLeave={() => setShowIconSmile(false)}
		>
			{message?.reactions?.map((emoji, index) => (
				<ItemEmoji key={`${index}-${message.id}`} message={message} mode={mode} emoji={emoji as any} />
			))}
			{showIconSmile && (
				<div className="w-6 h-6 flex justify-center items-center cursor-pointer relative">
					<ReactionBottom messageIdRefReaction={message.id} smileButtonRef={smileButtonRef} />
				</div>
			)}
		</div>
	);
};

const MessageReaction: React.FC<MessageReactionProps> = ({ message, mode }) => {
	const messageReactions = useSelector(selectComputedReactionsByMessageId(message.channel_id, message.id));
	if ((message?.reactions && message?.reactions?.length > 0) || messageReactions?.length > 0) {
		return <ReactionContent message={{ ...message, reactions: messageReactions as any }} mode={mode} />;
	}
	return null;
};

export default MessageReaction;
