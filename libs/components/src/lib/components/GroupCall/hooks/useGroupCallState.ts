import {
	groupCallActions,
	selectCurrentGroupId,
	selectIsAnsweringCall,
	selectIsGroupCallActive,
	selectIsGroupCallLoading,
	selectIsShowIncomingGroupCall,
	selectIsShowPreCallInterface,
	selectIsVideoGroupCall,
	selectShouldAutoJoinRoom,
	selectStoredCallData,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

export interface GroupCallData {
	groupId: string;
	groupName: string;
	groupAvatar?: string;
	meetingCode?: string;
	clanId?: string;
	participants: string[];
	callerInfo: {
		id: string;
		name: string;
		avatar?: string;
	};
}

export interface GroupCallStateHookReturn {
	// State
	isGroupCallActive: boolean;
	isShowPreCallInterface: boolean;
	isShowIncomingGroupCall: boolean;
	isLoading: boolean;
	isVideoCall: boolean;
	shouldAutoJoinRoom: boolean;
	isAnsweringCall: boolean;
	currentGroupId: string | null;
	storedCallData: GroupCallData | null;

	// Actions
	showPreCallInterface: (groupId: string, isVideo: boolean) => void;
	hidePreCallInterface: () => void;
	showIncomingGroupCall: (groupId: string, callData: any, isVideo: boolean) => void;
	hideIncomingGroupCall: () => void;
	startGroupCall: () => void;
	endGroupCall: () => void;
	setLoading: (loading: boolean) => void;
	setIncomingCallData: (callData: GroupCallData) => void;
	autoJoinRoom: (shouldJoin: boolean, isAnswering?: boolean) => void;
	clearStoredCallData: () => void;
}

export const useGroupCallState = (): GroupCallStateHookReturn => {
	const dispatch = useAppDispatch();

	// Selectors
	const isGroupCallActive = useSelector(selectIsGroupCallActive);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);
	const isShowIncomingGroupCall = useSelector(selectIsShowIncomingGroupCall);
	const isLoading = useSelector(selectIsGroupCallLoading);
	const isVideoCall = useSelector(selectIsVideoGroupCall);
	const shouldAutoJoinRoom = useSelector(selectShouldAutoJoinRoom);
	const isAnsweringCall = useSelector(selectIsAnsweringCall);
	const currentGroupId = useSelector(selectCurrentGroupId);
	const storedCallData = useSelector(selectStoredCallData);

	// Actions
	const showPreCallInterface = useCallback(
		(groupId: string, isVideo: boolean) => {
			dispatch(
				groupCallActions.showPreCallInterface({
					groupId,
					isVideo
				})
			);
		},
		[dispatch]
	);

	const hidePreCallInterface = useCallback(() => {
		dispatch(groupCallActions.hidePreCallInterface());
	}, [dispatch]);

	const showIncomingGroupCall = useCallback(
		(groupId: string, callData: any, isVideo: boolean) => {
			dispatch(groupCallActions.showIncomingGroupCall({ groupId, callData, isVideo }));
		},
		[dispatch]
	);

	const hideIncomingGroupCall = useCallback(() => {
		dispatch(groupCallActions.hideIncomingGroupCall());
	}, [dispatch]);

	const startGroupCall = useCallback(() => {
		dispatch(groupCallActions.startGroupCall());
	}, [dispatch]);

	const endGroupCall = useCallback(() => {
		dispatch(groupCallActions.endGroupCall());
		dispatch(voiceActions.resetVoiceSettings());
	}, [dispatch]);

	const setLoading = useCallback(
		(loading: boolean) => {
			dispatch(groupCallActions.setLoading(loading));
		},
		[dispatch]
	);

	const setIncomingCallData = useCallback(
		(callData: GroupCallData) => {
			dispatch(groupCallActions.setIncomingCallData(callData));
		},
		[dispatch]
	);

	const autoJoinRoom = useCallback(
		(shouldJoin: boolean, isAnswering = false) => {
			dispatch(groupCallActions.autoJoinRoom({ shouldJoin, isAnswering }));
		},
		[dispatch]
	);

	const clearStoredCallData = useCallback(() => {
		dispatch(groupCallActions.clearStoredCallData());
	}, [dispatch]);

	return {
		// State
		isGroupCallActive,
		isShowPreCallInterface,
		isShowIncomingGroupCall,
		isLoading,
		isVideoCall,
		shouldAutoJoinRoom,
		isAnsweringCall,
		currentGroupId,
		storedCallData,

		// Actions
		showPreCallInterface,
		hidePreCallInterface,
		showIncomingGroupCall,
		hideIncomingGroupCall,
		startGroupCall,
		endGroupCall,
		setLoading,
		setIncomingCallData,
		autoJoinRoom,
		clearStoredCallData
	};
};
