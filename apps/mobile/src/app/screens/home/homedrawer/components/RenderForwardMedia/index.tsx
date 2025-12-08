import { size, useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useState } from 'react';
import { NativeModules, Platform, Text, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../components/ImageNative';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { checkFileTypeImage, isVideo } from '../../../../../utils/helpers';
import { style } from './styles';

export const RenderForwardMedia = React.memo(({ attachment, count }: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [thumbPath, setThumbPath] = useState('');

	const isShowImage = checkFileTypeImage(attachment?.filetype);
	const checkIsVideo = isVideo(attachment?.url?.toLowerCase());

	const generateThumbnailIOS = async (videoPath = '') => {
		try {
			const thumbnail = await NativeModules.VideoThumbnailModule.getThumbnail(videoPath);
			setThumbPath(thumbnail?.uri || '');
		} catch (error) {
			console.error('Error generating thumbnail:', error, videoPath);
			throw error;
		}
	};

	useEffect(() => {
		if (checkIsVideo && attachment?.url) {
			if (Platform.OS === 'android') {
				try {
					if (NativeModules?.VideoThumbnail?.getThumbnail) {
						NativeModules.VideoThumbnail.getThumbnail(attachment.url)
							.then((path: string) => {
								path && typeof path === 'string' ? setThumbPath(path) : setThumbPath('');
							})
							.catch((err: any) => {
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
				generateThumbnailIOS(attachment.url);
			}
		}
	}, [checkIsVideo, attachment?.url]);

	if (isShowImage) {
		return (
			<View style={styles.fileViewer}>
				<ImageNative url={attachment?.url} style={styles.image} />
				{!!count && (
					<View style={styles.countOverlay}>
						<Text style={styles.countText}>+{count}</Text>
					</View>
				)}
			</View>
		);
	}

	if (checkIsVideo) {
		return (
			<View style={styles.fileViewer}>
				<ImageNative url={thumbPath || attachment?.thumbnail_url} style={styles.video} />
				<View style={styles.videoOverlay}>
					<MezonIconCDN icon={IconCDN.playIcon} color={themeValue.bgViolet} />
				</View>
				{!!count && (
					<View style={styles.countOverlay}>
						<Text style={styles.countText}>+{count}</Text>
					</View>
				)}
			</View>
		);
	}

	return (
		<View style={styles.fileViewer}>
			<MezonIconCDN icon={IconCDN.fileIcon} width={size.s_30} height={size.s_30} color={themeValue.bgViolet} />
			{!!count && (
				<View style={styles.countOverlay}>
					<Text style={styles.countText}>+{count}</Text>
				</View>
			)}
		</View>
	);
});
