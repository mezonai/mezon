import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
	ConnectionStateToast,
	isTrackReference,
	LayoutContextProvider,
	RoomAudioRenderer,
	useCreateLayoutContext,
	usePinnedTracks,
	useTracks
} from '@livekit/components-react';
import { Icons } from '@mezon/ui';
import { RoomEvent, Track } from 'livekit-client';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ControlBar from '../ControlBar/ControlBar';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout/FocusLayoutContainer';
import { GridLayout } from './GridLayout/GridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

interface GroupVideoConferenceProps {
	channelLabel?: string;
	onLeaveRoom: (userTracks: number) => void;
	onFullScreen: () => void;
	isExternalCalling?: boolean;
	tracks?: TrackReferenceOrPlaceholder[];
	isShowChatVoice?: boolean;
	onToggleChat?: () => void;
}

const TOOLTIP_OVERLAY_STYLE = { background: 'none', boxShadow: 'none' } as const;

export function GroupVideoConference({
	channelLabel,
	onLeaveRoom,
	onFullScreen,
	isExternalCalling = false,
	tracks: propTracks
}: GroupVideoConferenceProps) {
	const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

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
	}, [screenShareTracks, focusTrack?.publication?.trackSid, tracks, layoutContext?.pin]);

	const [isShowMember, setIsShowMember] = useState<boolean>(true);

	const handleShowMember = useCallback(() => {
		setIsShowMember((prevState) => !prevState);
	}, []);

	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const toggleViewMode = () => {
		// if (isFocused) {
		// 	layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
		// } else {
		// 	const firstTrack = screenShareTracks[0] || tracks.find(isTrackReference) || tracks[0];
		// 	if (firstTrack) {
		// 		layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: firstTrack });
		// 	}
		// }
	};

	const userTracks = tracks.filter((track) => track.source !== 'screen_share' && track.source !== 'screen_share_audio');

	const handleLeaveRoom = useCallback(() => onLeaveRoom(userTracks?.length), [userTracks?.length]);

	return (
		<div className="lk-video-conference flex-1">
			<LayoutContextProvider value={layoutContext}>
				<div
					className="lk-video-conference-inner relative  bg-gray-100 dark:bg-black"
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{!focusTrack ? (
						<div className="lk-grid-layout-wrapper !h-full !pb-[68px]">
							<GridLayout tracks={tracks}>
								<ParticipantTile isExtCalling={isExternalCalling} />
							</GridLayout>
						</div>
					) : (
						<div className={`lk-focus-layout-wrapper !h-full  ${isShowMember ? '!pb-[68px]' : ''}`}>
							<FocusLayoutContainer isShowMember={isShowMember}>
								{focusTrack && <FocusLayout trackRef={focusTrack} isExtCalling={isExternalCalling} />}
								{/* {isShowMember && (
									<CarouselLayout tracks={tracks}>
										<ParticipantTile isExtCalling={isExternalCalling} />
									</CarouselLayout>
								)} */}
							</FocusLayoutContainer>
							{isHovered && (
								<Tooltip
									key={+isShowMember}
									placement="top"
									overlay={
										<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">
											{isShowMember ? 'Hide Members' : 'Show Members'}
										</span>
									}
									overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
									getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
									destroyTooltipOnHide
								>
									<div
										className={`absolute bg-[#2B2B2B] left-1/2 ${isShowMember ? 'bottom-[178px]' : 'bottom-[140px]'}
											transform -translate-x-1/2 flex flex-row items-center gap-[2px] p-[2px] rounded-[20px]`}
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
								</Tooltip>
							)}
						</div>
					)}
					<div
						className={`absolute top-0 left-0 w-full transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
					>
						<div className="w-full h-[68px] flex justify-between items-center p-2 !pr-5">
							<div className="flex justify-start gap-2">
								<span>
									{!isExternalCalling ? (
										<Icons.Speaker
											defaultSize="w-6 h-6"
											defaultFill={`${isShowMember ? 'text-[#535353] dark:text-[#B5BAC1]' : 'text-white'}`}
										/>
									) : (
										<Icons.SpeakerLocked
											defaultSize="w-6 h-6"
											defaultFill={`${isShowMember ? 'text-[#535353] dark:text-[#B5BAC1]' : 'text-white'}`}
										/>
									)}
								</span>
								<p
									className={`text-base font-semibold cursor-default one-line ${isShowMember ? 'text-[#535353] dark:text-[#B5BAC1]' : 'text-white'}`}
								>
									{channelLabel}
								</p>
							</div>
							<div className="flex justify-start gap-4">
								<Tooltip
									showArrow={{ className: '!top-[6px]' }}
									key={+focusTrack}
									placement="bottomRight"
									align={{
										offset: [11, -4]
									}}
									overlay={
										<span
											className={`${isShowMember ? 'bg-[#535353] dark:bg-[#B5BAC1]' : 'bg-[#2B2B2B]'} rounded p-[6px] text-[14px]`}
										>
											{focusTrack ? 'Grid' : 'Focus'}
										</span>
									}
									overlayInnerStyle={TOOLTIP_OVERLAY_STYLE}
									overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
									getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
								>
									<span onClick={toggleViewMode} className="cursor-pointer">
										{focusTrack ? (
											<Icons.VoiceGridIcon
												className={`${isShowMember ? 'hover:text-black dark:hover:text-white text-[#535353] dark:text-[#B5BAC1]' : 'text-white hover:text-gray-200'}`}
											/>
										) : (
											<Icons.VoiceFocusIcon
												className={`${isShowMember ? 'hover:text-black dark:hover:text-white text-[#535353] dark:text-[#B5BAC1]' : 'text-white hover:text-gray-200'}`}
											/>
										)}
									</span>
								</Tooltip>
							</div>
						</div>
					</div>
					<div
						className={`absolute ${isShowMember ? 'bottom-0' : 'bottom-8'} left-0 w-full transition-opacity duration-300 ${
							isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
						}`}
					>
						<ControlBar
							isExternalCalling={isExternalCalling}
							onLeaveRoom={handleLeaveRoom}
							onFullScreen={onFullScreen}
							isShowMember={isShowMember}
						/>
					</div>
				</div>
			</LayoutContextProvider>
			<RoomAudioRenderer />
			{!propTracks && <ConnectionStateToast />}
		</div>
	);
}
