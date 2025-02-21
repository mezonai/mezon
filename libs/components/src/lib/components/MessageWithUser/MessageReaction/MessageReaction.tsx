import {
	selectComputedReactionsByMessageId,
	selectIsMessageHasReaction,
	selectMessageReaction,
	selectReactionBottomState,
	selectReactionBottomStateResponsive
} from '@mezon/store';
import { IMessageWithUser } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { GifStickerEmojiPopup } from '../../GifsStickersEmojis';
import ItemEmoji from './ItemEmoji';
import ReactionBottom from './ReactionBottom';

type MessageReactionProps = {
	message: IMessageWithUser;
	mode: number;
};

function useMessageReaction(channelId: string, messageId: string) {
	const computedReactions = useSelector(selectComputedReactionsByMessageId(channelId, messageId));

	return computedReactions;
}

const MessageReaction: React.FC<MessageReactionProps> = ({ message, mode }) => {
	const smileButtonRef = useRef<HTMLDivElement | null>(null);
	const [showIconSmile, setShowIconSmile] = useState<boolean>(false);
	const reactionBottomState = useSelector(selectReactionBottomState);
	const reactionBottomStateResponsive = useSelector(selectReactionBottomStateResponsive);
	const messageReactionSelected = useSelector(selectMessageReaction);
	const messageReactions = useMessageReaction(message.channel_id, message.id);
	const checkHasEmoji = useSelector(selectIsMessageHasReaction(message.channel_id, message.id));

	const isMessageMatched = message.id === messageReactionSelected?.id;

	return (
		<div className="relative pl-3">
			{isMessageMatched && reactionBottomState && reactionBottomStateResponsive && (
				<div className="w-fit md:hidden z-30 absolute bottom-0 block">
					<div className="scale-75 transform mb-0 z-20">
						<GifStickerEmojiPopup mode={mode} />
					</div>
				</div>
			)}

			<div className="flex gap-2 ml-14">
				<div
					className="w-fit flex flex-wrap gap-2 whitespace-pre-wrap"
					onMouseEnter={() => setShowIconSmile(true)}
					onMouseLeave={() => setShowIconSmile(false)}
				>
					{messageReactions.map((emoji, index) => (
						<ItemEmoji key={`${index}-${message.id}`} message={message} mode={mode} emoji={emoji} />
					))}
					{checkHasEmoji && (
						<div className="w-6 h-6 flex justify-center items-center cursor-pointer relative">
							{showIconSmile && <ReactionBottom messageReactionSelected={message} smileButtonRef={smileButtonRef} />}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default React.memo(MessageReaction);
