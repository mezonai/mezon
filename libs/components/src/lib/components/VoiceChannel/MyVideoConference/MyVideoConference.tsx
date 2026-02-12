import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { ConnectionStateToast, RoomAudioRenderer, useCreateLayoutContext, usePinnedTracks, useRoomContext } from '@livekit/components-react';
import { getStore, selectCurrentUserId, useAppDispatch, voiceActions } from '@mezon/store';
import { useStateRef } from '@mezon/utils';
import type {
	LocalParticipant,
	LocalTrackPublication,
	Participant,
	RemoteParticipant,
	RemoteTrackPublication,
	TrackPublication
} from 'livekit-client';
import { DisconnectReason, Track } from 'livekit-client';
import { memo, useEffect, useMemo, useRef } from 'react';
import { ReactionCallHandler } from './Reaction';
import { VideoConferenceLayout } from './VideoConferenceLayout';
import { VoiceContextMenu } from './VoiceContextMenu/VoiceContextMenu';
import { useScreenSharePublisher } from './hooks/useScreenSharePublisher';
import { VoiceTrackState } from './hooks/useVoiceTrackState';
import { useDeepFilterNet3 } from './useDeepFilterNet3';

const DeepFilterNetInitializer = memo(() => {
	useDeepFilterNet3({ enabled: true });
	return null;
});

interface PictureInPictureCleanupProps {
	layoutContext: ReturnType<typeof useCreateLayoutContext>;
}

const PictureInPictureCleanup = memo(({ layoutContext }: PictureInPictureCleanupProps) => {
	const focusTrack = usePinnedTracks(layoutContext)?.[0];

	useEffect(() => {
		if (!focusTrack && document.pictureInPictureElement) {
			document.exitPictureInPicture();
		}
	}, [focusTrack]);

	return null;
});

interface RoomEventManagerProps {
	room: ReturnType<typeof useRoomContext>;
	layoutContext: ReturnType<typeof useCreateLayoutContext>;
	onJoinRoom?: () => void;
	onLeaveRoom: (self?: boolean) => void | Promise<void>;
	token?: string;
	url?: string;
}

