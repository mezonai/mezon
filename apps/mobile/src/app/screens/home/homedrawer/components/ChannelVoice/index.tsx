import { AudioSession, LiveKitRoom, TrackReference, useConnectionState, useLocalParticipant } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectChannelById2, selectIsPiPMode, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import { Room, Track, createLocalVideoTrack } from 'livekit-client';
import React, { memo, useEffect, useState } from 'react';
import { AppState, NativeModules, Platform, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import BluetoothManager from './BluetoothManager';
import RoomView from './RoomView';
import { style } from './styles';
const { CustomAudioModule, KeepAwake, KeepAwakeIOS } = NativeModules;

const ConnectionMonitor = () => {
	const connectionState = useConnectionState();

	useEffect(() => {
		if (connectionState === 'connected') {
			startAudioCall();
		}
	}, [connectionState]);

	useEffect(() => {
		return () => {
			stopAudioCall();
		};
	}, []);

	const startAudioCall = async () => {
		if (Platform.OS === 'android') {
			await AudioSession.configureAudio({
				android: {
					audioTypeOptions: {
						forceHandleAudioRouting: true
					}
				}
			});
			CustomAudioModule.setSpeaker(false, null);
		} else {
			await AudioSession.startAudioSession();
			await AudioSession.setAppleAudioConfiguration({
				audioCategoryOptions: ['allowBluetooth', 'allowBluetoothA2DP']
			});
			InCallManager.start({ media: 'audio' });
			await AudioSession.configureAudio({
				ios: {
					defaultOutput: 'earpiece'
				}
			});
			InCallManager.setSpeakerphoneOn(false);
			InCallManager.setForceSpeakerphoneOn(false);
		}
	};

	const stopAudioCall = async () => {
		InCallManager.stop();
		await AudioSession.stopAudioSession();
	};

	return <View />;
};

type headerProps = {
	channel: ChannelsEntity;
	onPressMinimizeRoom: () => void;
	onToggleSpeaker: () => void;
	isSpeakerOn: boolean;
};

const HeaderRoomView = memo(({ channel, onPressMinimizeRoom, onToggleSpeaker, isSpeakerOn }: headerProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { cameraTrack, isCameraEnabled, localParticipant } = useLocalParticipant();

	const handleSwitchCamera = async () => {
		try {
			if (cameraTrack && cameraTrack.track) {
				if (Platform.OS === 'ios') {
					const videoPublication = localParticipant.getTrackPublication(Track.Source.Camera);
					const videoTrack = videoPublication?.track;
					const facingModeCurrent = videoPublication.track?.mediaStreamTrack?.getSettings?.()?.facingMode;
					if (videoTrack) {
						await localParticipant.unpublishTrack(videoTrack);
					}
					const newFacingMode = facingModeCurrent === 'user' ? 'environment' : 'user';
					const devices = await Room.getLocalDevices('videoinput');
					const targetCamera = devices.find((d) => d?.facing === (newFacingMode === 'user' ? 'front' : 'environment'));
					const newTrack = await createLocalVideoTrack({
						deviceId: targetCamera.deviceId,
						facingMode: newFacingMode
					});
					await localParticipant.publishTrack(newTrack);
				} else {
					if (typeof cameraTrack?.track?.mediaStreamTrack?._switchCamera === 'function') {
						try {
							cameraTrack?.track?.mediaStreamTrack?._switchCamera();
						} catch (error) {
							console.error(error);
						}
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<View style={[styles.menuHeader]}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
				<TouchableOpacity onPress={onPressMinimizeRoom} style={styles.buttonCircle}>
					<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} />
				</TouchableOpacity>
				<Text numberOfLines={1} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
					{channel?.channel_label}
				</Text>
			</View>

			<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
				{isCameraEnabled && (
					<TouchableOpacity onPress={() => handleSwitchCamera()} style={[styles.buttonCircle]}>
						<MezonIconCDN icon={IconCDN.cameraFront} height={size.s_24} width={size.s_24} color={themeValue.white} />
					</TouchableOpacity>
				)}
				<TouchableOpacity onPress={() => onToggleSpeaker()} style={[styles.buttonCircle, isSpeakerOn && styles.buttonCircleActive]}>
					<MezonIconCDN
						icon={isSpeakerOn ? IconCDN.channelVoice : IconCDN.voiceLowIcon}
						height={size.s_17}
						width={isSpeakerOn ? size.s_17 : size.s_20}
						color={isSpeakerOn ? themeValue.border : themeValue.white}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
});

function ChannelVoice({
	channelId,
	clanId,
	token,
	serverUrl,
	onPressMinimizeRoom,
	isAnimationComplete
}: {
	channelId: string;
	clanId: string;
	onPressMinimizeRoom?: () => void;
	token: string;
	serverUrl: string;
	isAnimationComplete: boolean;
}) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { width, height } = useWindowDimensions();
	const channel = useAppSelector((state) => selectChannelById2(state, channelId));
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(false);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const dispatch = useAppDispatch();

	useEffect(() => {
		const activateKeepAwake = async (platform: string) => {
			try {
				if (platform === 'android') {
					await KeepAwake.activate();
				} else {
					await KeepAwakeIOS.activate();
				}
			} catch (error) {
				console.error(`Activate KeepAwake Error on ${platform}:`, error);
			}
		};

		const deactivateKeepAwake = async (platform: string) => {
			try {
				if (platform === 'android') {
					KeepAwake.deactivate();
				} else {
					KeepAwakeIOS.deactivate();
				}
			} catch (error) {
				console.error(`Deactivate KeepAwake Error on ${platform}:`, error);
			}
		};

		activateKeepAwake(Platform.OS);

		return () => {
			deactivateKeepAwake(Platform.OS);
		};
	}, []);

	const onToggleSpeaker = async (status = undefined) => {
		try {
			const newSpeakerState = status !== undefined ? status : !isSpeakerOn;
			if (Platform.OS === 'ios') {
				await AudioSession.configureAudio({
					ios: {
						defaultOutput: newSpeakerState ? 'speaker' : 'earpiece'
					}
				});
				InCallManager.setSpeakerphoneOn(newSpeakerState);
				InCallManager.setForceSpeakerphoneOn(newSpeakerState);
			} else {
				CustomAudioModule.setSpeaker(newSpeakerState, null);
			}

			setIsSpeakerOn(newSpeakerState);
		} catch (error) {
			console.error('Failed to toggle speaker:', error);
		}
	};

	useEffect(() => {
		const subscription = AppState.addEventListener('change', async (state) => {
			if (state === 'background') {
				if (Platform.OS === 'android') {
					NativeModules.PipModule.enablePipMode();
					dispatch(voiceActions.setPiPModeMobile(true));
				}
			} else {
				if (Platform.OS === 'android') {
					dispatch(voiceActions.setPiPModeMobile(false));
				}
			}
		});
		return () => {
			if (Platform.OS === 'android') {
				dispatch(voiceActions.setPiPModeMobile(false));
			}
			subscription.remove();
		};
	}, [dispatch]);

	useEffect(() => {
		if (Platform.OS === 'android') {
			try {
				checkPermissions();
				// Check initial state
				BluetoothManager.isBluetoothHeadsetConnected().then((connected) => {
					if (connected) toggleSpeakerByStatusBluetooth(connected);
				});

				// Listen for changes
				BluetoothManager.startListeningForConnectionChanges((connected) => {
					if (connected) toggleSpeakerByStatusBluetooth(connected);
				});
			} catch (error) {
				console.error('Error setting up Bluetooth:', error);
			}
		}
		// Cleanup
		return () => {
			if (Platform.OS === 'android') {
				BluetoothManager.stopListeningForConnectionChanges();
			}
		};
	}, []);

	const checkPermissions = async () => {
		try {
			const hasPermissions = await BluetoothManager.requestPermissions();
			if (hasPermissions) {
				await checkHeadsetStatus();
			}
		} catch (error) {
			console.error('Error checking permissions:', error);
		}
	};

	const checkHeadsetStatus = async () => {
		try {
			const connected = await BluetoothManager.isBluetoothHeadsetConnected();
			if (connected) toggleSpeakerByStatusBluetooth(connected);
		} catch (error) {
			console.error('Error checking headset status:', error);
		}
	};

	const toggleSpeakerByStatusBluetooth = async (connected: boolean) => {
		if (connected) {
			await onToggleSpeaker(false);
		} else {
			await onToggleSpeaker(true);
		}
	};

	return (
		<View>
			<StatusBarHeight />
			<View
				style={{
					width: isAnimationComplete ? width : size.s_100 * 2,
					height: isAnimationComplete ? height : size.s_150,
					backgroundColor: themeValue?.primary
				}}
			>
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					{isAnimationComplete && !focusedScreenShare && !isPiPMode && (
						<HeaderRoomView
							channel={channel}
							isSpeakerOn={isSpeakerOn}
							onPressMinimizeRoom={onPressMinimizeRoom}
							onToggleSpeaker={onToggleSpeaker}
						/>
					)}
					<ConnectionMonitor />
					<RoomView
						channelId={channelId}
						clanId={clanId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isAnimationComplete={isAnimationComplete}
						onFocusedScreenChange={setFocusedScreenShare}
					/>
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
