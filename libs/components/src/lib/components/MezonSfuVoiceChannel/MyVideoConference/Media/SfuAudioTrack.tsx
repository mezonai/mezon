import { setPreferredOutputDeviceId, sinkIdForHtmlMediaElement } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import { attachAudioPlayback, type AudioPlaybackFailure } from './audioPlayback';

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
	useEffect(() => {
		if (ref.current) {
			ref.current.muted = muted;
			ref.current.volume = Math.min(1, Math.max(0, volume));
		}
	}, [muted, volume]);
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
	return <audio ref={ref} playsInline muted={muted} />;
};
