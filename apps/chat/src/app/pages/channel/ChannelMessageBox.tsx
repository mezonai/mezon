import { GifStickerEmojiPopup, MessageBox, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useChatSending, useEscapeKey, useGifsStickersEmoji } from '@mezon/core';
import { referencesActions, selectIdMessageRefReaction, selectIdMessageRefReply } from '@mezon/store';
import { EmojiPlaces, IMessageSendPayload, SubPanelName, ThreadValue } from '@mezon/utils';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';

export type ChannelMessageBoxProps = {
	channelId: string;
	clanId?: string;
	mode: number;
};

export function ChannelMessageBox({ channelId, clanId, mode }: Readonly<ChannelMessageBoxProps>) {
	const dispatch = useDispatch();
	const { sendMessage, sendMessageTyping } = useChatSending({ channelId, mode });
	const { subPanelActive } = useGifsStickersEmoji();
	const [isEmojiOnChat, setIsEmojiOnChat] = useState<boolean>(false);
	const [emojiAction, setEmojiAction] = useState<EmojiPlaces>(EmojiPlaces.EMOJI_REACTION_NONE);
	const idMessageRefReaction = useSelector(selectIdMessageRefReaction);
	const idMessageRefReply = useSelector(selectIdMessageRefReply(channelId));

	const messageBox = useRef<HTMLDivElement>(null);
	const setMarginleft = useMemo(() => {
		if (messageBox?.current?.getBoundingClientRect()) {
			return window.innerWidth - messageBox?.current?.getBoundingClientRect().right + 10;
		}
	}, [messageBox.current?.getBoundingClientRect()]);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymous?: boolean,
			mentionEveryone?: boolean
		) => {
			sendMessage(content, mentions, attachments, references, anonymous, mentionEveryone);
		},
		[sendMessage]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);
	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	useEffect(() => {
		if (
			subPanelActive !== SubPanelName.NONE &&
			subPanelActive !== SubPanelName.EMOJI_REACTION_RIGHT &&
			subPanelActive !== SubPanelName.EMOJI_REACTION_BOTTOM
		) {
			setIsEmojiOnChat(true);
		} else {
			setIsEmojiOnChat(false);
		}
	}, [subPanelActive]);

	useEffect(() => {
		if (
			(subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && window.innerWidth < 640) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && window.innerWidth < 640)
		) {
			setIsEmojiOnChat(true);
		}
	}, [subPanelActive]);

	useEffect(() => {
		if (subPanelActive === SubPanelName.EMOJI) {
			setEmojiAction(EmojiPlaces.EMOJI_EDITOR);
		}
		if (subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM) {
			setEmojiAction(EmojiPlaces.EMOJI_REACTION);
		}
	}, [subPanelActive]);

	const handleCloseReplyMessageBox = () => {
		dispatch(referencesActions.setIdReferenceMessageReply({ channelId, idMessageRefReply: '' }));
	};

	useEscapeKey(handleCloseReplyMessageBox);

	return (
		<div className="mx-2 relative " role="button" ref={messageBox}>
			{isEmojiOnChat && (
				<div
					style={{
						right: setMarginleft
					}}
					onClick={(e) => {
						e.stopPropagation();
					}}
					className="max-sbm:bottom-[60px] bottom-[76px] fixed z-10"
				>
					<GifStickerEmojiPopup />
				</div>
			)}
			{idMessageRefReply && <ReplyMessageBox channelId={channelId} idMessage={idMessageRefReply} />}
			<MessageBox
				listMentions={UserMentionList({ channelID: channelId, channelMode: mode })}
				onSend={handleSend}
				onTyping={handleTypingDebounced}
				currentChannelId={channelId}
				currentClanId={clanId}
				mode={mode}
			/>
		</div>
	);
}

ChannelMessageBox.Skeleton = () => {
	return (
		<div>
			<MessageBox.Skeleton />
		</div>
	);
};
