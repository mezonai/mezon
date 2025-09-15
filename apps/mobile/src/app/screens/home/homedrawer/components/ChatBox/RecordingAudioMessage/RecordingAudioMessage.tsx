import { useTheme } from '@mezon/mobile-ui';
import LottieView from 'lottie-react-native';
import React, { forwardRef, useEffect } from 'react';
import { Text, View } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { WAY_AUDIO } from '../../../../../../../assets/lottie';
import { style } from './styles';
const formatTime = (millis: number) => {
	const minutes = Math.floor(millis / 60000);
	const seconds = Math.floor((millis % 60000) / 1000);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
export const RecordingAudioMessage = forwardRef(({ audioRecorderPlayer }: { audioRecorderPlayer: AudioRecorderPlayer }, recordingWaveRef: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [duration, setDuration] = React.useState(0);

	useEffect(() => {
		audioRecorderPlayer.addRecordBackListener((e) => {
			setDuration(e.currentPosition);
		});
	}, [audioRecorderPlayer]);

	return (
		<View style={styles.container}>
			<LottieView source={WAY_AUDIO} ref={recordingWaveRef} resizeMode="cover" style={styles.soundLottie} />
			<Text style={styles.currentTime}>{formatTime(duration)}</Text>
		</View>
	);
});
