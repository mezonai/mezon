import { MessageBox, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useChatSending, useEscapeKey } from '@mezon/core';
import {
	ETypeMission,
	getStoreAsync,
	onboardingActions,
	referencesActions,
	selectAnonymousMode,
	selectCurrentClanIsOnboarding,
	selectDataReferences,
	selectMissionDone,
	selectOnboardingByClan,
	selectProcessingByClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageSendPayload, ThreadValue } from '@mezon/utils';
import { DONE_ONBOARDING_STATUS, blankReferenceObj } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';

export type ChannelMessageBoxProps = {
	channel: ApiChannelDescription;
	clanId?: string;
	mode: number;
};

export function ChannelMessageBox({ channel, clanId, mode }: Readonly<ChannelMessageBoxProps>) {
	const currentMission = useSelector((state) => selectMissionDone(state, clanId as string));
	const channelId = useMemo(() => {
		return channel?.channel_id;
	}, [channel?.channel_id]);

	const dispatch = useDispatch();
	const appDispatch = useAppDispatch();
	const { sendMessage, sendMessageTyping } = useChatSending({ channelOrDirect: channel, mode });
	const anonymousMode = useSelector(selectAnonymousMode);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, channelId ?? ''));
	const chatboxRef = useRef<HTMLDivElement | null>(null);
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const onboardingList = useSelector((state) => selectOnboardingByClan(state, clanId as string));

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymous?: boolean,
			mentionEveryone?: boolean,
			displayName?: string,
			clanNick?: string,
			ephemeralReceiverId?: string
		) => {
			sendMessage(content, mentions, attachments, references, anonymous, mentionEveryone, false, undefined, ephemeralReceiverId);
			handDoMessageMission();
		},
		[sendMessage, currentMission, onboardingList?.mission]
	);

	const handDoMessageMission = async () => {
		const store = (await getStoreAsync()).getState();
		const processingClan = selectProcessingByClan(store, clanId as string);
		if (
			processingClan?.onboarding_step !== DONE_ONBOARDING_STATUS &&
			currentClanIsOnboarding &&
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
		sendMessageTyping();
	}, [sendMessageTyping]);
	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

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
		<div className="mx-3 relative" ref={chatboxRef}>
			{dataReferences.message_ref_id && <ReplyMessageBox channelId={channelId ?? ''} dataReferences={dataReferences} />}
			<MessageBox
				listMentions={UserMentionList({
					channelID: mode === ChannelStreamMode.STREAM_MODE_THREAD ? (channel.parent_id ?? '') : (channelId ?? ''),
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
					<Icons.HatIcon defaultSize="w-7 h-7  " />
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
