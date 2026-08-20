import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { isTrackReference } from '@livekit/components-react';
// import { useAuth } from '@mezon/core';
import { getStore, selectIsVoiceRecording, selectMemberClanByUserId, voiceActions } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import type { Participant, RemoteTrackPublication, Room, TrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { safeJSONParse } from 'mezon-js';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// import { useSendReaction } from '../MyVideoConference/Reaction/useSendReaction';
import type { QualityPinRequest } from './RecordingQualityPin';
import { RecordingQualityPin, estimateRecordingTileSize } from './RecordingQualityPin';
import type { RecorderEvent } from './callRecorder';
import { callRecorder, selectRecordingTiles } from './callRecorder';
import type { RecordingAudioSource, RecordingSceneTile } from './types';

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
	return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}

/** Only remote publications can be re-negotiated; local tracks are already at capture quality. */
function isRemoteVideoPublication(publication?: TrackPublication): publication is RemoteTrackPublication {
	return !!publication && typeof (publication as RemoteTrackPublication).setVideoQuality === 'function';
}

const AUDIO_EVENTS: RoomEvent[] = [
	RoomEvent.TrackSubscribed,
	RoomEvent.TrackUnsubscribed,
	RoomEvent.TrackMuted,
	RoomEvent.TrackUnmuted,
	RoomEvent.LocalTrackPublished,
	RoomEvent.LocalTrackUnpublished,
	RoomEvent.ParticipantConnected,
	RoomEvent.ParticipantDisconnected,
	RoomEvent.Reconnected
];

interface ParticipantIdentity {
	label: string;
	avatarUrl: string | null;
}

function resolveIdentity(track: TrackReferenceOrPlaceholder, isExternalCalling: boolean): ParticipantIdentity {
	const participant = track.participant;
	const participantId = participant.identity;
	const metadata = isExternalCalling ? safeJSONParse(participant.metadata as string) : undefined;
	const member = selectMemberClanByUserId(getStore().getState(), participantId);

	const label = member?.clan_nick || member?.user?.display_name || member?.user?.username || metadata?.extName || participant.name || participantId;

	const rawAvatar = metadata?.extAvatar || member?.clan_avatar || member?.user?.avatar_url || null;
	// Same proxy the tiles render through: it is the origin that actually answers with
	// CORS headers, which the recorder needs to keep its canvas untainted.
	const avatarUrl = rawAvatar ? createImgproxyUrl(rawAvatar, { width: 320, height: 320, resizeType: 'fit' }) || rawAvatar : null;

	return { label, avatarUrl };
}

function collectAudioSources(room: Room | undefined): RecordingAudioSource[] {
	if (!room) return [];

	const sources: RecordingAudioSource[] = [];
	const push = (participant: Participant) => {
		participant.trackPublications.forEach((publication) => {
			if (publication.kind !== Track.Kind.Audio || publication.isMuted) return;
			const mediaStreamTrack = publication.track?.mediaStreamTrack;
			if (!mediaStreamTrack || mediaStreamTrack.readyState !== 'live') return;
			sources.push({ key: `${participant.identity}:${publication.source}`, track: mediaStreamTrack });
		});
	};

	push(room.localParticipant);
	room.remoteParticipants.forEach(push);
	return sources;
}

interface SceneBuildInput {
	tracks: TrackReferenceOrPlaceholder[];
	focusTrack?: TrackReferenceOrPlaceholder;
	isExternalCalling: boolean;
	screenLabel: (username: string) => string;
}

interface BuiltScene {
	tiles: RecordingSceneTile[];
	pinRequests: QualityPinRequest[];
}

function buildScene({ tracks, focusTrack, isExternalCalling, screenLabel }: SceneBuildInput): BuiltScene {
	const focusKey = focusTrack ? `${focusTrack.participant.identity}:${focusTrack.source}` : null;
	const remotePublications = new Map<string, RemoteTrackPublication>();

	const tiles: RecordingSceneTile[] = tracks.map((track) => {
		const key = `${track.participant.identity}:${track.source}`;
		const isScreenShare = track.source === Track.Source.ScreenShare || track.source === ('screen_share' as Track.Source);
		const publication = isTrackReference(track) ? track.publication : undefined;
		const mediaStreamTrack = publication?.kind === Track.Kind.Video && !publication.isMuted ? publication.track?.mediaStreamTrack : undefined;
		const { label, avatarUrl } = resolveIdentity(track, isExternalCalling);

		if (mediaStreamTrack && isRemoteVideoPublication(publication)) {
			remotePublications.set(key, publication);
		}

		return {
			key,
			participantId: track.participant.identity,
			// ParticipantTile labels a screen share "<name>'s screen"; mirror it.
			label: isScreenShare ? screenLabel(label) : label,
			avatarUrl,
			videoTrack: mediaStreamTrack ?? null,
			isScreenShare,
			focused: focusKey === key,
			speaking: track.participant.isSpeaking
		};
	});

	// Only the composited tiles are worth pinning, and the tile size has to be
	// measured against that same subset — a 40-person room still records 16 tiles,
	// so sizing the pin off 40 would request a layer far below what it has to fill.
	const visible = selectRecordingTiles(tiles);
	const frame = callRecorder.frameSize;
	const pinRequests: QualityPinRequest[] = [];

	for (const tile of visible) {
		const publication = remotePublications.get(tile.key);
		if (!publication) continue;
		const size = estimateRecordingTileSize(frame.width, frame.height, visible.length, tile.focused, !!focusKey);
		pinRequests.push({ key: tile.key, publication, width: size.width, height: size.height });
	}

	return { tiles, pinRequests };
}

