import { useChatSending, useEscapeKey, useGifsStickersEmoji } from '@mezon/core';
import {
	RootState,
	messagesActions,
	referencesActions,
	selectDataReferences,
	selectIsViewingOlderMessagesByChannelId,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EmojiPlaces, IMessageSendPayload, SubPanelName, blankReferenceObj } from '@mezon/utils';
import classNames from 'classnames';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { GifStickerEmojiPopup } from '../../GifsStickersEmojis';
import { MessageBox } from '../../MessageBox';
import { ReplyMessageBox } from '../../ReplyMessageBox';
import { UserMentionList } from '../../UserMentionList';

interface DirectIdProps {
	// directParamId: string;
	mode: number;
	direct: ApiChannelDescription;
}
export function DirectMessageBox({ mode, direct }: DirectIdProps) {
	const directParamId = useMemo(() => {
		return direct?.channel_id ?? '';
	}, [direct?.channel_id]);

	const isViewingOldMessage = useSelector(selectIsViewingOlderMessagesByChannelId(direct?.channel_id ?? ''));

	const { sendMessage, sendMessageTyping } = useChatSending({ channelOrDirect: direct, mode: mode });
	// TODO: move selector to store
	const sessionUser = useSelector((state: RootState) => state.auth.session);
	const { subPanelActive } = useGifsStickersEmoji();
	const [isEmojiOnChat, setIsEmojiOnChat] = useState<boolean>(false);
	const dataReferences = useSelector(selectDataReferences(directParamId ?? ''));
	const dispatch = useAppDispatch();

	const chatboxRef = useRef<HTMLDivElement | null>(null);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (sessionUser) {
				sendMessage(content, mentions, attachments, references);
			} else {
				console.error('Session is not available');
			}
		},
		[sendMessage, sessionUser]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	useEffect(() => {
		const isEmojiReactionPanel = subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM;

		const isOtherActivePanel = subPanelActive !== SubPanelName.NONE && !isEmojiReactionPanel;

		const isSmallScreen = window.innerWidth < 640;

		const isActive = isOtherActivePanel || (isEmojiReactionPanel && isSmallScreen);

		setIsEmojiOnChat(isActive);
	}, [subPanelActive]);

	const handleCloseReplyMessageBox = useCallback(() => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: directParamId ?? '',
				dataReferences: blankReferenceObj
			})
		);
	}, [dataReferences.message_ref_id]);

	useEscapeKey(handleCloseReplyMessageBox, { preventEvent: !dataReferences.message_ref_id });

	const handleJumpToPresent = useCallback(() => {
		dispatch(
			messagesActions.fetchMessages({
				clanId: '0',
				channelId: directParamId,
				isFetchingLatestMessages: true,
				noCache: true,
				isClearMessage: true
			})
		);
		dispatch(messagesActions.setIdMessageToJump(null));
	}, [directParamId]);

	return (
		<div className="mx-2 relative " role="button" ref={chatboxRef}>
			{isEmojiOnChat && (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className={`right-[2px] absolute z-10`}
					style={{
						bottom: chatboxRef.current ? `${chatboxRef.current.offsetHeight}px` : ''
					}}
				>
					<GifStickerEmojiPopup channelOrDirect={direct} emojiAction={EmojiPlaces.EMOJI_EDITOR} mode={mode} />
				</div>
			)}
			<div className="absolute bottom-[calc(100%-10px)] left-0 right-0">
				{isViewingOldMessage && (
					<div
						className={classNames(
							'relative z-0 px-2 py-1 text-sm bg-[#6d6f78] dark:bg-bgDarkAccent font-semibold rounded-md',
							dataReferences.message_ref_id ? 'top-[8px]' : ''
						)}
					>
						<div
							className={classNames('w-full h-full opacity-95 cursor-pointer text-white flex items-center justify-between pb-[10px]')}
							onClick={handleJumpToPresent}
						>
							<div>You're viewing older messages</div>
							<div className="flex items-center gap-1">
								Jump to present
								<Icons.JumpToPresentArrow className="w-4 h-4 text-white" />
							</div>
						</div>
					</div>
				)}
			</div>

			{dataReferences.message_ref_id && <ReplyMessageBox channelId={directParamId ?? ''} dataReferences={dataReferences} />}
			<MessageBox
				onSend={handleSend}
				currentChannelId={directParamId}
				onTyping={handleTypingDebounced}
				listMentions={UserMentionList({ channelID: directParamId ?? '', channelMode: mode })}
				mode={mode}
			/>
		</div>
	);
}

DirectMessageBox.Skeleton = () => {
	return (
		<div>
			<MessageBox.Skeleton />
		</div>
	);
};

export default DirectMessageBox;
