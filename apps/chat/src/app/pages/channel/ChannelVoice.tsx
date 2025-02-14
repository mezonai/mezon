import {
	CarouselLayout,
	ConnectionStateToast,
	ControlBarControls,
	DisconnectButton,
	FocusLayout,
	FocusLayoutContainer,
	GridLayout,
	isTrackReference,
	LayoutContextProvider,
	LeaveIcon,
	LiveKitRoom,
	MediaDeviceMenu,
	ParticipantTile,
	RoomAudioRenderer,
	TrackToggle,
	useConnectionState,
	useCreateLayoutContext,
	useLocalParticipantPermissions,
	usePersistentUserChoices,
	usePinnedTracks,
	useRoomContext,
	useTracks
} from '@livekit/components-react';

import '@livekit/components-styles';
import { useAuth } from '@mezon/core';
import {
	ChannelsEntity,
	generateMeetToken,
	handleParticipantMeetState,
	selectCurrentChannel,
	selectCurrentClan,
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectVoiceChannelMembersByChannelId,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { ParticipantMeetState } from '@mezon/utils';

import { Icons } from '@mezon/ui';
import { ConnectionState, Participant, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { ChannelType } from 'mezon-js';
import Tooltip from 'rc-tooltip';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { UserListStreamChannel } from './ChannelStream';

const ChannelVoice = () => {
	const [token, setToken] = useState('');
	const isJoined = useSelector(selectVoiceJoined);
	const voiceInfo = useSelector(selectVoiceInfo);
	const [loading, setLoading] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const showMicrophone = useSelector(selectShowMicrophone);
	const showCamera = useSelector(selectShowCamera);
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const currentChannel = useSelector(selectCurrentChannel);
	const isChannelMezonVoice = currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const containerRef = useRef<HTMLDivElement | null>(null);

	const participantMeetState = async (state: ParticipantMeetState, clanId?: string, channelId?: string): Promise<void> => {
		if (!clanId || !channelId || !userProfile?.user?.id) return;

		await dispatch(
			handleParticipantMeetState({
				clan_id: clanId,
				channel_id: channelId,
				user_id: userProfile.user.id,
				display_name: userProfile.user.display_name,
				state
			})
		);
	};

	const handleJoinRoom = async () => {
		if (!currentClan || !currentChannel?.meeting_code) return;
		setLoading(true);

		try {
			const result = await dispatch(
				generateMeetToken({
					channelId: currentChannel?.channel_id as string,
					roomName: currentChannel?.meeting_code
				})
			).unwrap();

			if (result) {
				if (isJoined && voiceInfo) {
					handleLeaveRoom();
				}
				await participantMeetState(ParticipantMeetState.JOIN, currentChannel?.clan_id as string, currentChannel?.channel_id as string);
				dispatch(voiceActions.setJoined(true));
				setToken(result);
				dispatch(
					voiceActions.setVoiceInfo({
						clanId: currentClan?.clan_id as string,
						clanName: currentClan?.clan_name as string,
						channelId: currentChannel?.channel_id as string,
						channelLabel: currentChannel?.channel_label as string
					})
				);
			} else {
				setToken('');
			}
		} catch (err) {
			console.error('Failed to generate token room:', err);
			setToken('');
		} finally {
			setLoading(false);
		}
	};

	const handleLeaveRoom = useCallback(async () => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		setToken('');
		dispatch(voiceActions.resetVoiceSettings());
		await participantMeetState(ParticipantMeetState.LEAVE, voiceInfo.clanId, voiceInfo.channelId);
	}, [dispatch, voiceInfo]);

	const handleFullScreen = useCallback(() => {
		if (!containerRef.current) return;

		if (!document.fullscreenElement) {
			containerRef.current
				.requestFullscreen()
				.then(() => dispatch(voiceActions.setFullScreen(true)))
				.catch((err) => {
					console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
				});
		} else {
			document.exitFullscreen().then(() => dispatch(voiceActions.setFullScreen(false)));
		}
	}, [dispatch]);

	const handleScreenShare = useCallback(
		(enabled: boolean) => {
			if (enabled) {
				dispatch(voiceActions.setFullScreen(false));
			}
			dispatch(voiceActions.setShowScreen(enabled));
		},
		[dispatch]
	);

	if (!isChannelMezonVoice) return null;

	const isShow = isJoined && voiceInfo?.clanId === currentChannel?.clan_id && voiceInfo?.channelId === currentChannel?.channel_id;

	return (
		<div
			className={`h-full ${!isChannelMezonVoice ? 'hidden' : ''} absolute bottom-0 right-0 z-30`}
			style={{ width: 'calc(100% - 72px - 272px)' }}
		>
			{token === '' || !serverUrl ? (
				<PreJoinChannelVoice
					channel={currentChannel || undefined}
					roomName={currentChannel?.meeting_code}
					loading={loading}
					handleJoinRoom={handleJoinRoom}
				/>
			) : (
				<>
					<PreJoinChannelVoice
						channel={currentChannel || undefined}
						roomName={currentChannel?.meeting_code}
						loading={loading}
						handleJoinRoom={handleJoinRoom}
						isCurrentChannel={isShow}
					/>
					<LiveKitRoom
						ref={containerRef}
						id="livekitRoom"
						key={token}
						className={`${!isShow ? 'hidden' : ''} ${isVoiceFullScreen ? '!fixed !inset-0 !z-50 !w-screen !h-screen' : ''}`}
						audio={showMicrophone}
						video={showCamera}
						token={token}
						serverUrl={serverUrl}
						data-lk-theme="default"
					>
						<MyVideoConference onLeaveRoom={handleLeaveRoom} onFullScreen={handleFullScreen} onScreenShare={handleScreenShare} />
					</LiveKitRoom>
				</>
			)}
		</div>
	);
};

export default ChannelVoice;

interface PreJoinChannelVoiceProps {
	channel?: ChannelsEntity;
	roomName?: string;
	loading: boolean;
	handleJoinRoom: () => void;
	isCurrentChannel?: boolean;
}

const PreJoinChannelVoice: React.FC<PreJoinChannelVoiceProps> = ({ channel, roomName, loading, handleJoinRoom, isCurrentChannel }) => {
	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channel?.channel_id as string));
	return (
		<div className={`w-full h-full bg-black flex justify-center items-center ${isCurrentChannel ? 'hidden' : ''}`}>
			<div className="flex flex-col justify-center items-center gap-4 w-full text-white">
				<div className="w-full flex gap-2 justify-center p-2">
					{voiceChannelMembers.length > 0 && <UserListStreamChannel memberJoin={voiceChannelMembers} memberMax={3}></UserListStreamChannel>}
				</div>
				<div className="max-w-[350px] text-center text-3xl font-bold">
					{channel?.channel_label && channel?.channel_label.length > 20
						? `${channel?.channel_label.substring(0, 20)}...`
						: channel?.channel_label}
				</div>
				{voiceChannelMembers.length > 0 ? <div>Everyone is waiting for you inside</div> : <div>No one is currently in voice</div>}
				<button
					disabled={!roomName}
					className={`bg-green-700 rounded-3xl p-2 ${roomName ? 'hover:bg-green-600' : 'opacity-50'}`}
					onClick={handleJoinRoom}
				>
					{loading ? 'Joining...' : 'Join Voice'}
				</button>
			</div>
		</div>
	);
};

