import { AudioSession } from '@livekit/react-native';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectChannelById2 } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, NativeModules, Platform, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import AudioOutputTooltip from '../../AudioOutputTooltip';
import { ContainerMessageActionModal } from '../../MessageItemBS/ContainerMessageActionModal';
import { style } from '../styles';
import SendVoiceSound from './SendVoiceSound';
import SwitchCamera from './SwitchCamera';
const { AudioSessionModule } = NativeModules;

export type AudioOutput = {
	id: string;
	name: string;
	type: 'speaker' | 'earpiece' | 'bluetooth' | 'headphones' | 'default' | 'force_speaker';
};

type headerProps = {
	isShow: boolean;
	channelId: string;
	onPressMinimizeRoom: () => void;
	isGroupCall?: boolean;
};

const HeaderRoomView = memo(({ channelId, onPressMinimizeRoom, isGroupCall = false, isShow }: headerProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [currentAudioOutput, setCurrentAudioOutput] = useState<string>('earpiece');
	const [availableAudioOutputs, setAvailableAudioOutputs] = useState<AudioOutput[]>([]);

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
				const newSpeakerState = outputType === 'speaker';
				await AudioSession.configureAudio({
					ios: {
						defaultOutput: newSpeakerState ? 'speaker' : 'earpiece'
					}
				});
				setCurrentAudioOutput(outputType);
				await AudioSessionModule?.setAudioDevice?.(outputType);
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
		try {
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

	const channelLabel = useMemo(() => {
		const store = getStore();
		const channel = selectChannelById2(store.getState(), channelId);
		return channel?.channel_label || '';
	}, [channelId]);

	const handleOpenEmojiPicker = () => {
		const data = {
			snapPoints: ['75%'],
			children: (
				<ContainerMessageActionModal
					message={undefined}
					mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
					senderDisplayName={''}
					isOnlyEmojiPicker={true}
					channelId={channelId}
				/>
			),
			containerStyle: { zIndex: 1001 },
			backdropStyle: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={[styles.menuHeader, !isShow && { display: 'none' }]}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
				{!isGroupCall && (
					<TouchableOpacity onPress={onPressMinimizeRoom} style={styles.buttonCircle}>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} color={themeValue.white} />
					</TouchableOpacity>
				)}
				<Text numberOfLines={1} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
					{channelLabel}
				</Text>
			</View>

			<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
				{!isGroupCall && (
					<TouchableOpacity onPress={handleOpenEmojiPicker} style={[styles.buttonCircle]}>
						<MezonIconCDN icon={IconCDN.reactionIcon} height={size.s_20} width={size.s_20} color={themeValue.white} />
					</TouchableOpacity>
				)}
				{!isGroupCall && <SendVoiceSound channelId={channelId} />}
				<SwitchCamera />
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
});

export default React.memo(HeaderRoomView);
