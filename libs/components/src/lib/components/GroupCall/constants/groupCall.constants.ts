import { AudioToneType, GroupCallEventType } from '../types/groupCall.types';

export const GROUP_CALL_EVENTS = {
	OFFER: GroupCallEventType.OFFER,
	ANSWER: GroupCallEventType.ANSWER,
	QUIT: GroupCallEventType.QUIT,
	ICE_CANDIDATE: GroupCallEventType.ICE_CANDIDATE,
	JOINED_OTHER_CALL: GroupCallEventType.JOINED_OTHER_CALL,
	STATUS_REMOTE_MEDIA: GroupCallEventType.STATUS_REMOTE_MEDIA,
	CANCEL: GroupCallEventType.CANCEL,
	TIMEOUT: GroupCallEventType.TIMEOUT,
	PARTICIPANT_JOINED: GroupCallEventType.PARTICIPANT_JOINED,
	PARTICIPANT_LEFT: GroupCallEventType.PARTICIPANT_LEFT
} as const;

export const AUDIO_TONES = {
	DIAL: AudioToneType.DIAL,
	RING: AudioToneType.RING,
	END: AudioToneType.END,
	BUSY: AudioToneType.BUSY
} as const;

export const AUDIO_FILES = {
	[AudioToneType.DIAL]: '/assets/audio/dialtone.mp3',
	[AudioToneType.RING]: '/assets/audio/ringing.mp3',
	[AudioToneType.END]: '/assets/audio/endcall.mp3',
	[AudioToneType.BUSY]: '/assets/audio/busytone.mp3'
} as const;

export const CALL_CONFIG = {
	DEFAULT_TIMEOUT: 60000,
	AUDIO_DELAY: 10,
	AUTO_JOIN_DELAY: 100,
	MAX_PARTICIPANTS: 50
} as const;

export const CALL_ACTIONS = {
	START: 'start',
	ANSWER: 'answer',
	DECLINE: 'decline',
	LEAVE: 'leave',
	CANCEL: 'cancel'
} as const;

export const SIGNALING_REASONS = {
	TIMEOUT: 'timeout',
	BUSY: 'busy',
	CANCELLED: 'cancelled',
	DECLINED: 'declined',
	LEFT: 'left'
} as const;
