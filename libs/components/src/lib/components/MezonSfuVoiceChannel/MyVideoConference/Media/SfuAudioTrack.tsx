import { useEffect, useRef } from 'react';
import { attachAudioPlayback } from './audioPlayback';

export const SfuAudioTrack = ({ track, muted, volume = 1 }: { track: MediaStreamTrack; muted: boolean; volume?: number }) => {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		if (ref.current) {
			ref.current.muted = muted;
			ref.current.volume = Math.min(1, Math.max(0, volume));
		}
	}, [muted, volume]);
	useEffect(() => {
		if (ref.current) return attachAudioPlayback(ref.current, track);
	}, [track]);
	return <audio ref={ref} autoPlay playsInline muted={muted} />;
};
