import {
	ConnectionStateToast,
	LayoutContextProvider,
	RoomAudioRenderer,
	TrackReferenceOrPlaceholder,
	isTrackReference,
	useCreateLayoutContext,
	usePinnedTracks,
	useRoomContext,
	useTracks
} from '@livekit/components-react';
import { useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	DisconnectReason,
	LocalParticipant,
	LocalTrackPublication,
	RemoteParticipant,
	RemoteTrackPublication,
	RoomEvent,
	Track
} from 'livekit-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import ControlBar from '../ControlBar/ControlBar';
import { CarouselLayout } from './FocusLayout/CarouselLayout/CarouselLayout';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';
import { ReactionCallHandler } from './Reaction';
import { useSoundReactions } from './Reaction/useSoundReactions';

interface MyVideoConferenceProps {
	channelLabel?: string;
	url?: string;
	token: string;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onJoinRoom?: () => void;
	isExternalCalling?: boolean;
	tracks?: TrackReferenceOrPlaceholder[];
	isShowChatVoice?: boolean;
	onToggleChat?: () => void;
	currentChannel?: any;
}

export function MyVideoConference({
	channelLabel,
	onLeaveRoom,
	onFullScreen,
	isExternalCalling = false,
	tracks: propTracks,
	isShowChatVoice,
	onToggleChat,
	currentChannel,
	onJoinRoom,
	url,
	token
}: MyVideoConferenceProps) {
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isGridView, setIsGridView] = useState<boolean>(true);
	const { activeSoundReactions, handleSoundReaction } = useSoundReactions();

	const tracksFromHook = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false }
		],
		{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
	);

	const tracks = propTracks || tracksFromHook;

	const layoutContext = useCreateLayoutContext();

	const screenShareTracks = useMemo(() => {
		return tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare);
	}, [tracks]);

	const focusTrack = usePinnedTracks(layoutContext)?.[0];
	const [isShowMember, setIsShowMember] = useState<boolean>(true);

	const handleShowMember = useCallback(() => {
		setIsShowMember((prevState) => !prevState);
	}, []);

	const dispatch = useAppDispatch();

	useEffect(() => {
		setIsFocused(!!focusTrack);
		setIsGridView(!focusTrack);
	}, [focusTrack]);

	const toggleViewMode = () => {
		if (isFocused) {
			layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
			setIsGridView(true);
		} else {
			const firstTrack = screenShareTracks[0] || tracks.find(isTrackReference) || tracks[0];
			if (firstTrack) {
				layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: firstTrack });
				setIsGridView(false);
			}
		}
	};

	const userTracks = tracks.filter((track) => track.source !== 'screen_share' && track.source !== 'screen_share_audio');
	const room = useRoomContext();

	useEffect(() => {
		const handleDisconnected = async (reason?: DisconnectReason) => {
			if (
				reason === DisconnectReason.SERVER_SHUTDOWN ||
				reason === DisconnectReason.DUPLICATE_IDENTITY ||
				reason === DisconnectReason.CLIENT_INITIATED ||
				reason === DisconnectReason.PARTICIPANT_REMOVED
			) {
				onLeaveRoom();
			} else {
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
			}
		};
		const handleLocalTrackUnpublished = (publication: LocalTrackPublication, participant: LocalParticipant) => {
			if (publication.source === Track.Source.ScreenShare) {
				dispatch(voiceActions.setShowScreen(false));
			}
			if (publication.source === Track.Source.Camera) {
				dispatch(voiceActions.setShowCamera(false));
			}
			if (focusTrack && focusTrack?.participant.sid === participant.sid) {
				layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
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
		};
		const handleTrackUnpublish = async (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
			if (focusTrack?.publication?.trackSid === publication?.trackSid) {
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
	}, [room, focusTrack?.participant.sid]);

	const onToggleChatBox = () => {
		if (isExternalCalling) {
			dispatch(voiceActions.setToggleChatBox());
		} else {
			onToggleChat?.();
		}
	};

	return (
		<div className="lk-video-conference flex-1">
			<ReactionCallHandler currentChannel={currentChannel} onSoundReaction={handleSoundReaction} />
			<LayoutContextProvider value={layoutContext}>
				<div className="lk-video-conference-inner relative bg-gray-100 dark:bg-black group">
					{!focusTrack ? (
						<div className="lk-grid-layout-wrapper bg-gray-300 dark:bg-black !h-full !py-[68px]">
							<GridLayout tracks={tracks}>
								<ParticipantTile roomName={room?.name} isExtCalling={isExternalCalling} activeSoundReactions={activeSoundReactions} />
							</GridLayout>
						</div>
					) : (
						<div className={`lk-focus-layout-wrapper !h-full  ${isShowMember ? '!py-[68px]' : ''}`}>
							<FocusLayoutContainer isShowMember={isShowMember}>
								{focusTrack && <FocusLayout trackRef={focusTrack} isExtCalling={isExternalCalling} />}
								{isShowMember && (
									<CarouselLayout tracks={tracks}>
										<ParticipantTile
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
						<div className="w-full h-[68px] flex justify-between items-center p-2 !pr-5 ">
							<div className="flex justify-start gap-2">
								<span>
									{!isExternalCalling ? (
										<Icons.Speaker
											defaultSize="w-6 h-6"
											defaultFill={` ${
												(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
													? 'text-theme-primary '
													: 'text-gray-300 '
											}`}
										/>
									) : (
										<Icons.SpeakerLocked
											defaultSize="w-6 h-6"
											defaultFill={` ${
												(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
													? 'text-theme-primary '
													: 'text-gray-300 '
											}`}
										/>
									)}
								</span>
								<p
									className={`text-base font-semibold cursor-default one-line ${
										(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
											? 'text-theme-primary '
											: 'text-gray-300 '
									}`}
								>
									{channelLabel}
								</p>
							</div>
							<div className="flex justify-start gap-4">
								{!isExternalCalling && !propTracks && <NotificationTooltip isGridView={isGridView} isShowMember={isShowMember} />}
								<span onClick={toggleViewMode} className="cursor-pointer">
									{focusTrack ? (
										<Icons.VoiceGridIcon
											className={` ${
												(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
													? 'text-theme-primary text-theme-primary-hover'
													: 'text-gray-300 hover:text-white'
											}`}
										/>
									) : (
										<Icons.VoiceFocusIcon
											className={` ${
												(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
													? 'text-theme-primary text-theme-primary-hover'
													: 'text-gray-300 hover:text-white'
											}`}
										/>
									)}
								</span>
								<button
									className="relative focus-visible:outline-none"
									title="Chat"
									onClick={onToggleChatBox}
									style={{ marginLeft: 8 }}
								>
									<Icons.Chat
										defaultSize="w-5 h-5"
										defaultFill={
											(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
												? 'text-theme-primary text-theme-primary-hover'
												: 'text-gray-300 hover:text-white'
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
							currentChannel={currentChannel}
							isShowMember={isShowMember}
							isGridView={isGridView}
						/>
					</div>
				</div>
			</LayoutContextProvider>
			<RoomAudioRenderer />
			{!propTracks && <ConnectionStateToast />}
		</div>
	);
}
