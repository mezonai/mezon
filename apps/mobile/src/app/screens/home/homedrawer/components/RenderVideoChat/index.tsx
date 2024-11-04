/* eslint-disable no-console */
import { Block, Colors, Metrics, size } from '@mezon/mobile-ui';
import { Audio, Video as ExpoVideo, InterruptionModeIOS, ResizeMode } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';

const widthMedia = Metrics.screenWidth - 150;

export const RenderVideoChat = React.memo(
	({ videoURL }: { videoURL: string }) => {
		const videoRef = useRef<ExpoVideo>();
		const [videoDimensions, setVideoDimensions] = useState({ width: widthMedia + size.s_50, height: 160, isLoading: true });

		useEffect(() => {
			let timeout;
			Audio.setAudioModeAsync({
				interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
				playsInSilentModeIOS: true,
				allowsRecordingIOS: false,
				staysActiveInBackground: false
			})
				.then(() => {
					if (Platform.OS === 'ios') {
						videoRef?.current?.playAsync();
						videoRef?.current?.setVolumeAsync(0);
						timeout = setTimeout(() => {
							videoRef?.current?.setVolumeAsync(1);
							videoRef?.current?.pauseAsync();
						}, 1000);
						return;
					}
				})
				.catch((err) => console.log('Set active err', err));

			return () => {
				timeout && clearTimeout(timeout);
			};
		}, []);

		if (!videoURL) return null;
		const isUploading = !videoURL?.includes('http');

		return (
			<Block marginTop={size.s_10} marginBottom={size.s_6} opacity={isUploading || videoDimensions?.isLoading ? 0.5 : 1}>
				<ExpoVideo
					ref={videoRef}
					onError={(err) => {
						console.log('load error', err);
					}}
					onReadyForDisplay={(event) => {
						const { width, height } = event.naturalSize || {};
						const aspectRatio = width / height;
						const calculatedWidth = widthMedia;
						const calculatedHeight = calculatedWidth / aspectRatio;
						setVideoDimensions({ width: calculatedWidth, height: calculatedHeight, isLoading: false });
					}}
					source={{
						uri: videoURL
					}}
					useNativeControls
					resizeMode={ResizeMode.CONTAIN}
					rate={1.0}
					shouldPlay={false}
					removeClippedSubviews
					shouldRasterizeIOS
					style={{
						width: Math.max(videoDimensions.width, Metrics.screenWidth - size.s_60 * 2),
						height: Math.max(videoDimensions.height, size.s_100 * 2.5),
						borderRadius: size.s_4,
						overflow: 'hidden',
						backgroundColor: Colors.borderDim
					}}
				/>
				{(isUploading || videoDimensions?.isLoading) && (
					<Block
						position="absolute"
						top={0}
						left={0}
						right={0}
						bottom={15}
						width={Math.max(videoDimensions.width, Metrics.screenWidth - size.s_60 * 2)}
						height={Math.max(videoDimensions.height, size.s_100 * 2.5)}
						alignItems="center"
						justifyContent="center"
					>
						<ActivityIndicator />
					</Block>
				)}
			</Block>
		);
	},
	(prevProps, nextProps) => prevProps.videoURL === nextProps.videoURL
);