interface UseCallRecorderParams {
	room?: Room;
	tracks: TrackReferenceOrPlaceholder[];
	focusTrack?: TrackReferenceOrPlaceholder;
	isExternalCalling: boolean;
}

/**
 * Feeds the recorder the same track list the layout renders, so the file mirrors
 * what is on screen.
 *
 * Nothing is built while idle. `tracks` comes from a `useTracks` configured with
 * `updateOnlyOn: [ActiveSpeakersChanged]`, so this hook's inputs change several
 * times a second in a busy call — walking every participant to resolve names and
 * avatars on each of those would be pure waste for a feature that is off. The
 * layout instead registers itself as the recorder's source and the engine pulls
 * the opening scene when the user actually presses record.
 */
export function useCallRecorder({ room, tracks, focusTrack, isExternalCalling }: UseCallRecorderParams): void {
	const { t } = useTranslation('channelVoice');
	const isRecording = useSelector(selectIsVoiceRecording);
	const qualityPinRef = useRef<RecordingQualityPin | null>(null);

	const screenLabel = useCallback((username: string) => t('usernameScreen', { username }), [t]);

	// Read by the engine at start time, so it must always describe the current room.
	const inputRef = useRef<SceneBuildInput>({ tracks, focusTrack, isExternalCalling, screenLabel });
	inputRef.current = { tracks, focusTrack, isExternalCalling, screenLabel };

	const roomRef = useRef(room);
	roomRef.current = room;

	useEffect(() => {
		return callRecorder.setSource({
			scene: () => buildScene(inputRef.current).tiles,
			audio: () => collectAudioSources(roomRef.current)
		});
	}, []);

	useEffect(() => {
		if (!isRecording) {
			qualityPinRef.current?.releaseAll();
			qualityPinRef.current = null;
			return;
		}

		const { tiles, pinRequests } = buildScene({ tracks, focusTrack, isExternalCalling, screenLabel });
		callRecorder.syncScene(tiles);

		if (!qualityPinRef.current) {
			qualityPinRef.current = new RecordingQualityPin();
		}
		qualityPinRef.current.sync(pinRequests);
	}, [tracks, focusTrack, isExternalCalling, isRecording, screenLabel]);

	useEffect(() => {
		if (!room) return;

		// Cheap to skip: the engine holds the only consumer of these tracks.
		const sync = () => {
			if (callRecorder.isRecording) {
				callRecorder.syncAudio(collectAudioSources(room));
			}
		};

		AUDIO_EVENTS.forEach((event) => room.on(event, sync));
		return () => {
			AUDIO_EVENTS.forEach((event) => room.off(event, sync));
		};
	}, [room]);

	// TEMPORARILY DISABLED: the room is not told who is recording.
	//
	// The signal itself still works and the wiring below is the right shape for it —
	// the recorder, not the button, is the source of truth, because a recording also
	// ends on the memory deadline and on encoder errors. Re-enable by uncommenting the
	// `broadcastRef` lines here and the three call sites below.
	//
	// const { sendRecordingState } = useSendReaction();
	// const broadcastRef = useRef(sendRecordingState);
	// broadcastRef.current = sendRecordingState;
	// const { userId } = useAuth();
	// const userIdRef = useRef(userId);
	// userIdRef.current = userId;

	const notify = useCallback(
		(event: RecorderEvent) => {
			if (event.type === 'finished') {
				const { result } = event;
				toast.success(
					t(result.savedToDisk ? 'recording.savedToDisk' : 'recording.downloaded', {
						fileName: result.fileName,
						size: formatBytes(result.bytes)
					})
				);
			} else if (event.type === 'error') {
				toast.error(t('recording.failed', { reason: event.message }));
			}
		},
		[t]
	);
	const notifyRef = useRef(notify);
	notifyRef.current = notify;

	useEffect(() => {
		return callRecorder.subscribe((event) => {
			notifyRef.current(event);

			// const id = userIdRef.current;
			// if (!id) return;
			// if (event.type === 'started') {
			// 	broadcastRef.current(id, true);
			// } else if (event.type === 'finished' || event.type === 'error') {
			// 	broadcastRef.current(id, false);
			// }
		});
	}, []);

	useEffect(() => {
		return () => {
			qualityPinRef.current?.releaseAll();
			qualityPinRef.current = null;

			if (!callRecorder.isRecording) {
				getStore().dispatch(voiceActions.resetRecordingState());
				return;
			}

			// Leaving the call must not leave a half-written file behind — the file is
			// still finalised. React has already run the cleanup of the subscriber above,
			// so the outcome toast is driven from here, by a listener that deliberately
			// outlives the component.
			// if (userIdRef.current) {
			// 	broadcastRef.current(userIdRef.current, false);
			// }
			const detached = callRecorder.subscribe(notifyRef.current);
			void callRecorder.stop().finally(() => {
				detached();
				getStore().dispatch(voiceActions.resetRecordingState());
			});
		};
	}, []);
}
