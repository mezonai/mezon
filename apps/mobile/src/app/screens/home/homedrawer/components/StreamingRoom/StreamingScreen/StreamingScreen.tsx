import { Ionicons } from '@expo/vector-icons';
import { Block, useTheme } from '@mezon/mobile-ui';
import { selectStreamChannelByChannelId } from '@mezon/store-mobile';
import { default as React, memo, useRef, useState } from 'react';
import { StatusBar, TouchableOpacity, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import Video from 'react-native-video';
import { useSelector } from 'react-redux';
import { style } from './styles';

import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native';

export function StreamingScreen({
	streamID,
	onFullScreenVideo,
	isAnimationComplete
}: {
	isAnimationComplete: boolean;
	onFullScreenVideo: () => void;
	streamID: string;
}) {
	const channelStream = useSelector(selectStreamChannelByChannelId(streamID || ''));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const videoRef = useRef(null);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const { t } = useTranslation(['streamingRoom']);

	const handleFullScreen = () => {
		setIsFullScreen(!isFullScreen);
		onFullScreenVideo?.();
		if (!isFullScreen) {
			StatusBar.setHidden(true);
			Orientation.lockToLandscapeLeft();
		} else {
			StatusBar.setHidden(false);
			Orientation.lockToPortrait();
		}
	};

	const handleVideoLoadStart = () => {
		setLoading(true);
		setError(false);
	};

	const handleVideoLoad = () => {
		setLoading(false);
	};

	const handleVideoError = (err: any) => {
		setLoading(false);
		setError(true);
	};

	return (
		<View style={styles.container}>
			{channelStream?.streaming_url ? (
				<View>
					{loading && !error && (
						<View style={styles.loadingOverlay}>
							<ActivityIndicator size="large" color="white" />
						</View>
					)}

					{error ? (
						<Block width={'100%'} height={'100%'} justifyContent="center" alignItems="center">
							<Text style={styles.errorText}>{t('noStreaming')}</Text>
						</Block>
					) : (
						<Video
							controls={false}
							ref={videoRef}
							source={{
								uri: channelStream?.streaming_url
							}}
							resizeMode={isFullScreen ? 'cover' : 'contain'}
							style={isFullScreen ? styles.fullScreenVideo : styles.video}
							onLoadStart={handleVideoLoadStart}
							onLoad={handleVideoLoad}
							onError={handleVideoError}
						/>
					)}
				</View>
			) : (
				<Block width={'100%'} height={'100%'} justifyContent="center" alignItems="center">
					<Text style={styles.errorText}>{t('noDisplay')}</Text>
				</Block>
			)}

			{(isAnimationComplete || isFullScreen) && !error && channelStream?.streaming_url && (
				<TouchableOpacity style={styles.fullScreenButton} onPress={handleFullScreen}>
					<Ionicons name={isFullScreen ? 'contract-outline' : 'expand-outline'} size={24} color="white" />
				</TouchableOpacity>
			)}
		</View>
	);
}

export const StreamingScreenComponent = memo(StreamingScreen);
