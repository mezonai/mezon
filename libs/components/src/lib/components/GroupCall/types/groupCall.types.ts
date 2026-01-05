import { WebrtcSignalingFwd } from 'mezon-js';

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

export interface CallParticipant {
	id: string;
	name: string;
	avatar?: string;
	isVideo?: boolean;
	isMuted?: boolean;
}

export interface GroupCallConfig {
	isVideo: boolean;
	autoJoin?: boolean;
	isAnswering?: boolean;
}

export interface AudioSettings {
	isDialTone: boolean;
	isRingTone: boolean;
	isEndTone: boolean;
	isBusyTone: boolean;
}

export interface CallSignalingData {
	is_video: boolean;
	groupId: string;
	group_name: string;
	group_avatar?: string;
	caller_id: string;
	caller_name: string;
	caller_avatar?: string;
	meeting_code?: string;
	clanId?: string;
	timestamp: number;
	participants: string[];
	action?: 'decline' | 'leave' | 'cancel';
	reason?: string;
}

export interface GroupCallHookParams {
	directId: string;
	currentDmGroup: any;
	userProfile: any;
	onSendMessage: (content: any) => void;
}

export interface GroupCallAudioHookReturn {
	playDialTone: () => void;
	playRingTone: () => void;
	playEndTone: () => void;
	playBusyTone: () => void;
	stopAllAudio: () => void;
}

export interface GroupCallHookReturn {
	// State
	isGroupCallActive: boolean;
	isShowPreCallInterface: boolean;
	isShowIncomingGroupCall: boolean;
	isLoading: boolean;
	participants: string[];

	// Actions
	startCall: (config: GroupCallConfig) => void;
	joinCall: (config: GroupCallConfig) => void;
	leaveCall: () => void;
	cancelCall: () => void;
	answerCall: (callData: WebrtcSignalingFwd) => void;
	declineCall: (callData: WebrtcSignalingFwd) => void;
}

export enum GroupCallEventType {
	OFFER = 9,
	ANSWER = 10,
	QUIT = 11,
	ICE_CANDIDATE = 12,
	JOINED_OTHER_CALL = 13,
	STATUS_REMOTE_MEDIA = 14,
	CANCEL = 15,
	TIMEOUT = 16,
	PARTICIPANT_JOINED = 17,
	PARTICIPANT_LEFT = 18
}

export enum AudioToneType {
	DIAL = 'dial',
	RING = 'ring',
	END = 'end',
	BUSY = 'busy'
}

export interface PreCallInterfaceProps {
	onJoinCall: (isVideoCall: boolean) => void;
	onCancel: () => void;
	loading: boolean;
	directId: string;
	config: GroupCallConfig;
}

export interface GroupPopupNotiCallProps {
	dataCall: WebrtcSignalingFwd;
	userId: string;
	triggerCall: () => void;
	onAnswer: (callData: WebrtcSignalingFwd) => void;
	onDecline: (callData: WebrtcSignalingFwd) => void;
}
