import { GifStickerEmojiPopup, MessageBox, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useChatSending, useEscapeKey, useGifsStickersEmoji } from '@mezon/core';
import {
	ETypeMission,
	messagesActions,
	onboardingActions,
	referencesActions,
	selectAllAccount,
	selectAnonymousMode,
	selectCurrentClan,
	selectDataReferences,
	selectIsViewingOlderMessagesByChannelId,
	selectMemberClanByUserId2,
	selectMissionDone,
	selectOnboardingByClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EmojiPlaces, IMessageSendPayload, SubPanelName, ThreadValue, blankReferenceObj } from '@mezon/utils';
import classNames from 'classnames';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { ChannelJumpToPresent } from './ChannelJumpToPresent';

export type ChannelMessageBoxProps = {
	channel: ApiChannelDescription;
	clanId?: string;
	mode: number;
};

export function ChannelMessageBox({ channel, clanId, mode }: Readonly<ChannelMessageBoxProps>) {
  console.log('channel: ', channel);
	const isViewingOldMessage = useAppSelector((state) => selectIsViewingOlderMessagesByChannelId(state, channel?.channel_id ?? ''));
	const currentMission = useSelector(selectMissionDone);

	const dispatch = useDispatch();
	const appDispatch = useAppDispatch();
	const { subPanelActive } = useGifsStickersEmoji();
	const anonymousMode = useSelector(selectAnonymousMode);
  const channelId = channel.channel_id ?? '';
	const dataReferences = useSelector(selectDataReferences(channelId));
	const [isEmojiOnChat, setIsEmojiOnChat] = useState<boolean>(false);
	const chatboxRef = useRef<HTMLDivElement | null>(null);
	const currentClan = useSelector(selectCurrentClan);
	const onboardingList = useSelector((state) => selectOnboardingByClan(state, clanId as string));

  const userProfile = useSelector(selectAllAccount);

	const profileInTheClan = useAppSelector((state) => selectMemberClanByUserId2(state, userProfile?.user?.id ?? ''));
	const priorityAvatar =
		mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? profileInTheClan?.clan_avatar
				? profileInTheClan?.clan_avatar
				: userProfile?.user?.avatar_url
			: userProfile?.user?.avatar_url;

	const priorityDisplayName = userProfile?.user?.display_name ? userProfile?.user?.display_name : userProfile?.user?.username;
	const priorityNameToShow =
		mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? profileInTheClan?.clan_nick
				? profileInTheClan?.clan_nick
				: priorityDisplayName
			: priorityDisplayName;

  const currentUserId = userProfile?.user?.id || '';

	const handleSend = useCallback(
	async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymous?: boolean,
			mentionEveryone?: boolean
		) => {
      await appDispatch(
				messagesActions.sendMessage({
					channelId: channel.channel_id ?? '',
					clanId: clanId || '',
					mode,
					isPublic: !channel?.channel_private,
					content: content,
					mentions: mentions,
					attachments,
					references,
					anonymous,
					mentionEveryone,
					senderId: currentUserId,
					avatar: priorityAvatar,
					username: priorityNameToShow,
				})
			);


			handDoMessageMission();
		},
		[channel,currentMission]
	);

	const handDoMessageMission = () => {
		if (
			currentClan?.is_onboarding &&
			onboardingList?.mission?.[currentMission]?.channel_id === channel?.channel_id &&
			onboardingList?.mission?.[currentMission]?.task_type === ETypeMission.SEND_MESSAGE
		) {
			dispatch(onboardingActions.doneMission({ clan_id: clanId as string }));
			if (currentMission + 1 === onboardingList.mission.length) {
				appDispatch(onboardingActions.doneOnboarding({ clan_id: clanId as string }));
			}
		}
	};

	const handleTyping = useCallback(() => {
		if (!anonymousMode) {
			appDispatch(
				messagesActions.sendTypingUser({
					clanId: clanId || '0',
					channelId: channel.channel_id ?? '',
					mode,
					isPublic: !channel?.channel_private
				})
			);
		}

		// sendMessageTyping();
	}, [channel]);
	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	useEffect(() => {
		const isEmojiReactionPanel = subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM;

		const isOtherActivePanel = subPanelActive !== SubPanelName.NONE && !isEmojiReactionPanel;

		const isSmallScreen = window.innerWidth < 640;

		const isStreamChat = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING;

		const isActive = isOtherActivePanel || (isEmojiReactionPanel && isSmallScreen) || (isEmojiReactionPanel && isStreamChat);

		setIsEmojiOnChat(isActive);
	}, [subPanelActive]);

	const handleCloseReplyMessageBox = useCallback(() => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: channelId ?? '',
				dataReferences: blankReferenceObj
			})
		);
	}, [dataReferences.message_ref_id]);

	useEscapeKey(handleCloseReplyMessageBox, { preventEvent: !dataReferences.message_ref_id });

	return (
		<div className="mx-3 relative" role="button" ref={chatboxRef}>
			{isEmojiOnChat && (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className={`right-[2px] absolute z-10 origin-bottom-right`}
					style={{
						bottom: chatboxRef.current ? `${chatboxRef.current.offsetHeight}px` : ''
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
					}}
				>
					<GifStickerEmojiPopup channelOrDirect={channel} emojiAction={EmojiPlaces.EMOJI_EDITOR} mode={mode} />
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
						<ChannelJumpToPresent clanId={clanId || ''} channelId={channelId ?? ''} className="pb-[10px]" />
					</div>
				)}
			</div>
			{dataReferences.message_ref_id && (
				<div className="relative z-1 pb-[4px]">
					<ReplyMessageBox channelId={channelId ?? ''} dataReferences={dataReferences} className="pb-[15px]" />
				</div>
			)}
			<MessageBox
				listMentions={UserMentionList({
					channelID: mode === ChannelStreamMode.STREAM_MODE_THREAD ? (channel.parrent_id ?? '') : (channelId ?? ''),
					channelMode: mode
				})}
				onSend={handleSend}
				onTyping={handleTypingDebounced}
				currentChannelId={channelId}
				currentClanId={clanId}
				mode={mode}
			/>
			{anonymousMode && (
				<div className="absolute -top-3 -right-3 rotate-45 anonymousAnimation">
					<Icons.HatIcon defaultSize="w-7 h-7 dark:fill-white fill-black " />
				</div>
			)}
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

const MemoizedChannelMessageBox = memo(ChannelMessageBox) as unknown as typeof ChannelMessageBox & { Skeleton: typeof ChannelMessageBox.Skeleton };
export default MemoizedChannelMessageBox;
