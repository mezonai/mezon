import { ActionEmitEvent } from '@mezon/mobile-components';
import { Block, size, useAnimatedState, useTheme } from '@mezon/mobile-ui';
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
import { Alert, DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import { RECORDING, RECORD_WAVE } from '../../../../../../../assets/lottie';

interface IRecordAudioMessageProps {
	channelId: string;
	mode: ChannelStreamMode;
}

export const RecordAudioMessage = memo(({ channelId, mode }: IRecordAudioMessageProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['message']);
	const [recording, setRecording] = useState(null);
	const [isDisplay, setIsDisplay] = useAnimatedState(false);

	const recordingRef = useRef(null);
	const recordingWaveRef = useRef(null);
	const { sessionRef, clientRef, socketRef } = useMezon();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));

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
			const isPermissionGranted = await getPermissions();
			if (!isPermissionGranted) return;
			setIsDisplay(true);
			// Configure audio
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
			recordingWaveRef.current?.play();

			setRecording(newRecording);
		} catch (error) {
			console.error('Failed to start recording:', error);
			setIsDisplay(false);
		}
	};

	const sendMessage = useCallback(
		async (url: string) => {
			try {
				const session = sessionRef.current;
				const client = clientRef.current;
				const socket = socketRef.current;
				const clanId = currentChannelDM?.clan_id;
				const channelId = currentChannelDM?.channel_id;
				const isPublic = !currentChannelDM?.channel_private;

				const attachments = await getAudioFileInfo(url);
				const uploadedFiles = await getMobileUploadedAttachments({
					attachments,
					channelId,
					clanId,
					client,
					session
				});
				await socket.writeChatMessage(clanId, channelId, mode, isPublic, { t: '' }, [], uploadedFiles, [], false, false, '');
				setIsDisplay(false);
			} catch (error) {
				console.error('Failed to send message:', error);
				setIsDisplay(false);
			}
		},
		[
			sessionRef,
			clientRef,
			socketRef,
			currentChannelDM?.clan_id,
			currentChannelDM?.channel_id,
			currentChannelDM?.channel_private,
			mode,
			setIsDisplay
		]
	);

	const stopRecording = useCallback(async () => {
		try {
			if (!recording) return;
			// Stop recording
			await recording.stopAndUnloadAsync();

			// Get recording URI
			const uri = recording.getURI();
			if (uri) {
				sendMessage(uri);
			}

			recordingRef.current?.reset();
			recordingWaveRef.current?.reset();
			setRecording(null);
		} catch (error) {
			setIsDisplay(false);
			console.error('Failed to stop recording:', error);
		}
	}, [recording, sendMessage, setIsDisplay]);

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
		const eventStopRecord = DeviceEventEmitter.addListener(ActionEmitEvent.ON_STOP_RECORD_MESSAGE, stopRecording);

		return () => {
			eventStartRecord.remove();
			eventStopRecord.remove();
		};
	}, [stopRecording]);

	if (!isDisplay) return null;

	return (
		<Block
			position={'absolute'}
			paddingHorizontal={size.s_10}
			left={0}
			width={'88%'}
			height={'100%'}
			flex={1}
			backgroundColor={themeValue.primary}
			top={0}
			flexDirection={'row'}
			alignItems={'center'}
			zIndex={100}
		>
			<LottieView source={RECORDING} ref={recordingRef} resizeMode="cover" style={{ width: size.s_70, height: size.s_70 }} />
			<LottieView source={RECORD_WAVE} ref={recordingWaveRef} resizeMode="cover" style={{ width: size.s_60 * 2, height: size.s_30 }} />
		</Block>
	);
});
