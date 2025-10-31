import { size } from '@mezon/mobile-ui';
import { formatTimeToMMSS } from '@mezon/utils';
import type { PhotoIdentifier } from '@react-native-camera-roll/camera-roll';
import React, { memo, useMemo } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { FastNativeImage } from '../../../../../../../components/ImageNative/FastNativeImage';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { style } from './styles';

interface GalleryItemProps {
	item: any;
	index: number;
	themeValue: any;
	isSelected: boolean;
	disabled: boolean;
	fileName: string;
	isVideo: boolean;
	onOpenCamera: () => void;
	handleGalleryPress: (file: PhotoIdentifier, index: number) => Promise<void>;
	handleRemove: (filename: string) => void;
}

const GalleryItem = ({
	item,
	index,
	themeValue,
	isSelected,
	disabled,
	fileName,
	isVideo,
	onOpenCamera,
	handleGalleryPress,
	handleRemove
}: GalleryItemProps) => {
	const styles = useMemo(() => style(themeValue), [themeValue]);

	const imageUri = useMemo(() => {
		const uri = item?.node?.image?.uri;
		return uri ? `${uri}?thumbnail=true&quality=low` : undefined;
	}, [item?.node?.image?.uri]);

	const durationSec = useMemo((): number | undefined => {
		return item?.node?.image?.playableDuration ?? item?.node?.image?.duration ?? item?.node?.playableDuration ?? undefined;
	}, [item?.node?.image?.playableDuration, item?.node?.image?.duration, item?.node?.playableDuration]);

	if (item?.isUseCamera) {
		return (
			<TouchableOpacity style={[styles.cameraPicker]} onPress={onOpenCamera}>
				<MezonIconCDN icon={IconCDN.cameraIcon} color={themeValue.text} width={size.s_24} height={size.s_24} />
			</TouchableOpacity>
		);
	}

	const handlePickGallery = () => {
		if (isSelected) {
			handleRemove(fileName);
		} else {
			handleGalleryPress(item, index);
		}
	};

	return (
		<TouchableOpacity style={[styles.itemGallery, disabled && styles.disable]} onPress={handlePickGallery} disabled={disabled} activeOpacity={1}>
			<ShimmerPlaceHolder
				shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
				shimmerStyle={styles.itemGallerySkeleton}
				LinearGradient={LinearGradient}
			/>
			{Platform.OS === 'android' ? (
				<FastImage source={{ uri: imageUri, cache: FastImage.cacheControl.immutable }} style={styles.imageGallery} />
			) : (
				<FastNativeImage
					source={{
						uri: imageUri,
						priority: 'normal'
					}}
					style={styles.imageGallery}
				/>
			)}
			{isVideo && (
				<View style={styles.videoOverlay}>
					<MezonIconCDN icon={IconCDN.playIcon} width={size.s_8} height={size.s_8} />
					<Text style={styles.videoDuration}> {formatTimeToMMSS(durationSec ?? 0)}</Text>
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

export default memo(GalleryItem, (prevProps, nextProps) => {
	return prevProps.isSelected === nextProps.isSelected && prevProps.disabled === nextProps.disabled;
});