const RoomEventManager = memo(({ room, layoutContext, onJoinRoom, onLeaveRoom, token, url }: RoomEventManagerProps) => {
	const dispatch = useAppDispatch();
	const focusTrack = usePinnedTracks(layoutContext)?.[0];

	const isHandlingDisconnectRef = useRef(false);
	const focusTrackRef = useStateRef(focusTrack);

	useEffect(() => {
		const handleDisconnected = async (reason?: DisconnectReason) => {
			if (isHandlingDisconnectRef.current) return;
			isHandlingDisconnectRef.current = true;
			try {
				if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
					dispatch(voiceActions.resetVoiceControl());
					return;
				}
				if (
					reason === DisconnectReason.SERVER_SHUTDOWN ||
					reason === DisconnectReason.PARTICIPANT_REMOVED ||
					reason === DisconnectReason.SIGNAL_CLOSE ||
					reason === DisconnectReason.JOIN_FAILURE ||
					reason === DisconnectReason.CLIENT_INITIATED
				) {
					await onLeaveRoom();
				} else if (token) {
					if (!url) return;
					const maxAttempts = 3;

					for (let attempt = 1; attempt <= maxAttempts; attempt++) {
						try {
							await room?.connect(url, token);
							return;
						} catch (error) {
							if (attempt === maxAttempts) {
								await onLeaveRoom();
							} else {
								await new Promise((resolve) => setTimeout(resolve, 2000));
							}
						}
					}
				} else {
					await onLeaveRoom();
				}
			} catch (error) {
				console.error('Error handling room disconnect:', error);
			} finally {
				isHandlingDisconnectRef.current = false;
			}
		};

		const handleLocalTrackPublished = (publication: LocalTrackPublication, _participant: LocalParticipant) => {
			if (publication.source === Track.Source.Microphone) {
				dispatch(voiceActions.setShowMicrophone(true));
			}
			if (publication.source === Track.Source.Camera) {
				dispatch(voiceActions.setShowCamera(true));
			}
			if (publication.source === Track.Source.ScreenShare) {
				dispatch(voiceActions.setShowScreen(true));
			}
		};

		const handleLocalTrackUnpublished = async (publication: LocalTrackPublication, participant: LocalParticipant) => {
			if (publication.source === Track.Source.ScreenShare) {
				dispatch(voiceActions.setShowScreen(false));
			}
			if (publication.source === Track.Source.Camera) {
				dispatch(voiceActions.setShowCamera(false));
			}
			if (publication.source === Track.Source.Microphone) {
				dispatch(voiceActions.setShowMicrophone(false));
			}
			const currentFocusTrack = focusTrackRef.current;
			if (currentFocusTrack && currentFocusTrack?.participant.sid === participant.sid) {
				layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
				if (document.pictureInPictureElement) {
					await document.exitPictureInPicture();
				}
			}
		};
		const handleReconnectedRoom = () => {
			onJoinRoom?.();
		};

		const handleUserDisconnect = (participant: RemoteParticipant) => {
			const currentFocusTrack = focusTrackRef.current;
			if (currentFocusTrack && currentFocusTrack?.participant.sid === participant.sid) {
				layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
			}
			dispatch(voiceActions.closeVoiceContextMenu());
		};
		const handleTrackUnpublish = async (publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
			const currentFocusTrack = focusTrackRef.current;
			if (currentFocusTrack?.publication?.trackSid === publication?.trackSid && document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			}
		};

		const handleTrackMuted = async (publication: TrackPublication, participant: Participant) => {
			const store = getStore();
			const userId = selectCurrentUserId(store.getState());
			if (participant.identity === userId && publication.kind === Track.Kind.Audio) {
				dispatch(voiceActions.setShowMicrophone(false));
			}
		};
		room?.on('disconnected', handleDisconnected);
		room?.on('localTrackPublished', handleLocalTrackPublished);
		room?.on('localTrackUnpublished', handleLocalTrackUnpublished);
		room?.on('reconnected', handleReconnectedRoom);
		room?.on('participantDisconnected', handleUserDisconnect);
		room?.on('trackUnpublished', handleTrackUnpublish);
		room?.on('trackMuted', handleTrackMuted);

		return () => {
			room?.off('disconnected', handleDisconnected);
			room?.off('localTrackPublished', handleLocalTrackPublished);
			room?.off('localTrackUnpublished', handleLocalTrackUnpublished);
			room?.off('reconnected', handleReconnectedRoom);
			room?.off('participantDisconnected', handleUserDisconnect);
			room?.off('trackUnpublished', handleTrackUnpublish);
			room?.off('trackMuted', handleTrackMuted);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [room, onLeaveRoom, onJoinRoom, token, url]);

	return null;
});

interface MyVideoConferenceProps {
	channelLabel?: string;
	url?: string;
	token?: string;
	onLeaveRoom: (self?: boolean) => void | Promise<void>;
	onFullScreen: () => void;
	onJoinRoom?: () => void;
	isExternalCalling?: boolean;
	tracks?: TrackReferenceOrPlaceholder[];
	isShowChatVoice?: boolean;
	onToggleChat?: () => void;
}

export const MyVideoConference = memo(
	({
		channelLabel,
		onLeaveRoom,
		onFullScreen,
		isExternalCalling = false,
		tracks: propTracks,
		isShowChatVoice,
		onToggleChat,
		onJoinRoom,
		url,
		token
	}: MyVideoConferenceProps) => {
		const room = useRoomContext();

		useScreenSharePublisher(room);

		const rawLayoutContext = useCreateLayoutContext();
		const layoutContext = useMemo(() => rawLayoutContext, [rawLayoutContext?.pin?.state, rawLayoutContext?.widget?.state]);

		return (
			<div className="lk-video-conference flex-1">
				<DeepFilterNetInitializer />
				<VoiceTrackState />
				<ReactionCallHandler />
				<PictureInPictureCleanup layoutContext={layoutContext} />
				<RoomEventManager
					room={room}
					layoutContext={layoutContext}
					onJoinRoom={onJoinRoom}
					onLeaveRoom={onLeaveRoom}
					token={token}
					url={url}
				/>
				<VideoConferenceLayout
					layoutContext={layoutContext}
					tracks={propTracks}
					isExternalCalling={isExternalCalling}
					room={room}
					channelLabel={channelLabel}
					isShowChatVoice={isShowChatVoice}
					onToggleChat={onToggleChat}
					onLeaveRoom={onLeaveRoom}
					onFullScreen={onFullScreen}
				/>
				<RoomAudioRenderer />
				{!propTracks && <ConnectionStateToast />}
				<VoiceContextMenu roomName={room?.name} room={room} />
			</div>
		);
	},
	(cur, prev) =>
		cur.token === prev.token &&
		cur.url === prev.url &&
		cur.isShowChatVoice === prev.isShowChatVoice &&
		cur.isExternalCalling === prev.isExternalCalling &&
		cur.onLeaveRoom === prev.onLeaveRoom &&
		cur.onFullScreen === prev.onFullScreen &&
		cur.onJoinRoom === prev.onJoinRoom
);
