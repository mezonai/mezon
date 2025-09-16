import { size } from '@mezon/mobile-ui';
import { formatTimeToMMSS, PreSendAttachment } from '@mezon/utils';
import { PhotoIdentifier } from '@react-native-camera-roll/camera-roll';
import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { style } from './styles';

interface GalleryItemProps {
	item: any;
	index: number;
	themeValue: any;
	isDisableSelectAttachment: boolean;
	attachmentFilteredByChannelId: PreSendAttachment;
	onOpenCamera: () => void;
	handleGalleryPress: (file: PhotoIdentifier, index: number) => Promise<void>;
	handleRemove: (filename: string) => void;
}

const GalleryItem = ({
	item,
	index,
	themeValue,
	isDisableSelectAttachment,
	attachmentFilteredByChannelId,
	onOpenCamera,
	handleGalleryPress,
	handleRemove
}: GalleryItemProps) => {
	const styles = style(themeValue);
	const fileName = item?.node?.image?.filename + index;
	const isVideo = item?.node?.type?.startsWith?.('video');
	const isSelected = attachmentFilteredByChannelId?.files.some((file) => file.filename === fileName);
	const disabled = isDisableSelectAttachment && !isSelected;
	const [isLoadingImage, setIsLoadingImage] = useState(true);

	const getDurationSec = (): number | undefined => {
		return item?.node?.image?.playableDuration ?? item?.node?.image?.duration ?? item?.node?.playableDuration ?? undefined;
	};

	useEffect(() => {
		if (item?.node?.image?.uri && Platform.OS === 'ios') {
			Image.prefetch(item?.node?.image?.uri).catch((error) => console.error('Image prefetch failed:', error));
		}
	}, [item?.node?.image?.uri]);

	if (item?.isUseCamera) {
		return (
			<TouchableOpacity style={[styles.cameraPicker]} onPress={onOpenCamera}>
				<MezonIconCDN icon={IconCDN.cameraIcon} color={themeValue.text} width={size.s_24} height={size.s_24} />
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.itemGallery, disabled && styles.disable]}
			onPress={() => {
				if (isSelected) {
					handleRemove(fileName);
				} else {
					handleGalleryPress(item, index);
				}
			}}
			disabled={disabled}
		>
			{Platform.OS === 'android' ? (
				<FastImage
					source={{ uri: `${item?.node?.image?.uri}?thumbnail=true&quality=low`, cache: FastImage.cacheControl.immutable }}
					style={styles.imageGallery}
					onLoadEnd={() => setIsLoadingImage(false)}
				/>
			) : (
				<Image
					source={{ uri: item?.node?.image?.uri + '?thumbnail=true&quality=low' }}
					style={styles.imageGallery}
					onLoadEnd={() => setIsLoadingImage(false)}
				/>
			)}
			{isLoadingImage && (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="small" color={themeValue.text} />
				</View>
			)}
			{isVideo && (
				<View style={styles.videoOverlay}>
					<MezonIconCDN icon={IconCDN.playIcon} width={size.s_8} height={size.s_8} />
					<Text style={styles.videoDuration}> {formatTimeToMMSS(getDurationSec() ?? 0)}</Text>
				</View>
			)}
			{isSelected && (
				<View style={styles.iconSelected}>
					<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.bgViolet} />
				</View>
			)}
			{isSelected && <View style={styles.selectedOverlay} />}
		</TouchableOpacity>
	);
};

export default memo(GalleryItem);
