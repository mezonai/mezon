import { isEqualTrackRef } from '@livekit/components-core';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { isTrackReference, LayoutContextProvider, usePinnedTracks, useTracks, type useCreateLayoutContext } from '@livekit/components-react';
import { useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { Room } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationTooltip } from '../../NotificationList/NotificationTooltip';
import ControlBar from '../ControlBar/ControlBar';
import { CarouselLayout } from './FocusLayout/CarouselLayout/CarouselLayout';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

interface ScreenShareAutoFocusManagerProps {
	screenShareTracks: TrackReferenceOrPlaceholder[];
	focusTrack: TrackReferenceOrPlaceholder | undefined;
	tracks: TrackReferenceOrPlaceholder[];
	layoutContext: ReturnType<typeof useCreateLayoutContext>;
	lastAutoFocusedScreenShareTrack: React.MutableRefObject<TrackReferenceOrPlaceholder | null>;
}

const ScreenShareAutoFocusManager = memo(
	({ screenShareTracks, focusTrack, tracks, layoutContext, lastAutoFocusedScreenShareTrack }: ScreenShareAutoFocusManagerProps) => {
		useEffect(() => {
			if (screenShareTracks.some((track) => track.publication?.isSubscribed) && lastAutoFocusedScreenShareTrack.current === null) {
				layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
				lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
			} else if (
				lastAutoFocusedScreenShareTrack.current &&
				!screenShareTracks.some((track) => track.publication?.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid)
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
		}, [screenShareTracks, focusTrack, tracks, layoutContext.pin, lastAutoFocusedScreenShareTrack]);

		return null;
	}
);

interface VideoConferenceLayoutProps {
	layoutContext: ReturnType<typeof useCreateLayoutContext>;
	tracks?: TrackReferenceOrPlaceholder[];
	isExternalCalling: boolean;
	room: Room;
	channelLabel?: string;
	isShowChatVoice?: boolean;
	onToggleChat?: () => void;
	onLeaveRoom: (self?: boolean) => void;
	onFullScreen: () => void;
}

export const VideoConferenceLayout = memo(
	({
		layoutContext,
		tracks: propTracks,
		isExternalCalling,
		room,
		channelLabel,
		isShowChatVoice,
		onToggleChat,
		onLeaveRoom,
		onFullScreen
	}: VideoConferenceLayoutProps) => {
		const dispatch = useAppDispatch();
		const [isShowMember, setIsShowMember] = useState<boolean>(true);
		const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

		const tracksFromHook = useTracks(
			[
				{ source: Track.Source.Camera, withPlaceholder: true },
				{ source: Track.Source.ScreenShare, withPlaceholder: false }
			],
			{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
		);

		const tracks = propTracks || tracksFromHook;

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

		const userTracks = useMemo(
			() => tracks.filter((track) => track.source !== 'screen_share' && track.source !== 'screen_share_audio'),
			[tracks]
		);

		const handleShowMember = useCallback(() => {
			setIsShowMember((prevState) => !prevState);
		}, []);

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

		const onToggleChatBox = useCallback(() => {
			if (isExternalCalling) {
				dispatch(voiceActions.setToggleChatBox());
			} else {
				onToggleChat?.();
			}
		}, [isExternalCalling, dispatch, onToggleChat]);

		return (
			<LayoutContextProvider value={layoutContext}>
				<ScreenShareAutoFocusManager
					screenShareTracks={screenShareTracks}
					focusTrack={focusTrack}
					tracks={tracks}
					layoutContext={layoutContext}
					lastAutoFocusedScreenShareTrack={lastAutoFocusedScreenShareTrack}
				/>
				<div className="lk-video-conference-inner relative bg-gray-100 dark:bg-black group">
					{!focusTrack ? (
						<div className="lk-grid-layout-wrapper bg-gray-300 dark:bg-black !h-full !py-[68px]">
							<GridLayout tracks={tracks} isExternalCalling={isExternalCalling}>
								<ParticipantTile room={room} roomName={room?.name} isExtCalling={isExternalCalling} />
							</GridLayout>
						</div>
					) : (
						<div className={`lk-focus-layout-wrapper !h-full ${isShowMember ? '!py-[68px]' : ''}`}>
							<FocusLayoutContainer isShowMember={isShowMember}>
								{focusTrack && <FocusLayout trackRef={focusTrack} isExtCalling={isExternalCalling} />}
								{isShowMember && (
									<CarouselLayout tracks={carouselTracks}>
										<ParticipantTile room={room} roomName={room?.name} isExtCalling={isExternalCalling} />
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
										<Icons.Speaker defaultSize="w-6 h-6" defaultFill={isShowMember ? 'text-theme-primary' : 'text-gray-300'} />
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
								{!isExternalCalling && !propTracks && <NotificationTooltip isGridView={!focusTrack} isShowMember={isShowMember} />}
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
										defaultFill={isShowMember ? 'text-theme-primary text-theme-primary-hover' : 'text-gray-300 hover:text-white'}
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
		);
	}
);

VideoConferenceLayout.displayName = 'VideoConferenceLayout';
