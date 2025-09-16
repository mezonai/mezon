import { ActionEmitEvent } from '@mezon/mobile-components';
import { Metrics, size } from '@mezon/mobile-ui';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Image, NativeModules, Platform, TouchableOpacity, View } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import FastImage from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { getAspectRatioSize, useImageResolution } from 'react-native-zoom-toolkit';
import ImageNative from '../../../../../components/ImageNative';
import { RenderVideoDetail } from '../RenderVideoDetail';
import { style } from './styles';

const widthMedia = Metrics.screenWidth - 150;
const heightMedia = Metrics.screenHeight * 0.3;
interface IRenderVideoChatProps {
	videoURL: string;
	onLongPress: () => void;
	isMultiple?: boolean;
	thumbnailPreview?: string;
	widthThumbnail?: number;
	heightThumbnail?: number;
}

export const RenderVideoChat = React.memo(
	({ videoURL, onLongPress, isMultiple = false, thumbnailPreview = '', widthThumbnail = 0, heightThumbnail = 0 }: IRenderVideoChatProps) => {
		const { resolution } = useImageResolution({ uri: thumbnailPreview });
		const [thumbPath, setThumbPath] = useState('');
		const isUploading = !videoURL?.startsWith?.('http');

		const handlePlayVideo = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
			const data = {
				children: <RenderVideoDetail route={{ params: { videoURL } }} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		};

		useEffect(() => {
			if (videoURL) {
				if (isUploading && thumbnailPreview) {
					setThumbPath(thumbnailPreview);
					return;
				}
				if (Platform.OS === 'android') {
					// Safe native module call with error handling
					try {
						if (NativeModules?.VideoThumbnail?.getThumbnail) {
							NativeModules.VideoThumbnail.getThumbnail(videoURL)
								.then((path) => {
									path && typeof path === 'string' ? setThumbPath(path) : setThumbPath('');
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
		}, [isUploading, thumbnailPreview, videoURL]);

		const aspectRatio = (resolution?.width || 1) / (resolution?.height || 1);

		const dynamicImageSize = widthThumbnail
			? { width: widthThumbnail, height: heightThumbnail }
			: getAspectRatioSize({
					aspectRatio,
					width: widthMedia
				});

		const videoSize = useMemo(() => {
			if (widthThumbnail) {
				return {
					width: isMultiple ? widthMedia / 2 : Math.min(widthThumbnail, widthMedia),
					height: isMultiple ? heightMedia / 2 : (heightThumbnail * Math.min(widthThumbnail, widthMedia)) / widthThumbnail
				};
			} else {
				return {
					width: !dynamicImageSize?.height && !isUploading ? widthMedia : isMultiple ? widthMedia / 2 : dynamicImageSize.width * 0.8,
					height: !dynamicImageSize?.height && !isUploading ? heightMedia : isMultiple ? heightMedia / 2 : dynamicImageSize.height * 0.8
				};
			}
		}, [dynamicImageSize.height, dynamicImageSize.width, heightThumbnail, isMultiple, isUploading, widthThumbnail]);

		const styles = style(isUploading, videoSize.width, videoSize.height, isMultiple);

		if (!videoURL) return null;

		const renderThumbnailPreview = () => {
			if (!thumbnailPreview) {
				return (
					<View style={styles.skeleton}>
						<ActivityIndicator />
					</View>
				);
			}

			return (
				<>
					{Platform.OS === 'android' ? (
						<FastImage
							source={{ uri: thumbnailPreview || '', cache: FastImage.cacheControl.immutable }}
							style={styles.video}
							resizeMode={isMultiple ? 'cover' : 'contain'}
						/>
					) : (
						<Image source={{ uri: thumbnailPreview || '' }} style={styles.video} />
					)}
					<View style={styles.iconFlagVideo}>
						<Entypo size={size.s_16} name="video" style={{ color: '#ffffff' }} />
					</View>
				</>
			);
		};

		return (
			<View style={styles.container}>
				{isUploading ? (
					renderThumbnailPreview()
				) : (
					<TouchableOpacity onPress={handlePlayVideo} onLongPress={onLongPress} style={styles.videoContainer}>
						<ImageNative url={thumbPath || ''} style={styles.video} resizeMode={isMultiple ? 'cover' : 'contain'} />
						<View style={styles.iconPlayVideo}>
							<Entypo size={size.s_40} name="controller-play" style={{ color: '#eaeaea' }} />
						</View>
					</TouchableOpacity>
				)}
			</View>
		);
	},
	(prevProps, nextProps) =>
		prevProps.videoURL === nextProps.videoURL &&
		prevProps.isMultiple === nextProps.isMultiple &&
		prevProps.thumbnailPreview === nextProps.thumbnailPreview
);
