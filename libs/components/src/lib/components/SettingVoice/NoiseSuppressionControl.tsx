import { Icons } from '@mezon/ui';
import { getNoiseSuppressionAudioCaptureOptions } from '@mezon/utils';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface NoiseSuppressionControlRef {
	applyNoiseSuppression: (enabled: boolean) => Promise<void>;
	setupAudioNodes: (stream: MediaStream, audioContext: AudioContext, analyser: AnalyserNode, micVolume: number) => MediaStreamAudioDestinationNode;
	getDestinationStream: () => MediaStream | null;
	cleanupAudioNodes: () => void;
	cleanup: () => void;
}

interface NoiseSuppressionControlProps {
	className?: string;
	noiseSuppressionEnabled?: boolean;
	onNoiseSuppressionEnabledChange?: (enabled: boolean) => void;
	isTesting: boolean;
}

export const NoiseSuppressionControl = forwardRef<NoiseSuppressionControlRef, NoiseSuppressionControlProps>(
	({ className = '', noiseSuppressionEnabled = false, onNoiseSuppressionEnabledChange, isTesting }, ref) => {
		const { t } = useTranslation(['setting']);
		const inputStreamRef = useRef<MediaStream | null>(null);
		const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
		const gainNodeRef = useRef<GainNode | null>(null);
		const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

		const isSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getSupportedConstraints().noiseSuppression);

		const setupAudioNodes = useCallback((stream: MediaStream, audioContext: AudioContext, analyser: AnalyserNode, micVolume: number) => {
			const source = audioContext.createMediaStreamSource(stream);
			const gain = audioContext.createGain();
			gain.gain.value = micVolume;
			const dest = audioContext.createMediaStreamDestination();

			inputStreamRef.current = stream;
			sourceNodeRef.current = source;
			gainNodeRef.current = gain;
			destinationNodeRef.current = dest;

			source.connect(gain);
			gain.connect(analyser);
			gain.connect(dest);

			return dest;
		}, []);

		const getDestinationStream = useCallback(() => destinationNodeRef.current?.stream || null, []);

		const cleanupAudioNodes = useCallback(() => {
			try {
				sourceNodeRef.current?.disconnect();
				gainNodeRef.current?.disconnect();
				destinationNodeRef.current?.disconnect();
			} catch {
				// The graph may already have been disconnected during another cleanup path.
			}

			inputStreamRef.current = null;
			sourceNodeRef.current = null;
			gainNodeRef.current = null;
			destinationNodeRef.current = null;
		}, []);

		const applyNoiseSuppression = useCallback(
			async (enabled: boolean) => {
				onNoiseSuppressionEnabledChange?.(enabled);
				if (!isTesting || !isSupported) return;

				const audioTrack = inputStreamRef.current?.getAudioTracks()[0];
				if (audioTrack) {
					await audioTrack.applyConstraints(getNoiseSuppressionAudioCaptureOptions(enabled));
				}
			},
			[isSupported, isTesting, onNoiseSuppressionEnabledChange]
		);

		useImperativeHandle(
			ref,
			() => ({
				applyNoiseSuppression,
				setupAudioNodes,
				getDestinationStream,
				cleanupAudioNodes,
				cleanup: cleanupAudioNodes
			}),
			[applyNoiseSuppression, setupAudioNodes, getDestinationStream, cleanupAudioNodes]
		);

		const toggleNoiseSuppression = () => {
			if (!isSupported) return;
			void applyNoiseSuppression(!noiseSuppressionEnabled);
		};

		return (
			<div className={`space-y-4 ${className}`.trim()}>
				<div className="text-lg font-bold pt-4 text-theme-primary-active tracking-wide">{t('setting:voice.noiseSuppression.title')}</div>
				<button
					onClick={toggleNoiseSuppression}
					disabled={!isSupported}
					className={`w-10 h-10 rounded-md flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
						isSupported
							? noiseSuppressionEnabled
								? 'bg-item-theme-hover text-theme-primary-active'
								: 'bg-item-theme-hover text-red-500'
							: 'bg-item-theme-hover text-theme-primary-hover'
					}`}
					aria-label={t('setting:voice.noiseSuppression.toggleAriaLabel')}
				>
					<Icons.NoiseSupressionIcon className="w-5 h-5" disabled={!noiseSuppressionEnabled} />
				</button>
			</div>
		);
	}
);
