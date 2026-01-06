import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { selectNoiseSuppressionEnabled, selectNoiseSuppressionLevel, useAppSelector } from '@mezon/store';
import { NOISE_SUPPRESSION_NORMALIZATION_FACTOR } from '@mezon/utils';
import { DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';
import type { LocalParticipant, LocalTrackPublication, Participant, TrackPublication } from 'livekit-client';
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
	const normalizedLevel = level * NOISE_SUPPRESSION_NORMALIZATION_FACTOR;
	const enabled = options?.enabled === false ? false : noiseSuppressionEnabled;
	const sampleRate = 48000;
	const room = useRoomContext();
	const { localParticipant } = useLocalParticipant();
	const processorsRef = useRef<Map<string, ProcessorData>>(new Map());
	const levelRef = useRef<number>(normalizedLevel);

	useEffect(() => {
		levelRef.current = normalizedLevel;
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
			if (!track || track.kind !== 'audio' || !enabled) {
				return;
			}

			const trackSid = track.sid;
			if (!trackSid || processorsRef.current.has(trackSid)) {
				return;
			}

			try {
				const processor = new DeepFilterNoiseFilterProcessor({
					sampleRate: publication.track?.mediaStreamTrack?.getSettings().sampleRate ?? sampleRate,
					noiseReductionLevel: levelRef.current,
					enabled,
					assetConfig: {
						cdnUrl: 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3'
					}
				});
				await track.setProcessor(processor);
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
						processorsRef.current.delete(trackSid);
					} catch (error) {
						if (process.env.NODE_ENV === 'development') {
							console.error('Failed to cleanup processor on track unpublish:', error);
						}
					}
				}
			}
		};

		const handleTrackMuted = async (publication: TrackPublication, participant: Participant) => {
			if (participant.sid === localParticipant.sid && publication.source === Track.Source.Microphone) {
				for (const processorData of processorsRef.current.values()) {
					if (processorData.track.trackSid === publication.trackSid) {
						await processorData.processor.suspend();
					}
				}
			}
		};

		const handleTrackUnmuted = async (publication: TrackPublication, participant: Participant) => {
			if (participant.sid === localParticipant.sid && publication.source === Track.Source.Microphone) {
				for (const processorData of processorsRef.current.values()) {
					if (processorData.track.trackSid === publication.trackSid) {
						await processorData.processor.resume();
					}
				}
			}
		};

		room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
		room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
		room.on(RoomEvent.TrackMuted, handleTrackMuted);
		room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);

		const processorsMap = processorsRef.current;

		return () => {
			room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
			room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
			room.off(RoomEvent.TrackMuted, handleTrackMuted);
			room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);

			processorsMap.forEach((processorData) => {
				try {
					const track = processorData.track.track;
					if (track) {
						track.stopProcessor().catch(() => {});
					}
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
				processorData.processor.setSuppressionLevel(normalizedLevel);
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
					await track.setProcessor(processorData.processor);
				} else {
					await track.stopProcessor();
				}
			} catch (error) {
				console.error('Failed to toggle noise suppression:', error);
			}
		});
	}, [enabled]);
};
