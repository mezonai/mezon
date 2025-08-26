import { ActionEmitEvent } from '@mezon/mobile-components';
import { Metrics, size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, NativeModules, Platform, TouchableOpacity, View } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import Entypo from 'react-native-vector-icons/Entypo';
import ImageNative from '../../../../../components/ImageNative';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';

const widthMedia = Metrics.screenWidth - 150;
export const RenderVideoChat = React.memo(
	({ videoURL, onLongPress }: { videoURL: string; onLongPress: () => void }) => {
		const navigation = useNavigation<any>();
		const [thumbPath, setThumbPath] = useState('');

		const handlePlayVideo = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			navigation.navigate(APP_SCREEN.VIDEO_DETAIL, { videoURL });
		};

		useEffect(() => {
			if (videoURL) {
				if (Platform.OS === 'android') {
					// Safe native module call with error handling
					try {
						if (NativeModules?.VideoThumbnail?.getThumbnail) {
							NativeModules.VideoThumbnail.getThumbnail(videoURL)
								.then((path) => {
									if (path && typeof path === 'string') {
										setThumbPath(path);
									} else {
										console.warn('Invalid thumbnail path returned');
										setThumbPath('');
									}
								})
								.catch((err) => {
									console.error('VideoThumbnail native module error:', err);
									setThumbPath('');
								});
						} else {
							console.warn('VideoThumbnail native module not available');
							setThumbPath('');
						}
					} catch (error) {
						console.error('Error accessing VideoThumbnail native module:', error);
						setThumbPath('');
					}
				} else {
					createThumbnail({ url: videoURL, timeStamp: 1000 })
						.then((response) => {
							if (response?.path) {
								setThumbPath(response.path);
							} else {
								setThumbPath('');
							}
						})
						.catch((error) => {
							console.error('Error creating thumbnail:', error);
							setThumbPath('');
						});
				}
			}
		}, [videoURL]);

		if (!videoURL) return null;
		const isUploading = !videoURL.startsWith('http');

		return (
			<View style={{ marginTop: size.s_10, marginBottom: size.s_6, opacity: isUploading ? 0.5 : 1 }}>
				{isUploading ? (
					<View
						style={{
							width: Math.max(widthMedia, Metrics.screenWidth - size.s_60 * 2),
							height: Math.max(160, size.s_100 * 2.5),
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: '#5a5b5c30'
						}}
					>
						<ActivityIndicator />
					</View>
				) : (
					<TouchableOpacity
						onPress={handlePlayVideo}
						onLongPress={onLongPress}
						style={{ alignItems: 'center', justifyContent: 'center', width: '80%', overflow: 'hidden', borderRadius: size.s_4 }}
					>
						<ImageNative
							url={thumbPath || ''}
							style={{
								width: '100%',
								height: Math.max(160, size.s_100 * 2.5),
								borderRadius: size.s_4,
								backgroundColor: '#5a5b5c30'
							}}
							resizeMode="cover"
						/>
						<View
							style={{
								position: 'absolute',
								alignSelf: 'center',
								backgroundColor: 'rgba(0, 0, 0, 0.5)',
								borderRadius: size.s_60,
								width: size.s_60,
								height: size.s_60,
								justifyContent: 'center',
								alignItems: 'center'
							}}
						>
							<Entypo size={size.s_40} name="controller-play" style={{ color: '#eaeaea' }} />
						</View>
					</TouchableOpacity>
				)}
			</View>
		);
	},
	(prevProps, nextProps) => prevProps.videoURL === nextProps.videoURL
);
