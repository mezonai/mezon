import { Icons } from '@mezon/ui';
import { NOISE_SUPPRESSION_NORMALIZATION_FACTOR } from '@mezon/utils';
import { DeepFilterNet3Processor, DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';
import type { ChangeEvent } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

export interface NoiseSuppressionControlRef {
	applyNoiseSuppression: (enabled: boolean) => Promise<void>;
	updateNoiseSuppressionLevel: (level: number) => void;
	setupAudioNodes: (stream: MediaStream, audioContext: AudioContext, analyser: AnalyserNode, micVolume: number) => MediaStreamAudioDestinationNode;
	getDestinationStream: () => MediaStream | null;
	cleanupAudioNodes: () => void;
	cleanup: () => void;
}

interface NoiseSuppressionControlProps {
	className?: string;
	noiseSuppressionEnabled?: boolean;
	noiseSuppressionLevel?: number;
	isTesting: boolean;
}

export const NoiseSuppressionControl = forwardRef<NoiseSuppressionControlRef, NoiseSuppressionControlProps>(
	(
		{
			className = '',
			noiseSuppressionEnabled: initialNoiseSuppressionEnabled = false,
			noiseSuppressionLevel: initialNoiseSuppressionLevel = 0,
			isTesting
		},
		ref
	) => {
		const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(initialNoiseSuppressionEnabled);
		const [noiseSuppressionLevel, setNoiseSuppressionLevel] = useState(initialNoiseSuppressionLevel);

		const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
		const gainNodeRef = useRef<GainNode | null>(null);
		const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
		const analyserRef = useRef<AnalyserNode | null>(null);
		const audioContextRef = useRef<AudioContext | null>(null);
		const noiseProcessorRef = useRef<DeepFilterNet3Processor | null>(null);
		const noiseWorkletNodeRef = useRef<AudioWorkletNode | null>(null);

		const normalizedNoiseSuppressionLevel = useMemo(
			() => noiseSuppressionLevel * NOISE_SUPPRESSION_NORMALIZATION_FACTOR,
			[noiseSuppressionLevel]
		);

		const isSupported = DeepFilterNoiseFilterProcessor.isSupported();
		const isEnabled = isSupported && noiseSuppressionEnabled;

		const setupAudioNodes = useCallback((stream: MediaStream, audioContext: AudioContext, analyser: AnalyserNode, micVolume: number) => {
			const source = audioContext.createMediaStreamSource(stream);
			const gain = audioContext.createGain();
			gain.gain.value = micVolume;
			const dest = audioContext.createMediaStreamDestination();

			sourceNodeRef.current = source;
			gainNodeRef.current = gain;
			destinationNodeRef.current = dest;
			analyserRef.current = analyser;
			audioContextRef.current = audioContext;

			source.connect(gain);
			gain.connect(analyser);
			gain.connect(dest);

			return dest;
		}, []);

		const getDestinationStream = useCallback(() => {
			return destinationNodeRef.current?.stream || null;
		}, []);

		const cleanupAudioNodes = useCallback(() => {
			sourceNodeRef.current = null;
			gainNodeRef.current = null;
			destinationNodeRef.current = null;
			analyserRef.current = null;
			audioContextRef.current = null;
		}, []);

		const cleanupNoiseSuppression = useCallback(() => {
			try {
				noiseWorkletNodeRef.current?.disconnect();
			} catch {
				// ignore
			}
			noiseWorkletNodeRef.current = null;

			if (noiseProcessorRef.current) {
				noiseProcessorRef.current.destroy();
				noiseProcessorRef.current = null;
			}
		}, []);

		const ensureNoiseSuppressionNode = useCallback(async () => {
			if (!isSupported) return false;
			const ctx = audioContextRef.current;
			if (!ctx) return false;

			if (!noiseProcessorRef.current) {
				const processor = new DeepFilterNet3Processor({
					sampleRate: ctx.sampleRate,
					noiseReductionLevel: 0,
					assetConfig: {
						cdnUrl: 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3'
					}
				});
				await processor.initialize();
				const node = await processor.createAudioWorkletNode(ctx);
				noiseProcessorRef.current = processor;
				noiseWorkletNodeRef.current = node;
			}

			noiseProcessorRef.current.setSuppressionLevel(normalizedNoiseSuppressionLevel);
			noiseProcessorRef.current.setNoiseSuppressionEnabled(true);
			return true;
		}, [isSupported, normalizedNoiseSuppressionLevel, audioContextRef]);

		const wireOutput = useCallback(
			(useNoiseSuppression: boolean) => {
				const gain = gainNodeRef.current;
				const dest = destinationNodeRef.current;
				if (!gain || !dest) return;

				try {
					gain.disconnect();
				} catch {
					// ignore
				}

				if (analyserRef.current) {
					gain.connect(analyserRef.current);
				}

				if (noiseWorkletNodeRef.current) {
					try {
						noiseWorkletNodeRef.current.disconnect();
					} catch {
						// ignore
					}
				}

				if (useNoiseSuppression && noiseWorkletNodeRef.current) {
					gain.connect(noiseWorkletNodeRef.current);
					noiseWorkletNodeRef.current.connect(dest);
				} else {
					gain.connect(dest);
				}
			},
			[gainNodeRef, destinationNodeRef, analyserRef]
		);

		const applyNoiseSuppressionInternal = useCallback(
			async (enabled: boolean) => {
				setNoiseSuppressionEnabled(enabled);
				if (!isTesting) return;

				if (!enabled) {
					if (noiseProcessorRef.current) {
						noiseProcessorRef.current.setNoiseSuppressionEnabled(false);
					}
					wireOutput(false);
					return;
				}

				try {
					const ok = await ensureNoiseSuppressionNode();
					if (ok) {
						wireOutput(true);
					}
				} catch (error) {
					console.error('Failed to apply noise suppression for mic test:', error);
					wireOutput(false);
				}
			},
			[isTesting, wireOutput, ensureNoiseSuppressionNode]
		);

		const updateNoiseSuppressionLevelInternal = useCallback(
			(level: number) => {
				setNoiseSuppressionLevel(level);
				if (!isTesting) return;
				if (!noiseProcessorRef.current) return;
				const normalizedLevel = level * NOISE_SUPPRESSION_NORMALIZATION_FACTOR;
				noiseProcessorRef.current.setSuppressionLevel(normalizedLevel);
			},
			[isTesting]
		);

		useImperativeHandle(
			ref,
			() => ({
				applyNoiseSuppression: applyNoiseSuppressionInternal,
				updateNoiseSuppressionLevel: updateNoiseSuppressionLevelInternal,
				setupAudioNodes,
				getDestinationStream,
				cleanupAudioNodes,
				cleanup: cleanupNoiseSuppression
			}),
			[
				applyNoiseSuppressionInternal,
				updateNoiseSuppressionLevelInternal,
				setupAudioNodes,
				getDestinationStream,
				cleanupAudioNodes,
				cleanupNoiseSuppression
			]
		);

		const toggleNoiseSuppression = () => {
			if (!isSupported) return;
			const newEnabled = !noiseSuppressionEnabled;
			applyNoiseSuppressionInternal(newEnabled);
		};

		const handleNoiseSuppressionLevelChange = (e: ChangeEvent<HTMLInputElement>) => {
			if (!isSupported) return;
			const level = Number(e.target.value);
			updateNoiseSuppressionLevelInternal(level);
		};
		return (
			<div className={`space-y-4 ${className}`.trim()}>
				<div className="text-lg font-bold pt-4 text-theme-primary-active tracking-wide">Noise Suppression</div>
				<div className="flex items-center gap-3">
					<button
						onClick={toggleNoiseSuppression}
						disabled={!isSupported}
						className={`w-10 h-10 rounded-md flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
							isSupported
								? isEnabled
									? 'bg-item-theme-hover text-theme-primary-active'
									: 'bg-item-theme-hover text-red-500'
								: 'bg-item-theme-hover text-theme-primary-hover'
						}`}
						aria-label="Toggle noise suppression"
					>
						<Icons.NoiseSupressionIcon className="w-5 h-5">
							{!isEnabled && <path d="M3 21 L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
						</Icons.NoiseSupressionIcon>
					</button>
					<input
						type="range"
						min={0}
						max={100}
						value={noiseSuppressionLevel}
						onChange={handleNoiseSuppressionLevelChange}
						disabled={!isSupported || !noiseSuppressionEnabled}
						className="w-full h-1 disabled:opacity-50"
					/>
					<div className="w-10 text-right text-xs text-theme-primary-hover">{noiseSuppressionLevel}%</div>
				</div>
			</div>
		);
	}
);
