import { TrackReference, VideoTrack, useLocalParticipant, useParticipants, useRoomContext, useTracks } from '@livekit/react-native';
import { ScreenCapturePickerView } from '@livekit/react-native-webrtc';
import {
	ActionEmitEvent,
	Icons,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	getUpdateOrAddClanChannelCache,
	jumpToChannel,
	load,
	save
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { clansActions, selectIsPiPMode, selectVoiceInfo, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { Track, createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Dimensions, NativeModules, Platform, TouchableOpacity, View, findNodeHandle } from 'react-native';
import { ResumableZoom } from 'react-native-zoom-toolkit';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import FocusedScreenPopup from '../FocusedScreenPopup';
import ParticipantScreen from '../ParticipantScreen';
import { style } from '../styles';

const RoomView = ({
	isAnimationComplete,
	onPressMinimizeRoom,
	channelId,
	clanId,
	onFocusedScreenChange
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	onFocusedScreenChange: (track: TrackReference | null) => void;
}) => {
	const marginWidth = Dimensions.get('screen').width;
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const room = useRoomContext();
	const participants = useParticipants();
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant();
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const screenCaptureRef = React.useRef(null);

	useEffect(() => {
		if (localParticipant) {
			loadLocalDefaults();
		}
	}, [localParticipant]);

	const loadLocalDefaults = async () => {
		await localParticipant.setCameraEnabled(false);
		await localParticipant.setMicrophoneEnabled(false);
	};

	const sortedParticipants = [...participants].sort((a, b) => (b.isScreenShareEnabled ? 1 : 0) - (a.isScreenShareEnabled ? 1 : 0));

	const handleToggleCamera = useCallback(async () => {
		try {
			if (isCameraEnabled) {
				await localParticipant.setCameraEnabled(false);
			} else {
				try {
					await localParticipant.setCameraEnabled(true);
				} catch (enablederror) {
					try {
						const newVideoTrack = await createLocalVideoTrack();
						const oldPublication = Array.from(localParticipant.videoTrackPublications.values()).find(
							(publication) => publication.source === Track.Source.Camera
						);
						if (oldPublication && oldPublication.track) {
							await localParticipant.unpublishTrack(oldPublication.track, true);
						}
						await localParticipant.publishTrack(newVideoTrack);
					} catch (newError) {
						console.error('err:', newError);
					}
				}
			}
		} catch (error) {
			console.error('Error toggling camera:', error);
		}
	}, [isCameraEnabled, localParticipant]);

	const handleToggleMicrophone = useCallback(async () => {
		try {
			if (isMicrophoneEnabled) {
				await localParticipant.setMicrophoneEnabled(false);
			} else {
				try {
					await localParticipant.setMicrophoneEnabled(true);
				} catch (enableError) {
					try {
						const newAudioTrack = await createLocalAudioTrack();

						const oldAudioPublication = Array.from(localParticipant.audioTrackPublications.values()).find(
							(publication) => publication.source === Track.Source.Microphone
						);
						if (oldAudioPublication && oldAudioPublication.track) {
							await localParticipant.unpublishTrack(oldAudioPublication.track, true);
						}
						await localParticipant.publishTrack(newAudioTrack);
					} catch (newError) {
						console.error('err: ', newError);
					}
				}
			}
		} catch (error) {
			console.error('Error toggling microphone:', error);
		}
	}, [isMicrophoneEnabled, localParticipant]);

	const startBroadcastIOS = async () => {
		const reactTag = findNodeHandle(screenCaptureRef.current);
		await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
		await localParticipant.setScreenShareEnabled(true);
	};

	const handleToggleScreenShare = useCallback(async () => {
		try {
			if (Platform.OS === 'ios') {
				await startBroadcastIOS();
			} else {
				await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
			}
		} catch (error) {
			console.error('Error toggling screen share:', error);
		}
	}, [isScreenShareEnabled, localParticipant]);

	const handleEndCall = useCallback(() => {
		room.disconnect();
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, { isEndCall: true, clanId: voiceInfo?.clanId, channelId: voiceInfo?.channelId });
	}, [room, voiceInfo?.channelId, voiceInfo?.clanId]);

	const handleShowChat = () => {
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
		}
		joinChannel();
		onPressMinimizeRoom();
	};

	useEffect(() => {
		if (focusedScreenShare) {
			const focusedParticipant = sortedParticipants.find((p) => p.identity === focusedScreenShare?.participant?.identity);

			if (!focusedParticipant?.isScreenShareEnabled) {
				setFocusedScreenShare(null);
			}
		}
	}, [sortedParticipants, focusedScreenShare]);

	const joinChannel = async () => {
		const clanIdCache = load(STORAGE_CLAN_ID);
		if (clanIdCache !== clanId) {
			const joinAndChangeClan = async (clanId: string) => {
				await Promise.all([
					dispatch(clansActions.joinClan({ clanId: clanId })),
					dispatch(clansActions.changeCurrentClan({ clanId: clanId, noCache: true }))
				]);
			};
			await joinAndChangeClan(clanId);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		save(STORAGE_CLAN_ID, clanId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, clanId);
	};

	useEffect(() => {
		onFocusedScreenChange(focusedScreenShare);
	}, [focusedScreenShare, onFocusedScreenChange]);

	const RenderControlBar = () => {
		return (
			<View style={[styles.menuFooter, { bottom: Platform.OS === 'ios' || isTabletLandscape ? size.s_100 : size.s_70 }]}>
				<View style={{ gap: size.s_16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: size.s_6 }}>
					<TouchableOpacity onPress={handleToggleCamera} style={styles.menuIcon}>
						{isCameraEnabled ? <MezonIconCDN icon={IconCDN.videoIcon} /> : <MezonIconCDN icon={IconCDN.videoSlashIcon} />}
					</TouchableOpacity>
					<TouchableOpacity onPress={handleToggleMicrophone} style={styles.menuIcon}>
						{isMicrophoneEnabled ? <MezonIconCDN icon={IconCDN.microphoneIcon} /> : <MezonIconCDN icon={IconCDN.microphoneSlashIcon} />}
					</TouchableOpacity>
					<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
						<MezonIconCDN icon={IconCDN.chatIcon} />
					</TouchableOpacity>
					<TouchableOpacity onPress={handleToggleScreenShare} style={styles.menuIcon}>
						{isScreenShareEnabled ? <Icons.ShareScreenIcon /> : <Icons.ShareScreenSlashIcon />}
					</TouchableOpacity>
					<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
						<MezonIconCDN icon={IconCDN.phoneCallIcon} />
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	if (focusedScreenShare) {
		return (
			<View
				style={
					isPiPMode
						? { width: '100%', flex: 1, alignItems: 'flex-start' }
						: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }
				}
			>
				<View style={{ height: (isPiPMode ? 2 : 3) * size.s_100, width: '100%' }}>
					<ResumableZoom>
						<View style={{ height: (isPiPMode ? 2 : 3) * size.s_100, width: marginWidth }}>
							<VideoTrack
								trackRef={focusedScreenShare}
								objectFit={isPiPMode ? 'cover' : 'contain'}
								style={{ height: (isPiPMode ? 2 : 3) * size.s_100, width: '100%' }}
							/>
						</View>
					</ResumableZoom>
				</View>
				{!isPiPMode && (
					<TouchableOpacity style={styles.focusIcon} onPress={() => setFocusedScreenShare(null)}>
						<Icons.ArrowShrinkIcon height={size.s_16} />
					</TouchableOpacity>
				)}
				{!isPiPMode && <RenderControlBar />}
			</View>
		);
	}
	const screenCapturePickerView = Platform.OS === 'ios' && <ScreenCapturePickerView ref={screenCaptureRef} />;

	return (
		<View style={[styles.roomViewContainer, isPiPMode && styles.roomViewContainerPiP]}>
			{!isAnimationComplete ? (
				<FocusedScreenPopup sortedParticipants={sortedParticipants} tracks={tracks} localParticipant={localParticipant} />
			) : (
				<ParticipantScreen
					sortedParticipants={sortedParticipants}
					tracks={tracks}
					isFocusedScreen={focusedScreenShare}
					setFocusedScreenShare={setFocusedScreenShare}
				/>
			)}
			{isAnimationComplete && <RenderControlBar />}
			{screenCapturePickerView}
		</View>
	);
};

export default React.memo(RoomView);
