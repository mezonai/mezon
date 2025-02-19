import {
	CarouselLayout,
	ConnectionStateToast,
	FocusLayout,
	FocusLayoutContainer,
	GridLayout,
	isTrackReference,
	LayoutContextProvider,
	ParticipantTile,
	RoomAudioRenderer,
	useConnectionState,
	useCreateLayoutContext,
	usePinnedTracks,
	useRoomContext,
	useTracks
} from '@livekit/components-react';
import { useAppDispatch, voiceActions } from '@mezon/store';
import { ConnectionState, Participant, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { useEffect, useMemo, useRef } from 'react';
import { ControlBar } from '../ControlBar/ControlBar';

interface MyVideoConferenceProps {
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onScreenShare: (enabled: boolean) => void;
}

export function MyVideoConference({ onLeaveRoom, onFullScreen, onScreenShare }: MyVideoConferenceProps) {
	const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false }
		],
		{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
	);

	const layoutContext = useCreateLayoutContext();

	const screenShareTracks = useMemo(() => {
		return tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare);
	}, [tracks]);

	const focusTrack = usePinnedTracks(layoutContext)?.[0];
	const carouselTracks = useMemo(() => {
		return tracks.filter((track) => !isEqualTrackRef(track, focusTrack));
	}, [tracks, focusTrack]);

	useEffect(() => {
		// If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
		if (screenShareTracks.some((track) => track.publication.isSubscribed) && lastAutoFocusedScreenShareTrack.current === null) {
			layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
			lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
		} else if (
			lastAutoFocusedScreenShareTrack.current &&
			!screenShareTracks.some((track) => track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid)
		) {
			layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
			lastAutoFocusedScreenShareTrack.current = null;
		}

		if (focusTrack && !isTrackReference(focusTrack)) {
			const updatedFocusTrack = tracks.find(
				(tr) => tr.participant.identity === focusTrack.participant.identity && tr.source === focusTrack.source
			);
			if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
				layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
			}
		}
	}, [screenShareTracks, focusTrack?.publication?.trackSid, tracks]);

	const dispatch = useAppDispatch();
	const room = useRoomContext();
	const connectionState = useConnectionState(room);

	if (connectionState === ConnectionState.Connected) {
		dispatch(voiceActions.setVoiceConnectionState(true));
	}

	return (
		<div className="lk-video-conference">
			<LayoutContextProvider value={layoutContext}>
				<div className="lk-video-conference-inner">
					{!focusTrack ? (
						<div className="lk-grid-layout-wrapper">
							<GridLayout tracks={tracks}>
								<ParticipantTile />
							</GridLayout>
						</div>
					) : (
						<div className="lk-focus-layout-wrapper">
							<FocusLayoutContainer>
								<CarouselLayout tracks={carouselTracks}>
									<ParticipantTile />
								</CarouselLayout>
								{focusTrack && <FocusLayout trackRef={focusTrack} />}
							</FocusLayoutContainer>
						</div>
					)}
					<ControlBar onLeaveRoom={onLeaveRoom} onFullScreen={onFullScreen} onScreenShare={onScreenShare} />
				</div>
			</LayoutContextProvider>
			<RoomAudioRenderer />
			<ConnectionStateToast />
		</div>
	);
}

function isEqualTrackRef(a?: TrackReferenceOrPlaceholder, b?: TrackReferenceOrPlaceholder): boolean {
	if (a === undefined || b === undefined) {
		return false;
	}
	if (isTrackReference(a) && isTrackReference(b)) {
		return a.publication.trackSid === b.publication.trackSid;
	} else {
		return getTrackReferenceId(a) === getTrackReferenceId(b);
	}
}

function getTrackReferenceId(trackReference: TrackReferenceOrPlaceholder | number) {
	if (typeof trackReference === 'string' || typeof trackReference === 'number') {
		return `${trackReference}`;
	} else if (isTrackReferencePlaceholder(trackReference)) {
		return `${trackReference.participant.identity}_${trackReference.source}_placeholder`;
	} else if (isTrackReference(trackReference)) {
		return `${trackReference.participant.identity}_${trackReference.publication.source}_${trackReference.publication.trackSid}`;
	} else {
		throw new Error(`Can't generate a id for the given track reference: ${trackReference}`);
	}
}

function isTrackReferencePlaceholder(trackReference?: TrackReferenceOrPlaceholder): trackReference is TrackReferencePlaceholder {
	if (!trackReference) {
		return false;
	}
	return (
		Object.prototype.hasOwnProperty.call(trackReference, 'participant') &&
		Object.prototype.hasOwnProperty.call(trackReference, 'source') &&
		typeof trackReference.publication === 'undefined'
	);
}

type TrackReferenceOrPlaceholder = TrackReference | TrackReferencePlaceholder;

type TrackReferencePlaceholder = {
	participant: Participant;
	publication?: never;
	source: Track.Source;
};

type TrackReference = {
	participant: Participant;
	publication: TrackPublication;
	source: Track.Source;
};
