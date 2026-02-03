import { useChatSending } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectDmGroupById, useAppSelector } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useIsFocused } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, InteractionManager, Linking, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Audio } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { PERMISSIONS, check } from 'react-native-permissions';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { usePermission } from '../../../../../../hooks/useRequestPermission';
import { style } from '../ChatBoxBottomBar/style';

const RECORD_CANCEL_SWIPE_X = 100;

interface IRecordMessageSendingProps {
	mode: ChannelStreamMode;
	channelId: string;
	currentTopicId?: string;
	isCreateTopic?: boolean;
	anonymousMode?: boolean;
}

export const RecordMessageSending = memo(
	({ channelId, mode, currentTopicId = '', isCreateTopic = false, anonymousMode }: IRecordMessageSendingProps) => {
		const { themeValue } = useTheme();
		const isFocused = useIsFocused();
		const styles = style(themeValue);

		const [isRecording, setIsRecording] = useState(false);
		const translateX = useSharedValue(0);
		const scale = useSharedValue(1);
		const isLongPressed = useSharedValue(false);
		const hasTriggeredCancel = useSharedValue(false);
		const startTime = useSharedValue(0);
		const { requestMicrophonePermission } = usePermission();
		const { t } = useTranslation(['recordChatMessage', 'common']);
		const audioRecorderPlayerRef = useRef<AudioRecorderPlayer | null>(null);
		const recordingStartTimeRef = useRef<number>(0);
		const recordingDurationRef = useRef<number>(0);

		const showHoldToRecordHint = useCallback(() => {
			Toast.show({
				type: 'tooltip',
				text1: t('recordChatMessage:hintRecording'),
				position: 'bottom',
				bottomOffset: size.s_80
			});
		}, [t]);

		const getAudioRecorderPlayer = useCallback(() => {
			if (!audioRecorderPlayerRef.current) {
				audioRecorderPlayerRef.current = new AudioRecorderPlayer();
			}
			return audioRecorderPlayerRef.current;
		}, []);

		const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
		const currentDmGroup = useSelector((state) => selectDmGroupById(state, channelId));

		const channelOrDirect =
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup;
		const { sendMessage } = useChatSending({
			mode,
			channelOrDirect,
			fromTopic: isCreateTopic || !!currentTopicId
		});

		const showPermissionAlert = () => {
			const data = {
				children: (
					<MezonConfirm
						title={t('common:permissionNotification.microphonePermissionTitle')}
						content={t('common:permissionNotification.microphonePermissionDesc')}
						confirmText={t('common:openSettings')}
						onConfirm={() => {
							Linking.openSettings();
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
						}}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		};

		const getPermissions = async () => {
			try {
				const granted = await requestMicrophonePermission();

				if (!granted) {
					showPermissionAlert();
					return false;
				}
				return true;
			} catch (error) {
				console.error('Error requesting permissions:', error);
				return false;
			}
		};

		const startRecording = async () => {
			try {
				const checkStatusPermission = await check(Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO);
				const isPermissionGranted = await getPermissions();
				if (!isPermissionGranted || checkStatusPermission !== 'granted') {
					return;
				}
				isLongPressed.value = true;
				scale.value = withSpring(3, { damping: 10, stiffness: 100 });
				hasTriggeredCancel.value = false;
				const audioRecorderPlayer = getAudioRecorderPlayer();
				if (Platform.OS === 'ios') {
					// iOS: Let the library use default path for .m4a
					await audioRecorderPlayer.startRecorder();
				} else {
					// Android: Use explicit .mp3 path
					const dirs = RNFetchBlob.fs.dirs;
					const path = `${dirs.CacheDir}/sound.mp3`;
					await audioRecorderPlayer.startRecorder(path);
				}
				await sleep(300);
				recordingStartTimeRef.current = Date.now();
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, { show: true });
				setIsRecording(true);
			} catch (error) {
				console.error('Failed to start recording:', error);
			}
		};
		const normalizeFilePath = (path: string) => {
			return path.replace(/^file:\/*/, 'file:///');
		};

		const getAudioFileInfo = useCallback(async (uri: string, durationInMs: number) => {
			try {
				const fixedPath = normalizeFilePath(uri);
				const fileInfo = await RNFS.stat(fixedPath);
				if (fileInfo?.path) {
					const fileData = {
						filename: uri.split('/').pop(),
						size: fileInfo.size,
						filetype: 'audio/mp3',
						url: fileInfo.path,
						duration: Math.floor(durationInMs / 1000)
					};

					return [fileData];
				} else {
					return null;
				}
			} catch (error) {
				return null;
			}
		}, []);

		const stopRecording = useCallback(async () => {
			try {
				const recordingUrl = await audioRecorderPlayerRef?.current?.stopRecorder();
				if (!recordingUrl) return;

				const recordingEndTime = Date.now();
				const durationInMs = recordingEndTime - recordingStartTimeRef.current;
				recordingDurationRef.current = durationInMs;

				InteractionManager.runAfterInteractions(async () => {
					try {
						let finalRecordingUrl = recordingUrl;

						// Convert m4a to mp3 for iOS
						if (Platform.OS === 'ios') {
							try {
								const cleanPath = recordingUrl.replace(/^file:\/\//, '');
								const result = await Audio.compress(cleanPath, {
									bitrate: 128
								});

								finalRecordingUrl = result;
							} catch (compressionError) {
								console.error('Failed to convert audio to mp3:', compressionError);
							}
						}

						const attachments = await getAudioFileInfo(finalRecordingUrl, durationInMs);
						if (!attachments) return;
						await sendMessage({ t: '' }, [], attachments, undefined, anonymousMode && !currentDmGroup, false, true);
						setIsRecording(false);
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, { show: false });
					} catch (error) {
						console.error('Failed to send message:', error);
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
						Toast.show({
							type: 'error',
							text1: t('common:error'),
							text2: t('common:failedToSendMessage')
						});
					}
				});

				setIsRecording(false);
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, { show: false });
			} catch (error) {
				console.error('Failed to prepare message:', error);
				Toast.show({
					type: 'error',
					text1: t('common:error'),
					text2: t('common:failedToSendMessage')
				});

				setIsRecording(false);
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, { show: false });
			}
		}, [anonymousMode, currentDmGroup, getAudioFileInfo, sendMessage, t]);

		const cancelRecording = async () => {
			await audioRecorderPlayerRef?.current?.stopRecorder();
			audioRecorderPlayerRef?.current?.removeRecordBackListener();
			setIsRecording(false);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_RECORD_PROCESSING, { show: false });
		};

		useEffect(() => {
			return () => {
				audioRecorderPlayerRef?.current?.stopRecorder();
				audioRecorderPlayerRef?.current?.removeRecordBackListener();
			};
		}, []);

		const animatedStyle = useAnimatedStyle(() => ({
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			transform: [{ translateX: translateX.value }, { scale: scale.value }],
			backgroundColor: isRecording ? baseColor.blurple : isLongPressed.value ? themeValue.tertiary : themeValue.tertiary
		}));

		const longPressGesture = Gesture.LongPress()
			.enabled(isFocused)
			.minDuration(400)
			.maxDistance(RECORD_CANCEL_SWIPE_X)
			.onStart(() => {
				startTime.value = Date.now();
				runOnJS(startRecording)();
			})
			.onEnd(() => {
				if (isLongPressed.value && !hasTriggeredCancel.value) {
					runOnJS(stopRecording)();
					translateX.value = withSpring(0);
					scale.value = withSpring(1);
					isLongPressed.value = false;
					runOnJS(setIsRecording)(false);
				}
			});

		const panGesture = Gesture.Pan()
			.enabled(isFocused)
			.minDistance(0)
			.onUpdate((event) => {
				if (isLongPressed.value) {
					translateX.value = event.translationX;
					if (event.translationX < -RECORD_CANCEL_SWIPE_X && !hasTriggeredCancel.value) {
						hasTriggeredCancel.value = true;
						runOnJS(cancelRecording)();
					}
				}
			})
			.onEnd((event) => {
				if (event.translationX > -RECORD_CANCEL_SWIPE_X) {
					runOnJS(stopRecording)();
				}
				translateX.value = withSpring(0);
				scale.value = withSpring(1);
				isLongPressed.value = false;
				runOnJS(setIsRecording)(false);
			});

		const tapGesture = Gesture.Tap()
			.enabled(isFocused)
			.onEnd(() => {
				runOnJS(showHoldToRecordHint)();
			});

		const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture, tapGesture);

		return (
			<GestureDetector gesture={composedGesture}>
				<Animated.View style={[styles.btnIcon, styles.iconVoice, animatedStyle]}>
					<MezonIconCDN icon={IconCDN.microphoneIcon} width={size.s_18} height={size.s_18} color={themeValue.textStrong} />
				</Animated.View>
			</GestureDetector>
		);
	}
);
