import { selectScreenSource, selectShowScreen, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store';
import type { LocalTrackPublication, Room } from 'livekit-client';
import { AudioPresets, Track } from 'livekit-client';
import { useCallback, useEffect, useRef } from 'react';

type PublishedScreenTracks = {
	video?: LocalTrackPublication;
	audio?: LocalTrackPublication;
	stream?: MediaStream | null;
} | null;

export const useScreenSharePublisher = (room?: Room | null) => {
	const dispatch = useAppDispatch();
	const screenSource = useAppSelector(selectScreenSource);
	const isScreenShareEnabled = useAppSelector(selectShowScreen);
	const publishedScreenTracksRef = useRef<PublishedScreenTracks>(null);
	const stopScreenShare = useCallback(() => {
		if (!room?.localParticipant) return;

		const published = publishedScreenTracksRef.current;
		if (!published) return;

		const { video, audio, stream } = published;

		if (video?.track) {
			room.localParticipant.unpublishTrack(video.track);
			video.track?.stop();
		}

		if (audio?.track) {
			room.localParticipant.unpublishTrack(audio.track);
			audio.track?.stop();
		}

		stream?.getTracks().forEach((track) => track?.stop());
		publishedScreenTracksRef.current = null;
	}, [room]);

	useEffect(() => {
		if (!room) return;

		if (!isScreenShareEnabled || !screenSource || screenSource.mode !== 'electron') {
			if (publishedScreenTracksRef.current) {
				stopScreenShare();
			}
			return;
		}

		const publishScreenShare = async () => {
			try {
				const constraints = {
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: screenSource.id,
							maxWidth: 2560,
							maxHeight: 1440,
							maxFrameRate: 30
						}
					},
					audio: screenSource.audio
						? {
								mandatory: {
									chromeMediaSource: 'desktop',
									chromeMediaSourceId: screenSource.id
								}
							}
						: undefined
				};

				const stream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);

				const [videoTrack] = stream.getVideoTracks();
				if (!videoTrack) {
					throw new Error('Selected stream has no video track');
				}
				videoTrack.contentHint = 'text';

				stopScreenShare();

				const videoPublication = await room.localParticipant.publishTrack(videoTrack, {
					name: 'screen-share',
					source: Track.Source.ScreenShare,
					simulcast: false,
					videoCodec: 'vp8',
					degradationPreference: 'maintain-resolution'
					//screenShareSimulcastLayers: [ScreenSharePresets.h360fps3, ScreenSharePresets.h720fps15]
				});

				let audioPublication: LocalTrackPublication | undefined;
				const [audioTrack] = stream.getAudioTracks();
				if (audioTrack) {
					audioPublication = await room.localParticipant.publishTrack(audioTrack, {
						source: Track.Source.ScreenShareAudio,
						audioPreset: AudioPresets.speech,
						dtx: false
					});
				}

				publishedScreenTracksRef.current = {
					video: videoPublication,
					audio: audioPublication,
					stream
				};
			} catch (error) {
				console.error('Failed to publish screen share:', error);
				publishedScreenTracksRef.current?.stream?.getTracks().forEach((track) => track?.stop());
				dispatch(voiceActions.setShowScreen(false));
			}
		};

		publishScreenShare();
	}, [dispatch, isScreenShareEnabled, room, screenSource, stopScreenShare]);

	useEffect(() => {
		return () => {
			stopScreenShare();
		};
	}, [stopScreenShare]);
};
