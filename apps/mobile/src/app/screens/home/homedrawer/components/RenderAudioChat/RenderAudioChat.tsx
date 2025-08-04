import { PauseIcon, PlayIcon } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';
import { WAY_AUDIO } from '../../../../../../assets/lottie';
import { style } from './styles';

const formatTime = (millis: number) => {
	const minutes = Math.floor(millis / 60000);
	const seconds = Math.floor((millis % 60000) / 1000);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RenderAudioChat = React.memo(
	({ audioURL, stylesContainerCustom, styleLottie }: { audioURL: string; stylesContainerCustom?: ViewStyle; styleLottie?: ViewStyle }) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const recordingWaveRef = useRef(null);
		const [isPlaying, setIsPlaying] = useState(false);
		const [sound, setSound] = useState<Sound | null>(null);
		const [totalTime, setTotalTime] = useState(0);

		useEffect(() => {
			recordingWaveRef?.current?.reset();
			// Configure Sound for iOS
			if (Platform.OS === 'ios') {
				Sound.setCategory('Playback', true); // Allow mixing with other audio
				Sound.setMode('Default');
			} else {
				// Only use InCallManager for Android
				InCallManager.setSpeakerphoneOn(true);
				InCallManager.setForceSpeakerphoneOn(true);
			}

			return () => {
				// Cleanup
				if (Platform.OS === 'android') {
					InCallManager.setSpeakerphoneOn(false);
					InCallManager.setForceSpeakerphoneOn(false);
				}
			};
		}, []);

		useEffect(() => {
			const newSound = new Sound(audioURL, '', (error) => {
				if (error) {
					console.error('Failed to load sound:', error);
					return;
				}
				setTotalTime(newSound.getDuration() * 1000);

				// Configure sound settings
				if (Platform.OS === 'ios') {
					newSound.setNumberOfLoops(0); // No looping
					newSound.setVolume(1.0);
				}

				setSound(newSound);
			});

			return () => {
				if (newSound) {
					newSound.release();
				}
			};
		}, [audioURL]);

		const playSound = () => {
			if (sound) {
				sound.play((success) => {
					if (success) {
						sound.setCurrentTime(0);
						recordingWaveRef?.current?.reset();
						setIsPlaying(false);
					}
				});
				setIsPlaying(true);
				recordingWaveRef?.current?.play(0, 45);
			}
		};

		const pauseSound = () => {
			if (sound) {
				sound.pause();
				recordingWaveRef?.current?.pause();
				setIsPlaying(false);
			}
		};

		useEffect(() => {
			return () => {
				// Cleanup on unmount
				if (sound) {
					sound.stop();
					sound.release();
				}
			};
		}, [sound]);

		return (
			<View style={{ flex: 1, flexDirection: 'row' }}>
				<TouchableOpacity
					onPress={isPlaying ? pauseSound : playSound}
					activeOpacity={0.6}
					style={{ ...styles.container, ...stylesContainerCustom }}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
						<View
							style={{
								backgroundColor: baseColor.bgDeepLavender,
								borderRadius: size.s_30,
								padding: size.s_8,
								alignItems: 'center',
								gap: size.s_10,
								justifyContent: 'center'
							}}
						>
							{isPlaying ? (
								<PauseIcon width={size.s_16} height={size.s_16} color={'white'} />
							) : (
								<PlayIcon width={size.s_16} height={size.s_16} color={'white'} />
							)}
						</View>
						<LottieView source={WAY_AUDIO} ref={recordingWaveRef} resizeMode="cover" style={{ ...styles.soundLottie, ...styleLottie }} />
						<Text style={[styles.currentTime, isPlaying && { opacity: 0 }]}>{`${formatTime(totalTime)}`}</Text>
					</View>
				</TouchableOpacity>
			</View>
		);
	}
);

export default RenderAudioChat;
