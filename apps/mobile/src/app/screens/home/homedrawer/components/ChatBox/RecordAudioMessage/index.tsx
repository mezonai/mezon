import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useAnimatedState, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectDmGroupCurrent, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { getMobileUploadedAttachments } from '@mezon/utils';
import { Audio } from 'expo-av';
import { AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat } from 'expo-av/build/Audio/RecordingConstants';
import * as FileSystem from 'expo-file-system';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { SOUND_WAVES_CIRCLE } from '../../../../../../../assets/lottie';
import { MezonBottomSheet } from '../../../../../../componentUI';
import RenderAudioChat from '../../RenderAudioChat/RenderAudioChat';
import ModalConfirmRecord from '../ModalConfirmRecord/ModalConfirmRecord';
import { RecordingAudioMessage } from '../RecordingAudioMessage/RecordingAudioMessage';
import { style } from './styles';

interface IRecordAudioMessageProps {
	channelId: string;
	mode: ChannelStreamMode;
}

export const RecordAudioMessage = memo(({ channelId, mode }: IRecordAudioMessageProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['recordChatMessage']);
	const [recording, setRecording] = useState(null);
	const [isDisplay, setIsDisplay] = useAnimatedState(false);

	const recordingRef = useRef(null);
	const recordingWaveRef = useRef(null);
	const { sessionRef, clientRef, socketRef } = useMezon();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
	const recordingBsRef = useRef(null);
	const [recordUrl, setRecordUrl] = useState<string>('');
	const [durationRecord, setDurationRecord] = useState(0);
	const [isPreviewRecord, setIsPreviewRecord] = useState<boolean>(false);
	const meterSoundRef = useRef(null);
	const [isConfirmRecordModalVisible, setIsConfirmRecordModalVisible] = useAnimatedState(false);
	const currentChannelDM = useMemo(
		() => (mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup),
		[mode, currentChannel, currentDmGroup]
	);

	const getPermissions = async () => {
		try {
			const { status } = await Audio.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permissions required', 'Please grant microphone permissions to use this feature.');
				return false;
			}
			return true;
		} catch (error) {
			console.error('Error requesting permissions:', error);
		}
	};

	const startRecording = async () => {
		try {
			Keyboard.dismiss();
			const isPermissionGranted = await getPermissions();
			if (!isPermissionGranted) return;
			setIsDisplay(true);
			setIsPreviewRecord(false);
			recordingBsRef.current?.present();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true
			});

			// Create and start recording
			const { recording: newRecording } = await Audio.Recording.createAsync({
				isMeteringEnabled: true,
				android: {
					extension: '.mp3',
					outputFormat: AndroidOutputFormat.MPEG_4,
					audioEncoder: AndroidAudioEncoder.AAC,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000
				},
				ios: {
					extension: '.m4a',
					outputFormat: IOSOutputFormat.MPEG4AAC,
					audioQuality: IOSAudioQuality.MAX,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false
				},
				web: {
					mimeType: 'audio/webm',
					bitsPerSecond: 128000
				}
			});

			recordingRef.current?.play();
			recordingWaveRef.current?.play(0, 45);
			meterSoundRef.current?.play();

			setRecording(newRecording);
		} catch (error) {
			console.error('Failed to start recording:', error);
			setIsDisplay(false);
		}
	};

	useEffect(() => {
		if (!recording) return;
		recording.setOnRecordingStatusUpdate(async (status) => {
			setDurationRecord(status?.durationMillis);
		});
	}, [recording]);

	const stopRecording = useCallback(async () => {
		try {
			if (!recording) return;
			// Stop recording
			await recording.stopAndUnloadAsync();

			// Get recording URI
			const uri = recording.getURI();

			if (uri) {
				setRecordUrl(uri);
			}

			recordingRef.current?.reset();
			meterSoundRef.current?.reset();
			setRecording(null);
			return uri;
		} catch (error) {
			setIsDisplay(false);
			console.error('Failed to stop recording:', error);
		}
	}, [recording, setIsDisplay]);

	const sendMessage = useCallback(async () => {
		try {
			let recordingUrl;
			if (isPreviewRecord) {
				recordingUrl = recordUrl;
			} else {
				recordingUrl = await stopRecording();
			}
			if (!recordingUrl) return;
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;
			const clanId = currentChannelDM?.clan_id;
			const channelId = currentChannelDM?.channel_id;
			const isPublic = !currentChannelDM?.channel_private;

			const attachments = await getAudioFileInfo(recordingUrl);
			const uploadedFiles = await getMobileUploadedAttachments({
				attachments,
				channelId,
				clanId,
				client,
				session
			});
			await socket.writeChatMessage(clanId, channelId, mode, isPublic, { t: '' }, [], uploadedFiles, [], false, false, '');
			setIsDisplay(false);
			recordingBsRef?.current?.dismiss();
		} catch (error) {
			console.error('Failed to send message:', error);
			setIsDisplay(false);
		}
	}, [
		isPreviewRecord,
		sessionRef,
		clientRef,
		socketRef,
		currentChannelDM?.clan_id,
		currentChannelDM?.channel_id,
		currentChannelDM?.channel_private,
		mode,
		setIsDisplay,
		recordUrl,
		stopRecording
	]);

	const getAudioFileInfo = async (uri) => {
		try {
			const fileInfo = await FileSystem.getInfoAsync(uri);
			if (fileInfo?.exists) {
				const fileData = {
					filename: uri.split('/').pop(),
					size: fileInfo.size,
					filetype: 'audio/mp3',
					url: fileInfo.uri
				};

				return [fileData];
			} else {
				return null;
			}
		} catch (error) {
			return null;
		}
	};

	useEffect(() => {
		const eventStartRecord = DeviceEventEmitter.addListener(ActionEmitEvent.ON_START_RECORD_MESSAGE, startRecording);

		return () => {
			eventStartRecord.remove();
		};
	}, []);

	const handlePreviewRecord = async () => {
		meterSoundRef.current?.pause();
		await stopRecording();
		setIsPreviewRecord(true);
	};

	const handleBackRecord = useCallback(() => {
		setIsConfirmRecordModalVisible(false);
	}, []);

	const handleQuitRecord = useCallback(() => {
		recordingBsRef?.current?.dismiss();
		setIsConfirmRecordModalVisible(false);
		stopRecording();
	}, [recording]);

	const handleRemoveRecord = async () => {
		await stopRecording();
		setIsDisplay(false);
		recordingBsRef?.current?.dismiss();
	};
	const handleBackdropBS = useCallback(() => {
		setIsConfirmRecordModalVisible(true);
	}, []);
	if (!isDisplay) return null;
	return (
		<View>
			<ModalConfirmRecord visible={isConfirmRecordModalVisible} onBack={handleBackRecord} onConfirm={handleQuitRecord} />
			<MezonBottomSheet snapPoints={['50%']} ref={recordingBsRef} onBackdropPress={handleBackdropBS} enablePanDownToClose={false}>
				<View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: size.s_40, paddingVertical: size.s_20 }}>
					{isPreviewRecord && recordUrl ? (
						<RenderAudioChat audioURL={recordUrl} stylesContainerCustom={styles.containerAudioCustom} styleLottie={styles.customLottie} />
					) : (
						<RecordingAudioMessage durationRecord={durationRecord} ref={recordingWaveRef} />
					)}

					<View style={{ marginTop: size.s_20 }}>
						<Text style={styles.title}>{t('handsFreeMode')}</Text>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginVertical: size.s_20,
								width: '80%'
							}}
						>
							<TouchableOpacity onPress={handleRemoveRecord} style={styles.boxIcon}>
								<Icons.TrashIcon color={themeValue.white} />
							</TouchableOpacity>
							<TouchableOpacity onPress={sendMessage} style={styles.soundContainer}>
								<Icons.SendMessageIcon style={styles.iconOverlay} color={themeValue.white} />
								<LottieView
									ref={meterSoundRef}
									source={SOUND_WAVES_CIRCLE}
									resizeMode="cover"
									style={styles.soundLottie}
								></LottieView>
							</TouchableOpacity>
							{!isPreviewRecord && (
								<TouchableOpacity onPress={handlePreviewRecord} style={styles.boxIcon}>
									<Icons.RecordIcon color={themeValue.white} />
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</MezonBottomSheet>
		</View>
	);
});
