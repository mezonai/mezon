import { Metrics, size, useTheme } from '@mezon/mobile-ui';
import { EMimeTypes, createImgproxyUrl } from '@mezon/utils';
import * as Sentry from '@sentry/react-native';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getAspectRatioSize, useImageResolution } from 'react-native-zoom-toolkit';
import ImageNative from '../../../../../components/ImageNative';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

const widthMedia = Metrics.screenWidth - 150;
const heightMedia = Metrics.screenHeight * 0.3;

type ImageProps = {
	url: string;
	width?: number;
	height?: number;
	filetype?: string;
};

type RenderImageProps = {
	image: ImageProps;
	imageOriginal?: ImageProps;
	index?: number;
	disable?: boolean;
	onPress: (image: ImageProps) => void;
	onLongPress?: (image?: ApiMessageAttachment) => void;
	isMultiple?: boolean;
	remainingImagesCount?: number;
	isTablet?: boolean;
};

type ImageSize = {
	width: number;
	height: number;
};

type ImageProxyResult = {
	isProxyImage: boolean;
	url: string;
	urlOriginal?: string;
};

const calculateImageSize = (imageWidth: number, imageHeight: number) => {
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
	const screenAspectRatio = screenWidth / screenHeight;
	const imageAspectRatio = imageWidth / imageHeight;

	let calculatedWidth = screenWidth;
	let calculatedHeight = screenHeight;

	if (imageAspectRatio > screenAspectRatio) {
		// Image is wider than the screen
		calculatedWidth = screenWidth;
		calculatedHeight = screenWidth / imageAspectRatio;
	} else {
		// Image is taller than the screen
		calculatedHeight = screenHeight;
		calculatedWidth = screenHeight * imageAspectRatio;
	}

	return {
		width: Math.round(calculatedWidth * 0.9),
		height: Math.round(calculatedHeight * 0.9)
	};
};