interface MyVideoConferenceProps {
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onScreenShare: (enabled: boolean) => void;
}

function MyVideoConference({ onLeaveRoom, onFullScreen, onScreenShare }: MyVideoConferenceProps) {
	const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false }
		],
		{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
	);

	const layoutContext = useCreateLayoutContext();

	const screenShareTracks = tracks.filter(isTrackReference).filter((track) => track.publication.source === Track.Source.ScreenShare);

	const focusTrack = usePinnedTracks(layoutContext)?.[0];
	const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

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
	}, [
		screenShareTracks.map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`).join(),
		focusTrack?.publication?.trackSid,
		tracks
	]);

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

interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
	onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
	variation?: 'minimal' | 'verbose' | 'textOnly';
	controls?: ControlBarControls;
	saveUserChoices?: boolean;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onScreenShare: (enabled: boolean) => void;
}

function ControlBar({ variation, controls, saveUserChoices = true, onDeviceError, onLeaveRoom, onFullScreen, onScreenShare }: ControlBarProps) {
	const dispatch = useAppDispatch();
	const isTooLittleSpace = useMediaQuery('max-width: 760px');

	const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose';
	variation ??= defaultVariation;

	const visibleControls = { leave: true, ...controls };

	const showScreen = useSelector(selectShowScreen);

	const isFullScreen = useSelector(selectVoiceFullScreen);

	const localPermissions = useLocalParticipantPermissions();

	if (!localPermissions) {
		visibleControls.camera = false;
		visibleControls.microphone = false;
		visibleControls.screenShare = false;
	} else {
		visibleControls.camera ??= localPermissions.canPublish;
		visibleControls.microphone ??= localPermissions.canPublish;
		visibleControls.screenShare ??= localPermissions.canPublish;
	}

	const showIcon = useMemo(() => variation === 'minimal' || variation === 'verbose', [variation]);
	const showText = useMemo(() => variation === 'textOnly' || variation === 'verbose', [variation]);

	const browserSupportsScreenSharing = supportsScreenSharing();

	const { saveAudioInputDeviceId, saveVideoInputDeviceId } = usePersistentUserChoices({
		preventSave: !saveUserChoices
	});

	const microphoneOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => isUserInitiated ?? dispatch(voiceActions.setShowMicrophone(enabled)),
		[dispatch]
	);

	const cameraOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => isUserInitiated ?? dispatch(voiceActions.setShowCamera(enabled)),
		[dispatch]
	);

	return (
		<div className="lk-control-bar relative">
			{visibleControls.microphone && (
				<div className="lk-button-group">
					<TrackToggle
						source={Track.Source.Microphone}
						showIcon={showIcon}
						onChange={microphoneOnChange}
						onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
					>
						{showText && 'Microphone'}
					</TrackToggle>
					<div className="lk-button-group-menu">
						<MediaDeviceMenu
							kind="audioinput"
							onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				</div>
			)}
			{visibleControls.camera && (
				<div className="lk-button-group">
					<TrackToggle
						source={Track.Source.Camera}
						showIcon={showIcon}
						onChange={cameraOnChange}
						onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
					>
						{showText && 'Camera'}
					</TrackToggle>
					<div className="lk-button-group-menu">
						<MediaDeviceMenu
							kind="videoinput"
							onActiveDeviceChange={(_kind, deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				</div>
			)}
			{visibleControls.screenShare && browserSupportsScreenSharing && (
				<TrackToggle
					source={Track.Source.ScreenShare}
					captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
					showIcon={showIcon}
					onChange={onScreenShare}
					onDeviceError={(error) => onDeviceError?.({ source: Track.Source.ScreenShare, error })}
				>
					{showText && (showScreen ? 'Stop screen share' : 'Share screen')}
				</TrackToggle>
			)}
			{visibleControls.leave && (
				<DisconnectButton onClick={onLeaveRoom}>
					{showIcon && <LeaveIcon />}
					{showText && 'Leave'}
				</DisconnectButton>
			)}
			<div onClick={onFullScreen} className="absolute bottom-6 !right-6">
				{isFullScreen ? (
					<Tooltip
						placement="topRight"
						overlay={<span className="bg-[#2B2B2B] p-2 rounded text-[16px] absolute bottom-[5px] -right-[16px]">Exit Full Screen</span>}
						overlayClassName="whitespace-nowrap z-50"
						getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
					>
						<span>
							<Icons.ExitFullScreen />
						</span>
					</Tooltip>
				) : (
					<Tooltip
						placement="topRight"
						overlay={<span className="bg-[#2B2B2B] p-2 rounded text-[16px] absolute bottom-[5px] -right-[16px]">Full Screen</span>}
						overlayClassName="whitespace-nowrap"
						key={Number(isFullScreen)}
					>
						<span>
							<Icons.FullScreen />
						</span>
					</Tooltip>
				)}
			</div>
		</div>
	);
}

function useMediaQuery(query: string): boolean {
	const getMatches = (query: string): boolean => {
		// Prevents SSR issues
		if (typeof window !== 'undefined') {
			return window.matchMedia(query).matches;
		}
		return false;
	};

	const [matches, setMatches] = React.useState<boolean>(getMatches(query));

	function handleChange() {
		setMatches(getMatches(query));
	}

	useEffect(() => {
		const matchMedia = window.matchMedia(query);

		// Triggered at the first client-side load and if query changes
		handleChange();

		// Listen matchMedia
		if (matchMedia.addListener) {
			matchMedia.addListener(handleChange);
		} else {
			matchMedia.addEventListener('change', handleChange);
		}

		return () => {
			if (matchMedia.removeListener) {
				matchMedia.removeListener(handleChange);
			} else {
				matchMedia.removeEventListener('change', handleChange);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	return matches;
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

function supportsScreenSharing(): boolean {
	return typeof navigator !== 'undefined' && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
}
