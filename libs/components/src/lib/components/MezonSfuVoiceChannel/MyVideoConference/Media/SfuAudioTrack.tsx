import { useEffect, useRef } from 'react';
import { attachAudioPlayback, type AudioPlaybackFailure } from './audioPlayback';

export const SfuAudioTrack = ({
	track,
	muted,
	volume = 1,
	sinkId,
	onPlaybackFailure
}: {
	track: MediaStreamTrack;
	muted: boolean;
	volume?: number;
	sinkId?: string;
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
		const el = ref.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
		if (el && typeof el.setSinkId === 'function' && sinkId) {
			el.setSinkId(sinkId === 'default' ? '' : sinkId).catch((err: unknown) => {
				// eslint-disable-next-line no-console
				console.warn('[MezonSFU] failed to setSinkId', err);
			});
		}
	}, [sinkId, track]);
	useEffect(() => {
		if (ref.current) return attachAudioPlayback(ref.current, track, onPlaybackFailure);
	}, [track, onPlaybackFailure]);
	return <audio ref={ref} autoPlay playsInline muted={muted} />;
};
