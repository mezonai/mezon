import { setPreferredOutputDeviceId, sinkIdForHtmlMediaElement } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import { attachAudioPlayback, type AudioPlaybackFailure } from './audioPlayback';
import { acquireBoostContext, applyBoostSink, contextSinkSupported, releaseBoostContext, resolveAudioVolume } from './audioVolume';

export const SfuAudioTrack = ({
	track,
	muted,
	volume = 1,
	sinkId,
	onPlaybackFailure,
	onSinkIdFailure
}: {
	track: MediaStreamTrack;
	muted: boolean;
	volume?: number;
	sinkId?: string;
	onPlaybackFailure?: AudioPlaybackFailure;
	onSinkIdFailure?: (failedSinkId?: string) => void;
}) => {
	const ref = useRef<HTMLAudioElement>(null);
	const gainRef = useRef<GainNode | null>(null);
	const ctxRef = useRef<AudioContext | null>(null);
	const { elementVolume, boost } = resolveAudioVolume(volume, sinkId, contextSinkSupported());
	const boosting = boost !== null;
	const targetGain = muted ? 0 : (boost ?? 1);
	const targetGainRef = useRef(targetGain);
	targetGainRef.current = targetGain;

	useEffect(() => {
		if (ref.current) {
			ref.current.muted = muted || boosting;
			ref.current.volume = elementVolume;
		}
	}, [muted, boosting, elementVolume]);

	useEffect(() => {
		if (!boosting) return;
		const ctx = acquireBoostContext();
		if (!ctx) return;
		ctxRef.current = ctx;
		const source = ctx.createMediaStreamSource(new MediaStream([track]));
		const gain = ctx.createGain();
		gain.gain.value = targetGainRef.current;
		source.connect(gain);
		gain.connect(ctx.destination);
		gainRef.current = gain;
		return () => {
			source.disconnect();
			gain.disconnect();
			gainRef.current = null;
			ctxRef.current = null;
			releaseBoostContext();
		};
	}, [track, boosting]);

	useEffect(() => {
		if (gainRef.current) {
			gainRef.current.gain.value = muted ? 0 : (boost ?? 1);
		}
	}, [boost, muted]);

	useEffect(() => {
		if (boosting && ctxRef.current) {
			void applyBoostSink(ctxRef.current, sinkId);
		}
	}, [sinkId, boosting]);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let disposed = false;
		let cleanupPlayback: (() => void) | undefined;

		const applySinkId = async (targetSink: string) => {
			const targetSinkId = sinkIdForHtmlMediaElement(targetSink);
			const audioWithSink = el as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
			if (typeof audioWithSink.setSinkId !== 'function') return;
			try {
				await audioWithSink.setSinkId(targetSinkId);
			} catch (err: unknown) {
				// eslint-disable-next-line no-console
				console.warn('[MezonSFU] failed to setSinkId', err);
				if (targetSinkId !== '') {
					try {
						await audioWithSink.setSinkId('');
					} catch (fallbackErr: unknown) {
						// eslint-disable-next-line no-console
						console.warn('[MezonSFU] fallback to default sinkId failed', fallbackErr);
					}
					setPreferredOutputDeviceId('default');
					onSinkIdFailure?.(targetSink);
				}
			}
		};

		const setup = async () => {
			if (sinkId !== undefined) {
				await applySinkId(sinkId);
			}
			if (disposed) return;
			cleanupPlayback = attachAudioPlayback(el, track, onPlaybackFailure);
		};

		void setup();

		return () => {
			disposed = true;
			cleanupPlayback?.();
		};
	}, [sinkId, track, onPlaybackFailure, onSinkIdFailure]);
	return <audio ref={ref} playsInline muted={muted || boosting} />;
};
