import { AudioSession, LiveKitRoom, TrackReference, useConnectionState, useLocalParticipant } from '@livekit/react-native';
import { CallSignalingData } from '@mezon/components';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	getStore,
	groupCallActions,
	messagesActions,
	selectAllAccount,
	selectChannelById2,
	selectCurrentDM,
	selectIsPiPMode,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store-mobile';
import { IMessageTypeCallLog, WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { Room, Track, createLocalVideoTrack } from 'livekit-client';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, DeviceEventEmitter, NativeModules, Platform, Text, TouchableOpacity, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { PERMISSIONS, request } from 'react-native-permissions';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { useSendSignaling } from '../../../../../components/CallingGroupModal';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { EMessageBSToShow } from '../../enums';
import AudioOutputTooltip from '../AudioOutputTooltip';
import { ContainerMessageActionModal } from '../MessageItemBS/ContainerMessageActionModal';
import { CallReactionHandler } from './CallReactionHandler';
import RoomView from './RoomView';
import { style } from './styles';

const { CustomAudioModule, KeepAwake, KeepAwakeIOS, AudioSessionModule } = NativeModules;

// Audio output types
export type AudioOutput = {
	id: string;
	name: string;
	type: 'speaker' | 'earpiece' | 'bluetooth' | 'headphones' | 'default' | 'force_speaker';
};

const ConnectionMonitor = memo(() => {
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
			await CustomAudioModule.getAudioStatus((err, audioRoute) => {
				if (err) {
					console.error('error get init audio status:', err);
				} else {
					if (audioRoute === 'speaker') {
						return;
					} else {
						CustomAudioModule.setSpeaker(false, null);
					}
				}
			});
		} else {
			await AudioSession.startAudioSession();
			await AudioSession.setAppleAudioConfiguration({
				audioCategoryOptions: ['allowBluetooth', 'allowBluetoothA2DP', 'allowAirPlay', 'mixWithOthers']
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
		if (Platform.OS === 'android') {
			CustomAudioModule.setSpeaker(false, null);
		}
		InCallManager.stop();
		await AudioSession.stopAudioSession();
	};

	return <View />;
});

type headerProps = {
	channel: ChannelsEntity;
	onOpenTooltip: () => void;
	onPressMinimizeRoom: () => void;
	switchAudioOutput: (outputType: string) => void;
	isFromNativeCall: boolean;
	isGroupCall?: boolean;
	availableAudioOutputs: AudioOutput[];
	currentAudioOutput: string;
};

const HeaderRoomView = memo(
	({
		channel,
		onPressMinimizeRoom,
		switchAudioOutput,
		isFromNativeCall = false,
		isGroupCall = false,
		availableAudioOutputs,
		currentAudioOutput,
		onOpenTooltip
	}: headerProps) => {
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
						const targetCamera = devices.find((d: any) => d?.facing === (newFacingMode === 'user' ? 'front' : 'environment'));
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

		const handleOpenEmojiPicker = () => {
			const data = {
				snapPoints: ['45%', '75%'],
				children: (
					<ContainerMessageActionModal
						message={undefined}
						mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
						type={EMessageBSToShow.MessageAction}
						senderDisplayName={''}
						isOnlyEmojiPicker={true}
						channelId={channel?.channel_id}
						clanId={channel?.clan_id}
					/>
				),
				containerStyle: { zIndex: 1001 },
				backdropStyle: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		};

		return (
			<View style={[styles.menuHeader]}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
					{!isFromNativeCall && (
						<TouchableOpacity onPress={onPressMinimizeRoom} style={styles.buttonCircle}>
							<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} />
						</TouchableOpacity>
					)}
					<Text numberOfLines={1} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
						{channel?.channel_label}
					</Text>
				</View>

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
					{!isGroupCall && (
						<TouchableOpacity onPress={handleOpenEmojiPicker} style={[styles.buttonCircle]}>
							<MezonIconCDN icon={IconCDN.reactionIcon} height={size.s_24} width={size.s_24} color={themeValue.white} />
						</TouchableOpacity>
					)}
					{isCameraEnabled && (
						<TouchableOpacity onPress={() => handleSwitchCamera()} style={[styles.buttonCircle]}>
							<MezonIconCDN icon={IconCDN.cameraFront} height={size.s_24} width={size.s_24} color={themeValue.white} />
						</TouchableOpacity>
					)}
					<AudioOutputTooltip
						onSelectOutput={switchAudioOutput}
						availableAudioOutputs={availableAudioOutputs}
						currentOutput={currentAudioOutput}
						currentAudioOutput={currentAudioOutput}
						onOpenTooltip={onOpenTooltip}
					/>
				</View>
			</View>
		);
	}
);

function ChannelVoice({
	channelId,
	clanId,
	token,
	serverUrl,
	onPressMinimizeRoom,
	isAnimationComplete,
	isGroupCall = false,
	participantsCount = 0,
	isFromNativeCall = false
}: {
	channelId: string;
	clanId: string;
	onPressMinimizeRoom?: () => void;
	token: string;
	serverUrl: string;
	isAnimationComplete: boolean;
	isGroupCall?: boolean;
	participantsCount?: number;
	isFromNativeCall?: boolean;
}) {
	const { themeValue } = useTheme();
	const channel = useAppSelector((state) => selectChannelById2(state, channelId));
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [availableAudioOutputs, setAvailableAudioOutputs] = useState<AudioOutput[]>([]);
	const [currentAudioOutput, setCurrentAudioOutput] = useState<string>('earpiece');
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const dispatch = useAppDispatch();
	const isRequestingPermission = useRef(false);

	const { sendSignalingToParticipants } = useSendSignaling();

	// Get available audio outputs
	const getAvailableAudioOutputs = useCallback(async (isHaveBluetooth?: boolean): Promise<AudioOutput[]> => {
		try {
			const outputs: AudioOutput[] = [
				{ id: 'earpiece', name: 'Earpiece', type: 'earpiece' },
				{ id: 'speaker', name: 'Speaker', type: 'speaker' }
			];
			if (isHaveBluetooth) {
				outputs.push({ id: 'bluetooth', name: 'Bluetooth', type: 'bluetooth' });
			}

			return outputs;
		} catch (error) {
			console.error('Error getting available audio outputs:', error);
			return [
				{ id: 'earpiece', name: 'Earpiece', type: 'earpiece' },
				{ id: 'speaker', name: 'Speaker', type: 'speaker' }
			];
		}
	}, []);

	// Switch audio output
	const switchAudioOutput = useCallback(async (outputType: string) => {
		try {
			if (Platform.OS === 'android' && AudioSessionModule) {
				await AudioSessionModule.setAudioDevice(outputType);
				setCurrentAudioOutput(outputType);
			} else if (Platform.OS === 'ios') {
				// Use existing iOS logic
				const newSpeakerState = outputType === 'speaker';
				await AudioSession.configureAudio({
					ios: {
						defaultOutput: newSpeakerState ? 'speaker' : 'earpiece'
					}
				});
				InCallManager.setSpeakerphoneOn(newSpeakerState);
				InCallManager.setForceSpeakerphoneOn(newSpeakerState);
				setCurrentAudioOutput(outputType);
			}
		} catch (error) {
			console.error('Error switching audio output:', error);
		}
	}, []);

	// Setup audio detection and event listeners
	const setupAudioDetection = useCallback(async () => {
		try {
			if (Platform.OS === 'android' && AudioSessionModule) {
				await AudioSessionModule.startAudioSession();
				const bluetoothConnected = await AudioSessionModule.isBluetoothConnected();
				const outputs = await getAvailableAudioOutputs(bluetoothConnected);
				setAvailableAudioOutputs(outputs);
				if (bluetoothConnected) {
					await switchAudioOutput('bluetooth');
				} else {
					const currentOutput = await AudioSessionModule.getCurrentAudioOutput();
					setCurrentAudioOutput(currentOutput);
				}
			} else {
				const outputs = await getAvailableAudioOutputs();
				setAvailableAudioOutputs(outputs);
			}
		} catch (error) {
			console.error('Error setting up audio detection:', error);
		}
	}, [getAvailableAudioOutputs, switchAudioOutput]);

	const onOpenTooltip = useCallback(async () => {
		if (Platform.OS === 'android' && AudioSessionModule) {
			const bluetoothConnected = await AudioSessionModule.isBluetoothConnected();
			getAvailableAudioOutputs(bluetoothConnected).then(setAvailableAudioOutputs);
		} else {
			getAvailableAudioOutputs().then(setAvailableAudioOutputs);
		}
	}, [getAvailableAudioOutputs]);

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

	useEffect(() => {
		const subscription = AppState.addEventListener('change', async (state) => {
			if (isRequestingPermission?.current || Platform.OS === 'ios') {
				return;
			}
			if (state === 'background') {
				if (Platform.OS === 'android') {
					const isPipSupported = await NativeModules.PipModule.isPipSupported();
					if (isPipSupported) {
						NativeModules.PipModule.enablePipMode();
						dispatch(voiceActions.setPiPModeMobile(true));
					}
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
		try {
			checkPermissions();
			setupAudioDetection();
		} catch (error) {
			console.error('Error setting up audio detection:', error);
		}

		// Cleanup function
		return () => {
			if (Platform.OS === 'android' && AudioSessionModule) {
				AudioSessionModule.stopAudioSession?.();
			}
		};
	}, []);

	const checkPermissions = async () => {
		if (Platform.OS === 'android') {
			try {
				isRequestingPermission.current = true;
				await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
				await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
			} catch (error) {
				console.error('Permission request failed:', error);
			} finally {
				isRequestingPermission.current = false;
			}
		}
	};

	const onQuitGroupCall = () => {
		dispatch(groupCallActions.endGroupCall());
		const store = getStore();
		const state = store.getState();
		const currentDmGroup = selectCurrentDM(state);
		const userProfile = selectAllAccount(state);
		const quitData = {
			is_video: false,
			group_id: currentDmGroup?.channel_id || '',
			caller_id: userProfile?.user?.id,
			caller_name: userProfile?.user?.display_name || userProfile?.user?.username || '',
			timestamp: Date.now(),
			action: 'leave'
		} as CallSignalingData;
		sendSignalingToParticipants(
			currentDmGroup?.user_id || [],
			WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT,
			quitData,
			currentDmGroup?.channel_id || '',
			userProfile?.user?.id || ''
		);
		if (isFromNativeCall) {
			BackHandler.exitApp();
		}
	};

	const onCancelGroupCall = () => {
		dispatch(groupCallActions.endGroupCall());
		const store = getStore();
		const state = store.getState();
		const currentDmGroup = selectCurrentDM(state);
		const userProfile = selectAllAccount(state);
		const cancelAction = {
			is_video: false,
			group_id: currentDmGroup?.channel_id || '',
			caller_id: userProfile?.user?.id,
			caller_name: userProfile?.user?.display_name || userProfile?.user?.username || '',
			timestamp: Date.now(),
			reason: 'cancelled'
		};
		sendSignalingToParticipants(
			currentDmGroup?.user_id || [],
			WEBRTC_SIGNALING_TYPES.GROUP_CALL_CANCEL,
			cancelAction as CallSignalingData,
			currentDmGroup?.channel_id || '',
			userProfile?.user?.id || ''
		);
		groupCallActions.hidePreCallInterface();
		dispatch(
			messagesActions.sendMessage({
				channelId: currentDmGroup?.channel_id,
				clanId: '',
				mode: ChannelStreamMode.STREAM_MODE_GROUP,
				isPublic: true,
				content: {
					t: 'Cancelled voice call',
					callLog: {
						isVideo: false,
						callLogType: IMessageTypeCallLog.CANCELCALL,
						showCallBack: false
					}
				},
				anonymous: false,
				senderId: userProfile?.user?.id || '',
				avatar: userProfile?.user?.avatar_url || '',
				isMobile: true,
				username: currentDmGroup?.channel_label || ''
			})
		);
	};

	return (
		<View>
			{isAnimationComplete && !focusedScreenShare && !isPiPMode && <StatusBarHeight />}
			<View
				style={[
					{
						width: isAnimationComplete ? '100%' : size.s_100 * 2,
						height: isAnimationComplete ? '100%' : size.s_150,
						backgroundColor: isAnimationComplete ? themeValue?.primary : themeValue?.secondary
					},
					!isAnimationComplete && {
						borderWidth: 1,
						borderColor: themeValue?.textDisabled,
						borderRadius: size.s_10,
						overflow: 'hidden'
					}
				]}
			>
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					{isAnimationComplete && !focusedScreenShare && !isPiPMode && (
						<HeaderRoomView
							channel={channel}
							onPressMinimizeRoom={onPressMinimizeRoom}
							switchAudioOutput={switchAudioOutput}
							isFromNativeCall={isFromNativeCall}
							isGroupCall={isGroupCall}
							availableAudioOutputs={availableAudioOutputs}
							currentAudioOutput={currentAudioOutput}
							onOpenTooltip={onOpenTooltip}
						/>
					)}
					<ConnectionMonitor />
					{!isGroupCall && !isPiPMode && isAnimationComplete && (
						<CallReactionHandler channel={channel} isAnimatedCompleted={isAnimationComplete} />
					)}
					<RoomView
						channelId={channelId}
						clanId={clanId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isAnimationComplete={isAnimationComplete}
						onFocusedScreenChange={setFocusedScreenShare}
						isGroupCall={isGroupCall}
						participantsCount={participantsCount}
						onQuitGroupCall={onQuitGroupCall}
						onCancelCall={onCancelGroupCall}
					/>
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
