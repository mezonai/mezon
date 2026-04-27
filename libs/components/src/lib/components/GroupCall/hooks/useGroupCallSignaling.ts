import { useMezon } from '@mezon/transport';
import { WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { useCallback } from 'react';
import type { CallSignalingData } from '../utils/callDataUtils';

export interface GroupCallSignalingHookReturn {
	sendGroupCallOffer: (participants: string[], callData: CallSignalingData, channelId: string, userId: string) => void;
	sendGroupCallAnswer: (participants: string[], callData: CallSignalingData, channelId: string, userId: string) => void;
	sendGroupCallCancel: (participants: string[], callData: CallSignalingData, channelId: string, userId: string) => void;
	sendGroupCallQuit: (participants: string[], callData: CallSignalingData, channelId: string, userId: string) => void;
	sendParticipantJoined: (participants: string[], joinedData: Record<string, any>, channelId: string, userId: string) => void;
	sendParticipantLeft: (participants: string[], leftData: Record<string, any>, channelId: string, userId: string) => void;
}

export const useGroupCallSignaling = (): GroupCallSignalingHookReturn => {
	const { sessionRef, clientRef } = useMezon();

	const sendSignalingToParticipants = useCallback(
		(participants: string[], signalType: number, data: CallSignalingData | Record<string, any>, channelId: string, currentUserId: string) => {
			if (!participants?.length || !channelId || !currentUserId) {
				return;
			}

			participants.forEach((userId) => {
				if (userId !== currentUserId) {
					try {
						const client = clientRef.current;
						if (!client || !sessionRef.current) {
							console.error('Socket not available for signaling');
							return;
						}

						client.forwardWebrtcSignaling(sessionRef.current, userId, signalType, JSON.stringify(data), channelId, currentUserId);
						if (
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_CANCEL ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_TIMEOUT
						) {
							const isCancel = signalType !== WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER;
							markCallPushMobile({ receiverId: userId, currentUserId, data, isCancel });
						}
					} catch (error) {
						console.error('Failed to send signaling to participant:', userId, error);
					}
				}
			});
		},
		[clientRef.current, sessionRef.current]
	);

	const sendGroupCallOffer = useCallback(
		(participants: string[], callData: CallSignalingData, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER, callData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const sendGroupCallAnswer = useCallback(
		(participants: string[], callData: CallSignalingData, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_ANSWER, callData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const sendGroupCallCancel = useCallback(
		(participants: string[], callData: CallSignalingData, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_CANCEL, callData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const sendGroupCallQuit = useCallback(
		(participants: string[], callData: CallSignalingData, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT, callData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const sendParticipantJoined = useCallback(
		(participants: string[], joinedData: Record<string, any>, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_JOINED, joinedData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const sendParticipantLeft = useCallback(
		(participants: string[], leftData: Record<string, any>, channelId: string, userId: string) => {
			sendSignalingToParticipants(participants, WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_LEFT, leftData, channelId, userId);
		},
		[sendSignalingToParticipants]
	);

	const markCallPushMobile = useCallback(
		({
			receiverId,
			currentUserId,
			data,
			isCancel
		}: {
			receiverId: string;
			currentUserId: string;
			isCancel: boolean;
			data: CallSignalingData | Record<string, any>;
		}) => {
			const client = clientRef.current;
			if (!client || !sessionRef.current) {
				console.error('Socket not available for push notifications');
				return;
			}

			if (isCancel) {
				const bodyFCMMobile = { offer: 'CANCEL_CALL' };
				client.makeCallPush(sessionRef.current, receiverId, JSON.stringify(bodyFCMMobile), data.group_id, currentUserId);
				return;
			}

			const groupName = data?.group_name || 'Group Call';
			const offerGroupCall = {
				isGroupCall: true,
				groupId: data.group_id,
				groupName,
				groupAvatar: data.group_avatar || '',
				callerId: currentUserId
			};

			const bodyFCMMobile = {
				offer: JSON.stringify(offerGroupCall),
				callerName: `Group Call ${groupName}`,
				callerAvatar: '',
				callerId: currentUserId,
				channelId: data.group_id
			};

			client.makeCallPush(sessionRef.current, receiverId, JSON.stringify(bodyFCMMobile), data.group_id, currentUserId);
		},
		[clientRef, sessionRef]
	);

	return {
		sendGroupCallOffer,
		sendGroupCallAnswer,
		sendGroupCallCancel,
		sendGroupCallQuit,
		sendParticipantJoined,
		sendParticipantLeft
	};
};
