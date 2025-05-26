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
	const mezon = useMezon();

	const sendSignalingToParticipants = useCallback(
		(participants: string[], signalType: number, data: CallSignalingData | Record<string, any>, channelId: string, currentUserId: string) => {
			if (!participants?.length || !channelId || !currentUserId) {
				return;
			}

			participants.forEach((userId) => {
				if (userId !== currentUserId) {
					try {
						const socket = mezon.socketRef.current;
						if (!socket) {
							console.error('Socket not available for signaling');
							return;
						}

						socket.forwardWebrtcSignaling(userId, signalType, JSON.stringify(data), channelId, currentUserId);
					} catch (error) {
						console.error('Failed to send signaling to participant:', userId, error);
					}
				}
			});
		},
		[mezon]
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

	return {
		sendGroupCallOffer,
		sendGroupCallAnswer,
		sendGroupCallCancel,
		sendGroupCallQuit,
		sendParticipantJoined,
		sendParticipantLeft
	};
};
