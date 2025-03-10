import { PauseIcon, PlayIcon } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';
import { WAY_AUDIO } from '../../../../../../assets/lottie';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

const formatTime = (millis: number) => {
	const minutes = Math.floor(millis / 60000);
	const seconds = Math.floor((millis % 60000) / 1000);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RenderAudioChat = React.memo(
	({ audioURL, stylesContainerCustom, styleLottie }: { audioURL: string; stylesContainerCustom?: ViewStyle; styleLottie?: ViewStyle }) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue, isTabletLandscape);
		const recordingWaveRef = useRef(null);
		const [isPlaying, setIsPlaying] = useState(false);
		const [sound, setSound] = useState<Sound | null>(null);
		const [totalTime, setTotalTime] = useState(0);

		useEffect(() => {
			InCallManager.setSpeakerphoneOn(true);
		}, []);

		useEffect(() => {
			const newSound = new Sound(audioURL, '', (error) => {
				if (error) {
					console.error('Failed to load sound:', error);
					return;
				}
				setTotalTime(newSound.getDuration() * 1000);
				setSound(newSound);
			});

			return () => {
				newSound.release();
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

		return (
			<TouchableOpacity
				onPress={isPlaying ? pauseSound : playSound}
				activeOpacity={0.6}
				style={{ ...styles.container, ...stylesContainerCustom }}
			>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
					<View
						style={{
							backgroundColor: baseColor.white,
							borderRadius: size.s_30,
							padding: size.s_8,
							alignItems: 'center',
							gap: size.s_10,
							justifyContent: 'center'
						}}
					>
						{isPlaying ? (
							<PauseIcon width={size.s_20} height={size.s_20} color={baseColor.bgDeepLavender} />
						) : (
							<PlayIcon width={size.s_20} height={size.s_20} color={baseColor.bgDeepLavender} />
						)}
					</View>
					<LottieView source={WAY_AUDIO} ref={recordingWaveRef} resizeMode="cover" style={{ ...styles.soundLottie, ...styleLottie }} />
					{!isPlaying && <Text style={styles.currentTime}>{`${formatTime(totalTime)}`}</Text>}
				</View>
			</TouchableOpacity>
		);
	}
);

export default RenderAudioChat;
