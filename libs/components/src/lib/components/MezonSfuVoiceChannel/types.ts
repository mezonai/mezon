export type SfuJoinRole = 'speaker' | 'audience';

export type SfuConnectionState = 'connecting' | 'joining' | 'awaiting offer' | 'connected' | 'disconnected' | 'failed';

export type SfuPeer = {
	metadata?: string;
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
};

export type SfuSignalMessage = {
	metadata?: string;
	type: string;
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
};

export type SfuRemoteMedia = {
	metadata?: string;
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
};
