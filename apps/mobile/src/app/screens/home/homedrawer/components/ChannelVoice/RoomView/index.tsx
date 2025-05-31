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
import { ThemeModeBase, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	clansActions,
	groupCallActions,
	selectIsPiPMode,
	selectIsShowPreCallInterface,
	selectVoiceInfo,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Track, createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Dimensions, NativeModules, Platform, Text, TouchableOpacity, View, findNodeHandle } from 'react-native';
import Toast from 'react-native-toast-message';
import { ResumableZoom } from 'react-native-zoom-toolkit';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../../assets/lottie';
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
	onFocusedScreenChange,
	isGroupCall = false,
	participantsCount = 0,
	onQuitGroupCall,
	onCancelCall
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	onFocusedScreenChange: (track: TrackReference | null) => void;
	isGroupCall?: boolean;
	participantsCount?: number;
	onQuitGroupCall?: () => void;
	onCancelCall?: () => void;
}) => {
	const marginWidth = Dimensions.get('screen').width;
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
	const dispatch = useAppDispatch();
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const room = useRoomContext();
	const participants = useParticipants();
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant();
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isHiddenControl, setIsHiddenControl] = useState<boolean>(false);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const screenCaptureRef = React.useRef(null);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);

	useEffect(() => {
		const subscription = focusedScreenShare
			? Dimensions.addEventListener('change', () => {
					setIsHiddenControl((prevState) => !prevState);
				})
			: null;

		return () => subscription?.remove();
	}, [focusedScreenShare]);

	useEffect(() => {
		if (localParticipant) {
			loadLocalDefaults();
		}
	}, [localParticipant]);

	useEffect(() => {
		if (participants?.length > 1 && isShowPreCallInterface) {
			dispatch(groupCallActions?.hidePreCallInterface());
		}
	}, [dispatch, isShowPreCallInterface, participants?.length]);

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
					await localParticipant.setCameraEnabled(true, {
						facingMode: 'user'
					});
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
					console.error('Error enabling microphone:', enableError);
					let newAudioTrack;

					try {
						newAudioTrack = await createLocalAudioTrack();
					} catch (createError) {
						console.error('Error enabling microphone:', createError);
						Sentry.captureException('ToogleMicMezonMeet', { extra: { createError } });
						try {
							const devices = await navigator.mediaDevices.enumerateDevices();
							const audioInputDevices = devices?.filter((device) => device?.kind === 'audioinput');
							if (audioInputDevices?.length === 0) {
								Toast.show({
									type: 'error',
									text1: 'No audio input devices found'
								});
								return;
							}
							newAudioTrack = await createLocalAudioTrack({
								deviceId: { exact: audioInputDevices?.[0]?.deviceId }
							});
						} catch (deviceError) {
							console.error('Error creating audio track with device:', deviceError);
							Toast.show({
								type: 'error',
								text1: `Error creating audio device: ${deviceError}`
							});
						}
					}

					try {
						const oldAudioPublication = Array.from(localParticipant.audioTrackPublications.values()).find(
							(publication) => publication.source === Track.Source.Microphone
						);
						if (oldAudioPublication && oldAudioPublication.track) {
							await localParticipant.unpublishTrack(oldAudioPublication.track, true);
						}
					} catch (unpublicError) {
						console.error('error unpublic old track: ', unpublicError);
					}

					try {
						await localParticipant.publishTrack(newAudioTrack);
					} catch (publishError) {
						console.error('Error publish audio track:', publishError);
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
		if (isGroupCall) {
			if (isShowPreCallInterface) {
				onCancelCall?.();
			} else {
				onQuitGroupCall?.();
			}
		}
		room.disconnect();
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, { isEndCall: true, clanId: voiceInfo?.clanId, channelId: voiceInfo?.channelId });
	}, [isGroupCall, isShowPreCallInterface, onCancelCall, onQuitGroupCall, room, voiceInfo?.channelId, voiceInfo?.clanId]);

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
			<View style={[styles.menuFooter, { bottom: Platform.OS === 'ios' || isTabletLandscape ? size.s_150 : size.s_20, zIndex: 2 }]}>
				<View style={{ gap: size.s_10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: size.s_6 }}>
					<TouchableOpacity onPress={handleToggleCamera} style={styles.menuIcon}>
						{isCameraEnabled ? <MezonIconCDN icon={IconCDN.videoIcon} /> : <MezonIconCDN icon={IconCDN.videoSlashIcon} />}
					</TouchableOpacity>
					<TouchableOpacity onPress={handleToggleMicrophone} style={styles.menuIcon}>
						{isMicrophoneEnabled ? <MezonIconCDN icon={IconCDN.microphoneIcon} /> : <MezonIconCDN icon={IconCDN.microphoneSlashIcon} />}
					</TouchableOpacity>
					{!isGroupCall && (
						<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
							<MezonIconCDN icon={IconCDN.chatIcon} />
						</TouchableOpacity>
					)}
					{!isGroupCall && (
						<TouchableOpacity onPress={handleToggleScreenShare} style={styles.menuIcon}>
							{isScreenShareEnabled ? <Icons.ShareScreenIcon /> : <Icons.ShareScreenSlashIcon />}
						</TouchableOpacity>
					)}
					<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
						<MezonIconCDN icon={IconCDN.phoneCallIcon} />
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	if (focusedScreenShare) {
		return (
			<View style={isPiPMode ? { width: '100%', flex: 1, alignItems: 'flex-start' } : { width: '100%', flex: 1, alignItems: 'center' }}>
				<View style={{ height: isPiPMode ? 2 * 100 : '100%', width: '100%' }}>
					<ResumableZoom onTap={() => setIsHiddenControl((prevState) => !prevState)}>
						<View style={{ height: isPiPMode ? 2 * 100 : '100%', width: marginWidth }}>
							<VideoTrack
								trackRef={focusedScreenShare}
								objectFit={isPiPMode ? 'cover' : 'contain'}
								style={{ height: isPiPMode ? 2 * 100 : '100%', width: '100%' }}
							/>
						</View>
					</ResumableZoom>
				</View>
				{!isPiPMode && (
					<TouchableOpacity style={styles.focusIcon} onPress={() => setFocusedScreenShare(null)}>
						<Icons.ArrowShrinkIcon height={size.s_16} />
					</TouchableOpacity>
				)}
				{isPiPMode || isHiddenControl ? <View /> : <RenderControlBar />}
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
			{isAnimationComplete && isGroupCall && participants.length <= 1 && isShowPreCallInterface && (
				<View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: size.s_100 * 2 }}>
					<LottieView
						source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE}
						autoPlay
						loop
						style={{ width: size.s_60, height: size.s_60 }}
					/>
					<Text style={styles.text}>{`${participantsCount} members will be notified`}</Text>
				</View>
			)}
			{isAnimationComplete && <RenderControlBar />}
			{screenCapturePickerView}
		</View>
	);
};

export default React.memo(RoomView);
