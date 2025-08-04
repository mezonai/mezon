import { useChatSending } from '@mezon/core';
import { IMessageSendPayload, IMessageTypeCallLog } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useCallback, useRef } from 'react';

export interface GroupCallChatHookReturn {
	sendStartCallMessage: (isVideo: boolean) => void;
	sendEndCallMessage: (isVideo: boolean) => void;
	sendCancelCallMessage: (isVideo: boolean) => void;
	sendRejectCallMessage: (isVideo: boolean) => void;
	sendTimeoutCallMessage: (isVideo: boolean) => void;
}

interface GroupCallChatHookParams {
	currentGroup: any;
}

export const useGroupCallChat = ({ currentGroup }: GroupCallChatHookParams): GroupCallChatHookReturn => {
	const mode = currentGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentGroup, mode });
	const callStartTimeRef = useRef<number | null>(null);

	const sendStartCallMessage = useCallback(
		(isVideo: boolean) => {
			callStartTimeRef.current = Date.now();

			const callLogContent: IMessageSendPayload = {
				t: `Started ${isVideo ? 'video' : 'voice'} call`,
				callLog: {
					isVideo,
					callLogType: IMessageTypeCallLog.STARTCALL,
					showCallBack: false
				}
			};
			sendMessage(callLogContent);
		},
		[sendMessage]
	);

	const sendEndCallMessage = useCallback(
		(isVideo: boolean) => {
			const duration = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;
			const minutes = Math.floor(duration / 60000);
			const seconds = Math.floor((duration % 60000) / 1000);

			const durationText = duration > 0 ? `Call duration: ${minutes}m ${seconds}s` : `Group call ended`;

			const endCallLogContent: IMessageSendPayload = {
				t: durationText,
				callLog: {
					isVideo,
					callLogType: IMessageTypeCallLog.FINISHCALL,
					showCallBack: false
				}
			};
			sendMessage(endCallLogContent);

			callStartTimeRef.current = null;
		},
		[sendMessage]
	);

	const sendCancelCallMessage = useCallback(
		(isVideo: boolean) => {
			const cancelCallContent: IMessageSendPayload = {
				t: `Cancelled ${isVideo ? 'video' : 'voice'} call`,
				callLog: {
					isVideo,
					callLogType: IMessageTypeCallLog.CANCELCALL,
					showCallBack: false
				}
			};
			sendMessage(cancelCallContent);

			callStartTimeRef.current = null;
		},
		[sendMessage]
	);

	const sendRejectCallMessage = useCallback(
		(isVideo: boolean) => {
			const rejectCallContent: IMessageSendPayload = {
				t: `Declined ${isVideo ? 'video' : 'voice'} call`,
				callLog: {
					isVideo,
					callLogType: IMessageTypeCallLog.REJECTCALL,
					showCallBack: false
				}
			};
			sendMessage(rejectCallContent);
		},
		[sendMessage]
	);

	const sendTimeoutCallMessage = useCallback(
		(isVideo: boolean) => {
			const timeoutCallContent: IMessageSendPayload = {
				t: `${isVideo ? 'Video' : 'Voice'} call timed out`,
				callLog: {
					isVideo,
					callLogType: IMessageTypeCallLog.TIMEOUTCALL,
					showCallBack: false
				}
			};
			sendMessage(timeoutCallContent);
		},
		[sendMessage]
	);

	return {
		sendStartCallMessage,
		sendEndCallMessage,
		sendCancelCallMessage,
		sendRejectCallMessage,
		sendTimeoutCallMessage
	};
};
