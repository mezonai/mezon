export type ScreenShareMode = 'text' | 'video';

export const SCREEN_SHARE_PROFILES = {
	text: { frameRate: 5, contentHint: 'detail', degradationPreference: 'maintain-resolution' },
	video: { frameRate: 30, contentHint: 'motion', degradationPreference: 'maintain-framerate' }
} as const;

export const getScreenShareConstraints = (mode: ScreenShareMode): MediaTrackConstraints => ({
	width: { ideal: 1920 },
	height: { ideal: 1080 },
	frameRate: { ideal: SCREEN_SHARE_PROFILES[mode].frameRate, max: SCREEN_SHARE_PROFILES[mode].frameRate }
});

export const applyScreenShareEncoding = async (sender: RTCRtpSender, mode: ScreenShareMode) => {
	const parameters = sender.getParameters();
	if (!parameters.encodings?.length) parameters.encodings = [{}];
	parameters.degradationPreference = SCREEN_SHARE_PROFILES[mode].degradationPreference;
	const encoding = parameters.encodings[0] as RTCRtpEncodingParameters & { scalabilityMode?: string };
	encoding.scalabilityMode = 'L1T1';
	encoding.maxFramerate = SCREEN_SHARE_PROFILES[mode].frameRate;
	encoding.maxBitrate = 3_500_000;
	encoding.scaleResolutionDownBy = 1;
	encoding.priority = 'high';
	encoding.networkPriority = 'high';
	await sender.setParameters(parameters);
};

// Change the existing track in place: switching quality must not restart capture or the room.
export const updateScreenShareQuality = async (track: MediaStreamTrack, sender: RTCRtpSender, mode: ScreenShareMode) => {
	const previousConstraints = track.getConstraints();
	const previousHint = track.contentHint;
	await track.applyConstraints(getScreenShareConstraints(mode));
	try {
		track.contentHint = SCREEN_SHARE_PROFILES[mode].contentHint;
		await applyScreenShareEncoding(sender, mode);
	} catch (error) {
		track.contentHint = previousHint;
		if (track.readyState === 'live') await track.applyConstraints(previousConstraints);
		throw error;
	}
};
