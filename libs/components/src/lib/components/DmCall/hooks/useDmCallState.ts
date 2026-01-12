import {
	DMCallActions,
	audioCallActions,
	selectCurrentStartDmCall,
	selectGroupCallId,
	selectIsGroupCallActive,
	selectIsInCall,
	selectJoinedCall,
	selectSignalingDataByUserId,
	useAppDispatch
} from '@mezon/store';
import { WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

export interface DmCallStateHookReturn {
	isInCall: boolean;
	isGroupCallActive: boolean;
	isJoinedCall: boolean;
	isInAnyCall: boolean;

	isDmCallInfo: any;
	groupCallId: string;
	dataCall: any;
	signalingData: any;

	triggerCall: (isVideoCall?: boolean) => void;
	setGroupCallId: (id: string) => void;
	removeAllCallData: () => void;
	clearCallState: () => void;
}

interface DmCallStateHookParams {
	userId: string;
	dmCallingRef: React.RefObject<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }>;
}

export const useDmCallState = ({ userId, dmCallingRef }: DmCallStateHookParams): DmCallStateHookReturn => {
	const dispatch = useAppDispatch();

	const isInCall = useSelector(selectIsInCall);
	const isGroupCallActive = useSelector(selectIsGroupCallActive);
	const isJoinedCall = useSelector(selectJoinedCall);
	const isDmCallInfo = useSelector(selectCurrentStartDmCall);
	const groupCallId = useSelector(selectGroupCallId);

	const signalingData = useSelector((state) => selectSignalingDataByUserId(state, userId));

	const isInAnyCall = isInCall || isGroupCallActive;

	const dataCall = useMemo(() => {
		return signalingData?.[signalingData?.length - 1]?.signalingData;
	}, [signalingData]);

	const triggerCall = useCallback(
		(isVideoCall = false) => {
			dmCallingRef.current?.triggerCall(isDmCallInfo?.isVideo, true);
		},
		[dmCallingRef, isDmCallInfo?.isVideo]
	);

	const setGroupCallId = useCallback(
		(id: string) => {
			dispatch(audioCallActions.setGroupCallId(id));
		},
		[dispatch]
	);

	const removeAllCallData = useCallback(() => {
		dispatch(DMCallActions.removeAll());
	}, [dispatch]);

	const clearCallState = useCallback(() => {
		dispatch(audioCallActions.setIsDialTone(false));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsEndTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));

		dispatch(DMCallActions.removeAll());
		dispatch(audioCallActions.startDmCall(null));
		dispatch(audioCallActions.setGroupCallId(''));
		dispatch(audioCallActions.setUserCallId(''));
	}, [dispatch]);

	useEffect(() => {
		if (isDmCallInfo?.groupId) {
			dmCallingRef.current?.triggerCall(isDmCallInfo?.isVideo);
		}
	}, [isDmCallInfo?.groupId, isDmCallInfo?.isVideo, dmCallingRef]);

	useEffect(() => {
		if (dataCall?.channel_id) {
			dispatch(audioCallActions.setGroupCallId(dataCall?.channel_id));
		}
	}, [dataCall?.channel_id, dispatch]);

	useEffect(() => {
		if (!signalingData?.[signalingData?.length - 1] && !isInAnyCall) {
			dispatch(audioCallActions.setIsDialTone(false));
			return;
		}

		const lastSignaling = signalingData?.[signalingData?.length - 1]?.signalingData;
		if (!lastSignaling) return;

		switch (lastSignaling.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				if (!isInAnyCall && !isJoinedCall) {
					dispatch(audioCallActions.setIsRingTone(true));
					dispatch(audioCallActions.setIsBusyTone(false));
					dispatch(audioCallActions.setIsEndTone(false));
				} else {
					dispatch(audioCallActions.setIsDialTone(false));
				}
				break;

			case WebrtcSignalingType.WEBRTC_SDP_ANSWER:
				break;

			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				dispatch(audioCallActions.setIsRingTone(false));
				dispatch(audioCallActions.setIsDialTone(false));
				break;

			case WEBRTC_SIGNALING_TYPES.CANCEL_CALL:
				dispatch(DMCallActions.removeAll());
				dispatch(audioCallActions.setIsRingTone(false));
				dispatch(audioCallActions.setIsDialTone(false));
				break;

			default:
				break;
		}
	}, [dispatch, isInCall, isGroupCallActive, isJoinedCall, signalingData, dataCall, isInAnyCall]);

	useEffect(() => {
		return () => {
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsDialTone(false));
		};
	}, [dispatch]);

	return {
		isInCall,
		isGroupCallActive,
		isJoinedCall,
		isInAnyCall,

		isDmCallInfo,
		groupCallId,
		dataCall,
		signalingData,

		triggerCall,
		setGroupCallId,
		removeAllCallData,
		clearCallState
	};
};
