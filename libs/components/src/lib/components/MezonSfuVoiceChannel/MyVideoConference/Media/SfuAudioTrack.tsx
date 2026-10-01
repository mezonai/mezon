import { useEffect, useRef } from 'react';
import { attachAudioPlayback, type AudioPlaybackFailure } from './audioPlayback';

export const SfuAudioTrack = ({
	track,
	muted,
	volume = 1,
	onPlaybackFailure
}: {
	track: MediaStreamTrack;
	muted: boolean;
	volume?: number;
	onPlaybackFailure?: AudioPlaybackFailure;
}) => {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		if (ref.current) {
			ref.current.muted = muted;
			ref.current.volume = Math.min(1, Math.max(0, volume));
		}
	}, [muted, volume]);
	useEffect(() => {
		if (ref.current) return attachAudioPlayback(ref.current, track, onPlaybackFailure);
	}, [track, onPlaybackFailure]);
	return <audio ref={ref} autoPlay playsInline muted={muted} />;
};
