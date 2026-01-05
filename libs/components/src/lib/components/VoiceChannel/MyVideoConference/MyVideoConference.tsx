import { isEqualTrackRef } from '@livekit/components-core';
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
import { getStore, selectCurrentUserId, useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type {
	LocalParticipant,
	LocalTrackPublication,
	Participant,
	RemoteParticipant,
	RemoteTrackPublication,
	TrackPublication
} from 'livekit-client';
import { DisconnectReason, RoomEvent, Track } from 'livekit-client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import ControlBar from '../ControlBar/ControlBar';
import { CarouselLayout } from './FocusLayout/CarouselLayout/CarouselLayout';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { useScreenSharePublisher } from './hooks/useScreenSharePublisher';
import { VoiceTrackState } from './hooks/useVoiceTrackState';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';
import { ReactionCallHandler } from './Reaction';
import { useSoundReactions } from './Reaction/useSoundReactions';
import { useDeepFilterNet3 } from './useDeepFilterNet3';
import { VoiceContextMenu } from './VoiceContextMenu/VoiceContextMenu';

const DeepFilterNetInitializer = memo(() => {
	useDeepFilterNet3({ enabled: true });
	return null;
});

interface MyVideoConferenceProps {
	channelLabel?: string;
	url?: string;
	token?: string;
	onLeaveRoom: (self?: boolean) => void;
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
		const { activeSoundReactions, handleSoundReaction, removeActiveSoundParticipant } = useSoundReactions();
		const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

		const tracksFromHook = useTracks(
			[
				{ source: Track.Source.Camera, withPlaceholder: true },
				{ source: Track.Source.ScreenShare, withPlaceholder: false }
			],
			{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
		);

		const tracks = propTracks || tracksFromHook;
		const dispatch = useAppDispatch();
		const room = useRoomContext();

		useScreenSharePublisher(room);

		const layoutContext = useCreateLayoutContext();

		const screenShareTracks = useMemo(
			() => tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare),
			[tracks]
		);

		const focusTrack = usePinnedTracks(layoutContext)?.[0];

		const carouselTracks = useMemo(() => {
			if (!focusTrack) {
				return tracks;
			}

			const isFocusScreenShare =
				(isTrackReference(focusTrack) &&
					(focusTrack.publication?.source === Track.Source.ScreenShare || focusTrack.source === ('screen_share' as Track.Source))) ||
				focusTrack.source === 'screen_share';

			if (isFocusScreenShare) {
				return tracks;
			}
			return tracks.filter((track) => !isEqualTrackRef(track, focusTrack));
		}, [tracks, focusTrack]);
		const [isShowMember, setIsShowMember] = useState<boolean>(true);

		const handleShowMember = useCallback(() => {
			setIsShowMember((prevState) => !prevState);
		}, []);

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

				if (
					reason === DisconnectReason.SERVER_SHUTDOWN ||
					reason === DisconnectReason.PARTICIPANT_REMOVED ||
					reason === DisconnectReason.SIGNAL_CLOSE ||
					reason === DisconnectReason.JOIN_FAILURE ||
					reason === DisconnectReason.DUPLICATE_IDENTITY
				) {
					await onLeaveRoom();
					room?.disconnect();
				} else if (token) {
					if (!url) return;
					const maxAttempts = 3;

					for (let attempt = 1; attempt <= maxAttempts; attempt++) {
						try {
							await room?.connect(url, token);
							return;
						} catch (error) {
							if (attempt === maxAttempts) {
								onLeaveRoom();
							} else {
								await new Promise((resolve) => setTimeout(resolve, 2000));
							}
						}
					}
				} else {
					onLeaveRoom();
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
				if (focusTrack && focusTrack?.participant.sid === participant.sid) {
					layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
					if (document.pictureInPictureElement) {
						await document.exitPictureInPicture();
					}
				}
			};
			const handleReconnectedRoom = () => {
				if (onJoinRoom) {
					onJoinRoom();
				}
			};

			const handleUserDisconnect = (participant: RemoteParticipant) => {
				if (focusTrack && focusTrack?.participant.sid === participant.sid) {
					layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
				}
				dispatch(voiceActions.closeVoiceContextMenu());
			};
			const handleTrackUnpublish = async (publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
				if (focusTrack?.publication?.trackSid === publication?.trackSid && document.pictureInPictureElement) {
					await document.exitPictureInPicture();
				}
			};

			const handleTrackMuted = async (publication: TrackPublication, participant: Participant) => {
				const store = getStore();
				const userId = selectCurrentUserId(store.getState());
				if (participant.identity === userId) {
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
		}, [room, focusTrack, dispatch, layoutContext.pin, onJoinRoom, onLeaveRoom, token, url]);

		useEffect(() => {
			if (room?.name) {
				dispatch(voiceActions.setVoiceInfoId(room?.name));
			}
		}, [dispatch, room?.name]);

		const onToggleChatBox = () => {
			if (isExternalCalling) {
				dispatch(voiceActions.setToggleChatBox());
			} else {
				onToggleChat?.();
			}
		};

		return (
			<div className="lk-video-conference flex-1">
				<DeepFilterNetInitializer />
				<VoiceTrackState />
				<ReactionCallHandler onSoundReaction={handleSoundReaction} onEndSound={removeActiveSoundParticipant} />
				<LayoutContextProvider value={layoutContext}>
					<div className="lk-video-conference-inner relative bg-gray-100 dark:bg-black group">
						{!focusTrack ? (
							<div className="lk-grid-layout-wrapper bg-gray-300 dark:bg-black !h-full !py-[68px]">
								<GridLayout tracks={tracks} isExternalCalling={isExternalCalling}>
									<ParticipantTile
										room={room}
										roomName={room?.name}
										isExtCalling={isExternalCalling}
										activeSoundReactions={activeSoundReactions}
									/>
								</GridLayout>
							</div>
						) : (
							<div className={`lk-focus-layout-wrapper !h-full ${isShowMember ? '!py-[68px]' : ''}`}>
								<FocusLayoutContainer isShowMember={isShowMember}>
									{focusTrack && <FocusLayout trackRef={focusTrack} isExtCalling={isExternalCalling} />}
									{isShowMember && (
										<CarouselLayout tracks={carouselTracks}>
											<ParticipantTile
												room={room}
												roomName={room?.name}
												isExtCalling={isExternalCalling}
												activeSoundReactions={activeSoundReactions}
											/>
										</CarouselLayout>
									)}
								</FocusLayoutContainer>
								<div
									className={`absolute bg-[#2B2B2B] left-1/2 ${isShowMember ? 'bottom-[178px]' : 'bottom-[140px]'}
                        transform -translate-x-1/2 flex flex-row items-center gap-[2px] p-[2px] rounded-[20px]
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto`}
									onClick={handleShowMember}
								>
									{isShowMember ? <Icons.VoiceArowDownIcon /> : <Icons.VoiceArowUpIcon />}
									<p className="flex gap-1">
										<span>
											<Icons.MemberList defaultFill="text-white" />
										</span>
										<span className="pr-[6px]">{userTracks.length}</span>
									</p>
								</div>
							</div>
						)}
						<div className="absolute top-0 left-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
							<div className="w-full h-[68px] flex justify-between items-center p-2 !pr-5">
								<div className="flex justify-start gap-2">
									<span>
										{!isExternalCalling ? (
											<Icons.Speaker
												defaultSize="w-6 h-6"
												defaultFill={isShowMember ? 'text-theme-primary' : 'text-gray-300'}
											/>
										) : (
											<Icons.SpeakerLocked
												defaultSize="w-6 h-6"
												defaultFill={isShowMember ? 'text-theme-primary' : 'text-gray-300'}
											/>
										)}
									</span>
									<p
										className={`text-base font-semibold cursor-default one-line ${isShowMember ? 'text-theme-primary' : 'text-gray-300'}`}
									>
										{channelLabel}
									</p>
								</div>
								<div className="flex justify-start gap-4">
									{!isExternalCalling && !propTracks && (
										<NotificationTooltip isGridView={!focusTrack} isShowMember={isShowMember} />
									)}
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
									<button className="relative focus-visible:outline-none" title="Chat" onClick={onToggleChatBox}>
										<Icons.Chat
											defaultSize="w-5 h-5"
											defaultFill={
												isShowMember ? 'text-theme-primary text-theme-primary-hover' : 'text-gray-300 hover:text-white'
											}
											className={isShowChatVoice ? 'text-white' : 'text-white hover:text-gray-200'}
										/>
									</button>
								</div>
							</div>
						</div>
						<div
							className={`absolute ${isShowMember ? 'bottom-0' : focusTrack ? 'bottom-8' : 'bottom-0'} left-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto`}
						>
							<ControlBar
								isExternalCalling={isExternalCalling}
								onLeaveRoom={onLeaveRoom}
								onFullScreen={onFullScreen}
								isShowMember={isShowMember}
								isGridView={!focusTrack}
							/>
						</div>
					</div>
				</LayoutContextProvider>
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
