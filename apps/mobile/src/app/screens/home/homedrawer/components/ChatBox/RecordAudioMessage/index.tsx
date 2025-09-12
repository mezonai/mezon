import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectDmGroupCurrent, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { getMobileUploadedAttachments } from '@mezon/utils';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, ImageStyle, Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import { SOUND_WAVES_CIRCLE } from '../../../../../../../assets/lottie';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { usePermission } from '../../../../../../hooks/useRequestPermission';
import RenderAudioChat from '../../RenderAudioChat/RenderAudioChat';
import ModalConfirmRecord from '../ModalConfirmRecord/ModalConfirmRecord';
import { RecordingAudioMessage } from '../RecordingAudioMessage/RecordingAudioMessage';
import { style } from './styles';

interface IRecordAudioMessageProps {
	channelId: string;
	mode: ChannelStreamMode;
	topicId?: string;
}

export const BaseRecordAudioMessage = memo(({ channelId, mode, topicId = '' }: IRecordAudioMessageProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['recordChatMessage']);
	const [isDisplay, setIsDisplay] = useState<boolean>(false);
	const recordingRef = useRef(null);
	const recordingWaveRef = useRef(null);
	const { sessionRef, clientRef, socketRef } = useMezon();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
	const [recordUrl, setRecordUrl] = useState<string>('');
	const [isPreviewRecord, setIsPreviewRecord] = useState<boolean>(false);
	const meterSoundRef = useRef(null);
	const [isConfirmRecordModalVisible, setIsConfirmRecordModalVisible] = useState<boolean>(false);
	const audioRecorderPlayerRef = useRef<AudioRecorderPlayer | null>(null);

	const getAudioRecorderPlayer = useCallback(() => {
		if (!audioRecorderPlayerRef.current) {
			audioRecorderPlayerRef.current = new AudioRecorderPlayer();
		}
		return audioRecorderPlayerRef.current;
	}, []);

	const audioRecorderPlayer = getAudioRecorderPlayer();

	const currentChannelDM = useMemo(
		() => (mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup),
		[mode, currentChannel, currentDmGroup]
	);
	const { requestMicrophonePermission } = usePermission();

	useEffect(() => {
		const timeout = setTimeout(() => {
			startRecording();
		}, 200);
		return () => {
			if (audioRecorderPlayer) {
				audioRecorderPlayer.removeRecordBackListener();
				audioRecorderPlayer.stopRecorder();
			}
			clearTimeout(timeout);
		};
	}, []);

	const getPermissions = async () => {
		try {
			const granted = await requestMicrophonePermission();

			if (!granted) {
				Alert.alert('Permissions required', 'Please grant microphone permissions to use this feature.');
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
			Keyboard.dismiss();
			const isPermissionGranted = await getPermissions();
			if (!isPermissionGranted) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				return;
			}
			const dirs = RNFetchBlob.fs.dirs;
			const path = Platform.select({
				android: `${dirs.CacheDir}/sound.mp3`
			});

			setIsDisplay(true);
			setIsPreviewRecord(false);
			await new Promise((resolve) => setTimeout(resolve, 300));
			const result = await audioRecorderPlayer.startRecorder(path);
			setRecordUrl(result);
			recordingRef.current?.play();
			recordingWaveRef.current?.play(0, 45);
			meterSoundRef.current?.play();
		} catch (error) {
			console.error('Failed to start recording:', error);
			setIsDisplay(false);
		}
	};

	const stopRecording = useCallback(async () => {
		try {
			const result = await audioRecorderPlayer.stopRecorder();
			audioRecorderPlayer.removeRecordBackListener();
			setRecordUrl(result);
			return result;
		} catch (error) {
			setIsDisplay(false);
			console.error('Failed to stop recording:', error);
		}
	}, [setIsDisplay]);

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
				channelId: topicId || channelId,
				clanId,
				client,
				session
			});
			await socket.writeChatMessage(clanId, channelId, mode, isPublic, { t: '' }, [], uploadedFiles, [], false, false, '', 0, topicId);
			setIsDisplay(false);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
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
		topicId,
		mode,
		setIsDisplay,
		recordUrl,
		stopRecording,
		topicId
	]);

	const normalizeFilePath = (path) => {
		return path.replace(/^file:\/*/, 'file:///');
	};

	const getAudioFileInfo = async (uri) => {
		try {
			const fixedPath = normalizeFilePath(uri);
			const fileInfo = await RNFS.stat(fixedPath);
			if (fileInfo?.path) {
				const fileData = {
					filename: uri.split('/').pop(),
					size: fileInfo.size,
					filetype: 'audio/mp3',
					url: fileInfo.path
				};

				return [fileData];
			} else {
				return null;
			}
		} catch (error) {
			return null;
		}
	};

	const handlePreviewRecord = async () => {
		meterSoundRef.current?.pause();
		await stopRecording();
		setIsPreviewRecord(true);
	};

	const handleBackRecord = useCallback(() => {
		setIsConfirmRecordModalVisible(false);
	}, [setIsConfirmRecordModalVisible]);

	const handleQuitRecord = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		setIsConfirmRecordModalVisible(false);
		stopRecording();
	}, [setIsConfirmRecordModalVisible, stopRecording]);

	const handleRemoveRecord = async () => {
		await stopRecording();
		setIsDisplay(false);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	if (!isDisplay) return null;

	return (
		<>
			<ModalConfirmRecord visible={isConfirmRecordModalVisible} onBack={handleBackRecord} onConfirm={handleQuitRecord} />
			{/*TODO: Refactor this component*/}
			<View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: size.s_40, paddingVertical: size.s_20 }}>
				{isPreviewRecord && recordUrl ? (
					<RenderAudioChat audioURL={recordUrl} stylesContainerCustom={styles.containerAudioCustom} styleLottie={styles.customLottie} />
				) : (
					<RecordingAudioMessage audioRecorderPlayer={audioRecorderPlayer} ref={recordingWaveRef} />
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
							<MezonIconCDN icon={IconCDN.trashIcon} color={themeValue.white} />
						</TouchableOpacity>
						<TouchableOpacity onPress={sendMessage} style={styles.soundContainer}>
							<MezonIconCDN icon={IconCDN.sendMessageIcon} customStyle={styles.iconOverlay as ImageStyle} color={themeValue.white} />
							<LottieView ref={meterSoundRef} source={SOUND_WAVES_CIRCLE} resizeMode="cover" style={styles.soundLottie}></LottieView>
						</TouchableOpacity>
						{!isPreviewRecord && (
							<TouchableOpacity onPress={handlePreviewRecord} style={styles.boxIcon}>
								<MezonIconCDN icon={IconCDN.recordIcon} color={themeValue.white} />
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		</>
	);
});
