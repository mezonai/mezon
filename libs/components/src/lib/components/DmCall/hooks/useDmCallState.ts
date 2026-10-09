import type { RootState } from '@mezon/store';
import {
	DMCallActions,
	audioCallActions,
	selectAudioRingTone,
	selectCurrentStartDmCall,
	selectGroupCallId,
	selectIsInCall,
	selectJoinedCall,
	selectSignalingDataByUserId,
	useAppDispatch
} from '@mezon/store';
import { WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector, useStore } from 'react-redux';

export interface DmCallStateHookReturn {
	isInCall: boolean;
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
	const store = useStore<RootState>();
	const incomingRing = useRef<{ key: string; deadline: number; answered: boolean } | null>(null);

	const isInCall = useSelector(selectIsInCall);
	const isJoinedCall = useSelector(selectJoinedCall);
	const isRingTone = useSelector(selectAudioRingTone);
	const isDmCallInfo = useSelector(selectCurrentStartDmCall);
	const groupCallId = useSelector(selectGroupCallId);

	const signalingData = useSelector((state) => selectSignalingDataByUserId(state, userId));

	const isInAnyCall = isInCall;

	const dataCall = useMemo(() => {
		return signalingData?.[signalingData?.length - 1]?.signalingData;
	}, [signalingData]);

	const triggerCall = useCallback(
		(isVideoCall = false) => {
			if (incomingRing.current) incomingRing.current.answered = true;
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
	}, [dispatch, isInCall, isJoinedCall, signalingData, dataCall, isInAnyCall]);

	useEffect(() => {
		if (dataCall?.data_type !== WebrtcSignalingType.WEBRTC_SDP_OFFER || isInAnyCall || isJoinedCall) {
			incomingRing.current = null;
			return;
		}
		if (!isRingTone) return;
		const key = JSON.stringify([dataCall.caller_id, dataCall.channel_id, dataCall.json_data]);
		if (incomingRing.current?.key !== key) {
			incomingRing.current = { key, deadline: performance.now() + 30_000, answered: false };
		}
		if (incomingRing.current.answered) return;
		const deadline = incomingRing.current.deadline;
		const expire = () => {
			if (performance.now() < deadline || incomingRing.current?.key !== key || incomingRing.current.answered) return;
			const state = store.getState();
			const pending = selectSignalingDataByUserId(state, userId);
			if (
				selectIsInCall(state) ||
				selectJoinedCall(state) ||
				!selectAudioRingTone(state) ||
				pending?.[pending.length - 1]?.signalingData !== dataCall
			)
				return;
			clearCallState();
		};
		const timer = setTimeout(expire, Math.max(0, deadline - performance.now()));
		if (typeof document !== 'undefined') document.addEventListener('visibilitychange', expire);
		if (typeof window !== 'undefined') window.addEventListener('focus', expire);
		return () => {
			clearTimeout(timer);
			if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', expire);
			if (typeof window !== 'undefined') window.removeEventListener('focus', expire);
		};
	}, [dataCall, isInAnyCall, isJoinedCall, isRingTone, clearCallState, store, userId]);

	useEffect(() => {
		return () => {
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsDialTone(false));
		};
	}, [dispatch]);

	return {
		isInCall,
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