const RenderImageChat = React.memo(({ image, index, disable, onPress, onLongPress, isMultiple = false, remainingImagesCount }: RenderImageProps) => {
	const isTabletLandscape = useTabletLandscape();
	const [loadError, setLoadError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [imageOriginal, setImageOriginal] = useState<ImageProps | null>(null);
	const MAX_RETRY_COUNT = 1;

	const handleImageError = useCallback(
		(error: any) => {
			console.error('Image loading failed:', error, image.url);
			Sentry.captureException(error, {
				tags: {
					component: 'RenderImageChat',
					imageUrl: image.url
				},
				extra: {
					imageDetails: image,
					retryCount
				}
			});

			if (retryCount < MAX_RETRY_COUNT) {
				setRetryCount((prev) => prev + 1);
				setLoadError(false);
			} else {
				setImageOriginal(image);
			}
		},
		[image, retryCount]
	);

	const imageSize = useMemo(
		() => getImageSize({ height: image?.height, width: image?.width, url: image?.url }),
		[image?.height, image?.url, image?.width]
	);

	if (loadError) {
		return null;
	}

	return (
		<ImageRenderer
			image={image}
			imageOriginal={imageOriginal}
			imageSize={imageSize}
			index={index}
			disable={disable}
			onPress={onPress}
			onLongPress={onLongPress}
			isMultiple={isMultiple}
			remainingImagesCount={remainingImagesCount}
			isTablet={isTabletLandscape}
			onError={handleImageError}
			retryAttempt={retryCount}
		/>
	);
});

const getImageSize = ({ url, height, width }: { url?: string; height?: number; width?: number }): ImageSize | Record<string, never> => {
	const isImageCheckIn = url?.includes('checkin.nccsoft');

	if (isImageCheckIn) {
		return {
			height: heightMedia,
			width: widthMedia
		};
	}

	if (height && width) {
		return { height, width };
	}

	return {};
};

const ImageRenderer = React.memo(
	({
		image,
		imageOriginal,
		imageSize,
		index,
		disable,
		onPress,
		onLongPress,
		isMultiple,
		remainingImagesCount,
		isTablet,
		onError,
		retryAttempt
	}: RenderImageProps & {
		imageSize: any;
		onError: (error: any) => void;
		retryAttempt: number;
	}) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { resolution } = useImageResolution({ uri: imageOriginal?.url ?? image?.url });

		const aspectRatio = (resolution?.width || 1) / (resolution?.height || 1);
		const dynamicImageSize = imageSize?.width
			? imageSize
			: getAspectRatioSize({
					aspectRatio,
					width: widthMedia
				});

		const isUploading = !image?.url?.includes('http') && !image?.url?.includes('data:image/png;base64');

		const photoSize = useMemo(() => {
			if (imageSize?.width) {
				return {
					width: isMultiple ? widthMedia / 2 : Math.min(imageSize.width, widthMedia),
					height: isMultiple ? heightMedia / 2 : (imageSize.height * Math.min(imageSize.width, widthMedia)) / imageSize.width
				};
			} else {
				return {
					width: !dynamicImageSize?.height && !isUploading ? widthMedia : isMultiple ? widthMedia / 2 : dynamicImageSize.width * 0.8,
					height: !dynamicImageSize?.height && !isUploading ? heightMedia : isMultiple ? heightMedia / 2 : dynamicImageSize.height * 0.8
				};
			}
		}, [dynamicImageSize, imageSize, isMultiple, isUploading]);

		const imageProxyObj = useMemo((): ImageProxyResult => {
			if (!image.url || imageOriginal?.url) {
				return { isProxyImage: false, url: imageOriginal?.url ?? '' };
			}

			const isSpecialFormat = ['image/gif', 'image/webp', 'gif', 'webp'].includes(image.filetype) || image?.url?.includes(EMimeTypes.tenor);

			if (isSpecialFormat) {
				return {
					isProxyImage: false,
					url: image.url
				};
			}

			return {
				isProxyImage: true,
				url: createImgproxyUrl(image?.url ?? '', {
					...calculateImageSize(image?.width || 500, image?.height || 500),
					resizeType: 'fit'
				}) as string,
				urlOriginal: image.url
			};
		}, [image.filetype, image?.height, image.url, image?.width, imageOriginal?.url]);

		if (!image.url) {
			return null;
		}

		const imageStyle = {
			width: photoSize?.width / (isTablet ? 1.8 : 1),
			height: photoSize?.height / (isTablet ? 1.8 : 1),
			opacity: isUploading ? 0.5 : 1,
			marginVertical: !remainingImagesCount && !isMultiple ? size.s_6 : 0
		};

		const containerStyle = [styles.imageMessageRender, imageStyle];

		const handleLongPressImage = () => {
			if (!remainingImagesCount) {
				onLongPress?.(image);
			}
		};

		return (
			<TouchableOpacity
				disabled={isUploading || disable}
				activeOpacity={0.3}
				key={`${index}-${retryAttempt}`}
				onPress={() => onPress(image)}
				onLongPress={handleLongPressImage}
				style={containerStyle}
			>
				{imageProxyObj?.isProxyImage ? (
					<ImageNative
						url={imageProxyObj?.url}
						urlOriginal={image?.url}
						resizeMode={isMultiple ? 'cover' : 'contain'}
						style={styles.imageFullSize}
					/>
				) : (
					<FastImage
						source={{
							uri: imageProxyObj?.url,
							priority: FastImage.priority.normal,
							cache: FastImage.cacheControl.immutable
						}}
						resizeMode={isMultiple ? 'cover' : 'contain'}
						style={styles.imageFullSize}
						onError={() => onError(new Error(`FastImage load failed for ${imageProxyObj?.url}`))}
					/>
				)}

				{!!remainingImagesCount && (
					<View
						style={[
							styles.overlay,
							{
								width: photoSize?.width / (isTablet ? 1.8 : 1),
								height: photoSize?.height / (isTablet ? 1.8 : 1)
							}
						]}
					>
						<Text style={styles.moreText}>+{remainingImagesCount}</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	}
);

export { RenderImageChat };
