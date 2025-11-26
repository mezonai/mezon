import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { selectNoiseSuppressionEnabled, selectNoiseSuppressionLevel, useAppSelector } from '@mezon/store';
import { DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';
import type { LocalParticipant, LocalTrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { useEffect, useRef } from 'react';

interface UseDeepFilterNet3Options {
	enabled?: boolean;
}

interface ProcessorData {
	processor: DeepFilterNoiseFilterProcessor;
	track: LocalTrackPublication;
}

export const useDeepFilterNet3 = (options?: UseDeepFilterNet3Options) => {
	const noiseSuppressionEnabled = useAppSelector(selectNoiseSuppressionEnabled);
	const level = useAppSelector(selectNoiseSuppressionLevel);

	const enabled = options?.enabled === false ? false : noiseSuppressionEnabled;
	const sampleRate = 48000;
	const room = useRoomContext();
	const { localParticipant } = useLocalParticipant();
	const processorsRef = useRef<Map<string, ProcessorData>>(new Map());
	const levelRef = useRef<number>(level);

	useEffect(() => {
		levelRef.current = level;
	}, [level]);

	const enabledRef = useRef<boolean>(enabled);
	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	useEffect(() => {
		if (!room || !localParticipant) {
			return;
		}

		const applyProcessorToAudioTrack = async (publication: LocalTrackPublication) => {
			if (publication.source !== Track.Source.Microphone) {
				return;
			}

			const track = publication.track;
			if (!track || track.kind !== 'audio') {
				return;
			}

			const trackSid = track.sid;
			if (!trackSid) {
				return;
			}

			if (!enabled) {
				const processorData = processorsRef.current.get(trackSid);
				if (processorData) {
					try {
						await track.stopProcessor().catch(() => {});
						processorData.processor.destroy?.().catch(() => {});
						processorsRef.current.delete(trackSid);
					} catch (error) {
						if (process.env.NODE_ENV === 'development') {
							console.error('Failed to remove DeepFilterNet3 processor:', error);
						}
					}
				}
				return;
			}

			if (processorsRef.current.has(trackSid)) {
				return;
			}

			try {
				const currentLevel = levelRef.current;
				const processor = new DeepFilterNoiseFilterProcessor({
					sampleRate,
					noiseReductionLevel: currentLevel,
					enabled: true,
					assetConfig: {
						cdnUrl: 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3'
					}
				});

				await processor.setEnabled(true);

				if (enabledRef.current) {
					await track.setProcessor(processor);
				} else {
					await processor.audioContext?.suspend();
				}

				processor.setSuppressionLevel(currentLevel);
				processorsRef.current.set(trackSid, { processor, track: publication });
			} catch (error) {
				console.error('Failed to apply DeepFilterNet3 processor:', error);
			}
		};

		const existingAudioTracks = Array.from(localParticipant.audioTrackPublications.values());
		for (const publication of existingAudioTracks) {
			if (publication.track && publication.source === Track.Source.Microphone) {
				void applyProcessorToAudioTrack(publication);
			}
		}

		const handleTrackPublished = (publication: LocalTrackPublication, participant: LocalParticipant) => {
			if (participant.sid === localParticipant.sid && publication.source === Track.Source.Microphone) {
				void applyProcessorToAudioTrack(publication);
			}
		};

		const handleTrackUnpublished = async (publication: LocalTrackPublication, participant: LocalParticipant) => {
			if (participant.sid === localParticipant.sid && publication.source === Track.Source.Microphone) {
				const trackSid = publication.trackSid;
				const processorData = processorsRef.current.get(trackSid);
				if (processorData) {
					try {
						const track = processorData.track.track;
						if (track) {
							await track.stopProcessor().catch(() => {});
						}
						processorData.processor.destroy?.().catch(() => {});
						processorsRef.current.delete(trackSid);
					} catch (error) {
						if (process.env.NODE_ENV === 'development') {
							console.error('Failed to cleanup processor on track unpublish:', error);
						}
					}
				}
			}
		};

		room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
		room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

		const processorsMap = processorsRef.current;

		return () => {
			room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
			room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

			processorsMap.forEach((processorData) => {
				try {
					const track = processorData.track.track;
					if (track) {
						track.stopProcessor().catch(() => {});
					}
					processorData.processor.destroy?.().catch(() => {});
				} catch (error) {
					console.error('Failed to cleanup processor on unmount:', error);
				}
			});
			processorsMap.clear();
		};
	}, [room, localParticipant, sampleRate, enabled]);

	useEffect(() => {
		if (!enabled || !room || !localParticipant) {
			return;
		}

		processorsRef.current.forEach((processorData) => {
			try {
				processorData.processor.setSuppressionLevel(level);
			} catch (error) {
				console.error('Failed to update suppression level:', error);
			}
		});
	}, [level, enabled, room, localParticipant]);

	useEffect(() => {
		processorsRef.current.forEach(async (processorData) => {
			try {
				const track = processorData.track.track;
				if (!track) return;

				if (enabled) {
					await processorData.processor.audioContext?.resume();
					await track.setProcessor(processorData.processor);
				} else {
					await track.stopProcessor();
					await processorData.processor.audioContext?.suspend();
				}
			} catch (error) {
				console.error('Failed to toggle noise suppression:', error);
			}
		});
	}, [enabled]);
};
