export type SfuJoinRole = 'speaker' | 'audience';

export type SfuConnectionState = 'connecting' | 'joining' | 'awaiting offer' | 'connected' | 'disconnected' | 'failed';

export type SfuPeer = {
	peer_id: number | string;
	user_id?: string;
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
	type: string;
	timestamp?: number;
	active?: boolean;
	role?: SfuJoinRole;
	sdp?: string;
	message?: string;
	participant_count?: number;
	members?: SfuPeer[];
	peer?: SfuPeer;
	mid_audio?: number | string;
	mid_video?: number | string;
	mid_screen?: number | string;
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
};
