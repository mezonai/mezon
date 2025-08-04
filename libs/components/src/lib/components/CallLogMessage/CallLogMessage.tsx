import { useChatSending } from '@mezon/core';
import {
	audioCallActions,
	selectAllAccount,
	selectAudioBusyTone,
	selectAudioDialTone,
	selectAudioRingTone,
	selectDmGroupCurrent,
	selectIsInCall,
	selectSession,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { CallLog, IMessageCallLog, IMessageSendPayload, IMessageTypeCallLog } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

type CallLogMessageProps = {
	userId: string;
	username: string;
	messageId: string;
	channelId: string;
	senderId: string;
	callLog: IMessageCallLog;
	contentMsg: string;
};

const iconMap: { [key: string]: { icon: JSX.Element; text: string; colorClass: string; bgClass: string } } = {
	[`${IMessageTypeCallLog.TIMEOUTCALL}_SENDER`]: {
		icon: <Icons.OutGoingCall defaultSize="w-6 h-6" />,
		text: CallLog.OUTGOING_CALL,
		colorClass: 'text-red-500',
		bgClass: 'from-blue-500 to-indigo-600'
	},
	[`${IMessageTypeCallLog.TIMEOUTCALL}_RECEIVER`]: {
		icon: <Icons.MissedCall defaultSize="w-6 h-6" />,
		text: CallLog.MISSED,
		colorClass: 'text-red-500',
		bgClass: 'from-red-500 to-orange-600'
	},
	[`${IMessageTypeCallLog.FINISHCALL}_SENDER`]: {
		icon: <Icons.OutGoingCall defaultSize="w-6 h-6" />,
		text: CallLog.OUTGOING_CALL,
		colorClass: '',
		bgClass: 'from-yellow-500 to-red-500'
	},
	[`${IMessageTypeCallLog.FINISHCALL}_RECEIVER`]: {
		icon: <Icons.IncomingCall defaultSize="w-6 h-6" />,
		text: CallLog.INCOMING_CALL,
		colorClass: '',
		bgClass: 'from-yellow-500 to-red-500'
	},
	[`${IMessageTypeCallLog.REJECTCALL}_SENDER`]: {
		icon: <Icons.CancelCall defaultSize="w-6 h-6" />,
		text: CallLog.RECIPIENT_DECLINED,
		colorClass: 'text-red-500',
		bgClass: 'from-yellow-500 to-red-500'
	},
	[`${IMessageTypeCallLog.REJECTCALL}_RECEIVER`]: {
		icon: <Icons.CancelCall defaultSize="w-6 h-6" />,
		text: CallLog.YOU_DECLINED,
		colorClass: 'text-red-500',
		bgClass: 'from-yellow-500 to-red-500'
	},
	[`${IMessageTypeCallLog.CANCELCALL}_SENDER`]: {
		icon: <Icons.CancelCall defaultSize="w-6 h-6" />,
		text: CallLog.YOU_CANCELED,
		colorClass: 'text-red-500',
		bgClass: 'from-yellow-500 to-red-500'
	},
	[`${IMessageTypeCallLog.CANCELCALL}_RECEIVER`]: {
		icon: <Icons.MissedCall defaultSize="w-6 h-6" />,
		text: CallLog.MISSED,
		colorClass: 'text-red-500',
		bgClass: 'from-yellow-500 to-red-500'
	}
};

export default function CallLogMessage({ userId, username, messageId, channelId, senderId, callLog, contentMsg }: CallLogMessageProps) {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	const sessionUser = useSelector(selectSession);
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const isInCall = useSelector(selectIsInCall);
	const isPlayDialTone = useSelector(selectAudioDialTone);
	const isPlayRingTone = useSelector(selectAudioRingTone);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const userProfile = useSelector(selectAllAccount);
	const isMe = useMemo(() => userProfile?.user?.id === senderId, [userProfile?.user?.id, senderId]);
	const key = `${callLog.callLogType}_${isMe ? 'SENDER' : 'RECEIVER'}`;

	const shouldShowCallBack = callLog.showCallBack !== false;

	const { icon, text, colorClass, bgClass } = iconMap[key] || {
		icon: <Icons.OutGoingCall defaultSize="w-6 h-6" />,
		text: `${username} started ${callLog.isVideo ? 'a video' : 'an audio'} call`,
		colorClass: '',
		bgClass: ''
	};
	const callLogMessage =
		callLog.callLogType === IMessageTypeCallLog.FINISHCALL
			? contentMsg
			: callLog.callLogType === IMessageTypeCallLog.TIMEOUTCALL && isMe
				? CallLog.TIME_DEFAULT
				: `${callLog.isVideo ? CallLog.VIDEO_CALL : CallLog.VOICE_CALL}`;

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

	const handleStartCall = () => {
		if (!isInCall) {
			handleSend(
				{
					t: `Started ${callLog.isVideo ? 'video' : 'voice'} call`,
					callLog: {
						isVideo: callLog.isVideo,
						callLogType: IMessageTypeCallLog.STARTCALL,
						showCallBack: false
					}
				},
				[],
				[],
				[]
			);
			dispatch(audioCallActions.startDmCall({ groupId: channelId, isVideo: callLog.isVideo }));
			dispatch(audioCallActions.setGroupCallId(channelId));
			dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_id?.[0]));
			dispatch(audioCallActions.setIsBusyTone(false));
		} else {
			dispatch(toastActions.addToast({ message: 'You are on another call', type: 'warning', autoClose: 3000 }));
		}
	};

	return (
		<div className="w-full rounded-lg overflow-hidden text-left relative mt-2 text-theme-primary">
			<div className="w-fit max-w-[520px] border bg-item-theme border-theme-primary rounded-lg shadow-lg">
				<div className="w-full border-b border-color-primary px-5 py-4 flex flex-col gap-4">
					<div className={`flex items-center justify-between bg-gradient-to-r rounded-t-lg`}>
						<span className={`${colorClass} font-semibold`}>{text}</span>
					</div>

					<div className="flex gap-2 items-center">
						<span className=" text-xl">{icon}</span>
						<div className="text-sm ">{callLogMessage}</div>
					</div>
				</div>
				{shouldShowCallBack && (
					<button
						onClick={handleStartCall}
						className={`flex justify-center items-center w-full text-center p-3 uppercase text-blue-500 font-normal`}
						disabled={isInCall || isPlayDialTone || isPlayRingTone || isPlayBusyTone}
					>
						{CallLog.CALL_BACK}
					</button>
				)}
			</div>
		</div>
	);
}
