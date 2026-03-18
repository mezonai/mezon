import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
	ConnectionStateToast,
	isTrackReference,
	LayoutContextProvider,
	RoomAudioRenderer,
	useCreateLayoutContext,
	usePinnedTracks,
	useRoomContext,
	useTracks
} from '@livekit/components-react';
import { selectCurrentGroupId, selectMemberByGroupId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { LocalParticipant, LocalTrackPublication, RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { DisconnectReason, RoomEvent, Track } from 'livekit-client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ControlBar from '../ControlBar/ControlBar';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';
import { VoiceContextMenu } from './VoiceContextMenu/VoiceContextMenu';

interface GroupVideoConferenceProps {
	channelLabel?: string;
	onLeaveRoom: (userTracks: number) => void;
	onFullScreen: () => void;
	onJoinRoom?: () => void;
	isExternalCalling?: boolean;
	tracks?: TrackReferenceOrPlaceholder[];
	isShowChatVoice?: boolean;
	onToggleChat?: () => void;
}

export const GroupVideoConference = memo(
	({
		channelLabel,
		onLeaveRoom,
		onFullScreen,
		isExternalCalling = false,
		tracks: propTracks,
		isShowChatVoice,
		onToggleChat,
		onJoinRoom
	}: GroupVideoConferenceProps) => {
		const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

		const tracksFromHook = useTracks(
			[
				{ source: Track.Source.Camera, withPlaceholder: true },
				{ source: Track.Source.ScreenShare, withPlaceholder: false }
			],
			{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
		);

		const tracks = propTracks || tracksFromHook;
		const room = useRoomContext();
		const currentGroupId = useAppSelector(selectCurrentGroupId);
		const groupMembers = useAppSelector((state) => (currentGroupId ? selectMemberByGroupId(state, currentGroupId) : undefined));

		const layoutContext = useCreateLayoutContext();

		const screenShareTracks = useMemo(
			() => tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare),
			[tracks]
		);

		const focusTrack = usePinnedTracks(layoutContext)?.[0];

		const [isShowMember, setIsShowMember] = useState<boolean>(true);

		useEffect(() => {
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
		}, [screenShareTracks, focusTrack, tracks, layoutContext.pin]);

		useEffect(() => {
			if (!focusTrack && document.pictureInPictureElement) {
				document.exitPictureInPicture();
			}
		}, [focusTrack]);

		const toggleViewMode = useCallback(() => {
			if (focusTrack) {
				layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
			} else {
				const firstTrack = screenShareTracks[0] || tracks.find(isTrackReference) || tracks[0];
				if (firstTrack) {
					layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: firstTrack });
				}
			}
		}, [focusTrack, screenShareTracks, tracks, layoutContext.pin]);

		const userTracks = useMemo(
			() => tracks.filter((track) => track.source !== 'screen_share' && track.source !== 'screen_share_audio'),
			[tracks]
		);

		useEffect(() => {
			const handleDisconnected = async (reason?: DisconnectReason) => {
				if (reason === DisconnectReason.CLIENT_INITIATED) return;

				const leaveWithCount = () => onLeaveRoom(userTracks.length);

				if (
					reason === DisconnectReason.SERVER_SHUTDOWN ||
					reason === DisconnectReason.PARTICIPANT_REMOVED ||
					reason === DisconnectReason.SIGNAL_CLOSE ||
					reason === DisconnectReason.JOIN_FAILURE ||
					reason === DisconnectReason.DUPLICATE_IDENTITY
				) {
					await leaveWithCount();
					room?.disconnect();
				} else {
					await leaveWithCount();
				}
			};

			const handleLocalTrackUnpublished = async (_publication: LocalTrackPublication, _participant: LocalParticipant) => {
				if (focusTrack && focusTrack?.participant.sid === _participant.sid) {
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
				if (focusTrack && focusTrack?.participant.sid === participant.sid) {
					layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
				}
			};
			const handleTrackUnpublish = async (publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
				if (focusTrack?.publication?.trackSid === publication?.trackSid && document.pictureInPictureElement) {
					await document.exitPictureInPicture();
				}
			};
			room?.on('disconnected', handleDisconnected);
			room?.on('localTrackUnpublished', handleLocalTrackUnpublished);
			room?.on('reconnected', handleReconnectedRoom);
			room?.on('participantDisconnected', handleUserDisconnect);
			room?.on('trackUnpublished', handleTrackUnpublish);

			return () => {
				room?.off('disconnected', handleDisconnected);
				room?.off('localTrackUnpublished', handleLocalTrackUnpublished);
				room?.off('reconnected', handleReconnectedRoom);
				room?.off('participantDisconnected', handleUserDisconnect);
				room?.off('trackUnpublished', handleTrackUnpublish);
			};
		}, [room, focusTrack, layoutContext.pin, onLeaveRoom, userTracks.length, onJoinRoom]);

		return (
			<div className="lk-video-conference flex-1">
				<LayoutContextProvider value={layoutContext}>
					<div className="lk-video-conference-inner relative bg-gray-100 dark:bg-black group">
						{!focusTrack ? (
							<div className="lk-grid-layout-wrapper bg-gray-300 dark:bg-black !h-full !py-[68px]">
								<GridLayout tracks={tracks} isExternalCalling={isExternalCalling}>
									<ParticipantTile room={room} roomName={room?.name} isExtCalling={isExternalCalling} groupMembers={groupMembers} />
								</GridLayout>
							</div>
						) : (
							<div className={`lk-focus-layout-wrapper !h-full ${isShowMember ? '!py-[68px]' : ''}`}>
								<FocusLayoutContainer isShowMember={isShowMember}>
									{focusTrack && <FocusLayout groupMembers={groupMembers} trackRef={focusTrack} isExtCalling={isExternalCalling} />}
								</FocusLayoutContainer>
							</div>
						)}
						<div className="absolute top-0 left-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
							<div className="w-full h-[68px] flex justify-between items-center p-2 !pr-5">
								<div className="flex justify-start gap-2">
									<span>
										<Icons.Speaker defaultSize="w-6 h-6" defaultFill={isShowMember ? 'text-theme-primary' : 'text-gray-300'} />
									</span>
									<p
										className={`text-base font-semibold cursor-default one-line ${isShowMember ? 'text-theme-primary' : 'text-gray-300'}`}
									>
										{channelLabel}
									</p>
								</div>
								<div className="flex justify-start gap-4">
									<span onClick={toggleViewMode} className="cursor-pointer">
										{focusTrack ? (
											<Icons.VoiceGridIcon
												className={
													isShowMember ? 'text-theme-primary text-theme-primary-hover' : 'text-gray-300 hover:text-white'
												}
											/>
										) : (
											<Icons.VoiceFocusIcon
												className={
													isShowMember ? 'text-theme-primary text-theme-primary-hover' : 'text-gray-300 hover:text-white'
												}
											/>
										)}
									</span>
								</div>
							</div>
						</div>
						<div
							className={`absolute ${isShowMember ? 'bottom-0' : focusTrack ? 'bottom-8' : 'bottom-0'} left-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto`}
						>
							<ControlBar
								onLeaveRoom={() => onLeaveRoom(userTracks.length)}
								onFullScreen={onFullScreen}
								isShowMember={isShowMember}
								isGridView={!focusTrack}
							/>
						</div>
					</div>
				</LayoutContextProvider>
				<RoomAudioRenderer />
				{!propTracks && <ConnectionStateToast />}
				<VoiceContextMenu room={room} groupMembers={groupMembers} />
			</div>
		);
	},
	(cur, prev) =>
		cur.channelLabel === prev.channelLabel &&
		cur.isShowChatVoice === prev.isShowChatVoice &&
		cur.isExternalCalling === prev.isExternalCalling &&
		cur.onLeaveRoom === prev.onLeaveRoom &&
		cur.onFullScreen === prev.onFullScreen &&
		cur.onToggleChat === prev.onToggleChat
);

GroupVideoConference.displayName = 'GroupVideoConference';
