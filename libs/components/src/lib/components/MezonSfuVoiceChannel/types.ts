export type SfuJoinRole = 'speaker' | 'audience';

export type SfuConnectionState = 'connecting' | 'joining' | 'awaiting offer' | 'connected' | 'disconnected' | 'failed';

export type SfuMediaKind = 'audio' | 'camera' | 'screen';

export type SfuPoolSlot = {
	slot: number;
	generation: number | string;
	mid: number | string;
};

export type SfuMediaSlots = Partial<Record<SfuMediaKind, SfuPoolSlot | null>>;

export type SfuPeer = {
	peer_id: number | string;
	user_id?: string;
	ufrag?: string;
	role?: SfuJoinRole;
	is_mute?: boolean;
	camera_requested?: boolean;
	camera_active?: boolean;
	screen_requested?: boolean;
	screen_active?: boolean;
	mid_audio?: number | string;
	mid_video?: number | string;
	mid_screen?: number | string;
	slot?: number;
	remote_slot?: number;
	assignment_generation?: number | string;
	metadata?: string;
	media_slots?: SfuMediaSlots;
};

export type SfuSignalMessage = {
	type: string;
	is_mute?: boolean;
	action?: 'mute' | 'kick';
	user_id?: string;
	peer_id?: number | string;
	self_peer_id?: number | string;
	affected?: number;
	error?: string;
	timestamp?: number;
	active?: boolean;
	role?: SfuJoinRole;
	sdp?: string;
	offer_generation?: number;
	message?: string;
	participant_count?: number;
	members?: SfuPeer[];
	peer?: SfuPeer;
	mid_audio?: number | string;
	mid_video?: number | string;
	mid_screen?: number | string;
	slot?: number;
	generation?: number | string;
	assignment_generation?: number | string;
	audio_active?: boolean;
	video_active?: boolean;
	screen_active?: boolean;
	kind?: SfuMediaKind;
	mid?: number | string;
	media_slots?: SfuMediaSlots;
	media_pool_mode?: string;
	max_audio_slots?: number;
	max_camera_slots?: number;
	max_screen_slots?: number;
};

export type SfuRemoteMedia = {
	id: string;
	peerId?: string;
	userId?: string;
	role?: SfuJoinRole;
	audio?: MediaStreamTrack;
	video?: MediaStreamTrack;
	screen?: MediaStreamTrack;
	screenActive?: boolean;
	cameraRequested?: boolean;
	cameraActive?: boolean;
	screenRequested?: boolean;
	isMute?: boolean;
	username?: string;
	avatar?: string;
};
