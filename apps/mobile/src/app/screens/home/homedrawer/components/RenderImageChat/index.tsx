import { Block, Metrics, size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getAspectRatioSize, useImageResolution } from 'react-native-zoom-toolkit';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

const widthMedia = Metrics.screenWidth - 150;
const heightMedia = Metrics.screenHeight * 0.3;

const RenderImageChat = React.memo(({ image, index, disable, onPress, onLongPress, isMultiple = false, remainingImagesCount }: any) => {
	const imageSize = useMemo(
		() => getImageSize({ height: image?.height, width: image?.width, url: image?.url }),
		[image?.height, image?.url, image?.width]
	);
	const isTabletLandscape = useTabletLandscape();

	if (imageSize?.height && imageSize?.width) {
		return (
			<RenderImageHaveSize
				image={image}
				imageSize={imageSize}
				index={index}
				disable={disable}
				onPress={onPress}
				onLongPress={onLongPress}
				isMultiple={isMultiple}
				remainingImagesCount={remainingImagesCount}
				isTablet={isTabletLandscape}
			/>
		);
	} else {
		return (
			<RenderImage
				image={image}
				index={index}
				disable={disable}
				onPress={onPress}
				onLongPress={onLongPress}
				isMultiple={isMultiple}
				remainingImagesCount={remainingImagesCount}
				isTablet={isTabletLandscape}
			/>
		);
	}
});

const getImageSize = ({ url, height, width }) => {
	const isImageCheckIn = url?.includes('checkin.nccsoft');
	if (isImageCheckIn) {
		return {
			height: heightMedia,
			width: widthMedia
		};
	}

	if (height && width) {
		return {
			height: height,
			width: width
		};
	}
	return {};
};

const RenderImage = React.memo(({ image, index, disable, onPress, onLongPress, isMultiple = false, remainingImagesCount, isTablet = false }: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { resolution } = useImageResolution({ uri: image.url });
	const [isLoadFailProxy, setIsLoadFailProxy] = React.useState<boolean>(false);

	const imageSize = getAspectRatioSize({
		aspectRatio: (resolution?.width || 1) / (resolution?.height || 1),
		width: widthMedia
	});

	const isUploading = !image?.url?.includes('http') && !image?.url?.includes('data:image/png;base64');
	const photoSize = useMemo(() => getPhotoSize(imageSize, isMultiple, isUploading), [imageSize, isMultiple, isUploading]);

	if (!image.url) {
		return null;
	}

	return (
		<TouchableOpacity disabled={isUploading || disable} activeOpacity={0.8} key={index} onPress={() => onPress(image)} onLongPress={onLongPress}>
			<FastImage
				fallback={true}
				style={[
					styles.imageMessageRender,
					{
						width: photoSize?.width / (isTablet ? 1.8 : 1),
						height: photoSize?.height / (isTablet ? 1.8 : 1),
						opacity: isUploading ? 0.5 : 1,
						marginVertical: !remainingImagesCount && !isMultiple ? size.s_6 : 0
					}
				]}
				children={isUploading ? <UploadingIndicator /> : null}
				source={{
					uri: isLoadFailProxy
						? image?.url
						: createImgproxyUrl(image?.url ?? '', { width: image?.width || 500, height: image?.height || 500, resizeType: 'fit' }),
					priority: FastImage.priority.high
				}}
				resizeMode={!imageSize?.height && !isUploading ? 'cover' : isMultiple ? 'cover' : 'contain'}
				onError={() => {
					setIsLoadFailProxy(true);
				}}
			/>
			{!!remainingImagesCount && (
				<RemainingImagesOverlay remainingImagesCount={remainingImagesCount} photoSize={photoSize} styles={styles} isTablet={isTablet} />
			)}
		</TouchableOpacity>
	);
});

const getPhotoSize = (imageSize: any, isMultiple: boolean, isUploading: boolean) => {
	return {
		width: !imageSize?.height && !isUploading ? widthMedia : isMultiple ? widthMedia / 2 : imageSize.width * 0.8,
		height: !imageSize?.height && !isUploading ? heightMedia : isMultiple ? heightMedia / 2 : imageSize.height * 0.8
	};
};

const UploadingIndicator = () => (
	<Block backgroundColor={'rgba(0,0,0,0.5)'} flex={1} alignContent="center" justifyContent="center">
		<ActivityIndicator />
	</Block>
);

const RemainingImagesOverlay = ({ remainingImagesCount, photoSize, styles, isTablet }: any) => (
	<View
		style={{
			...styles.overlay,
			width: photoSize?.width / (isTablet ? 1.8 : 1),
			height: photoSize?.height / (isTablet ? 1.8 : 1)
		}}
	>
		<Text style={styles.moreText}>+{remainingImagesCount}</Text>
	</View>
);

const RenderImageHaveSize = React.memo(
	({ image, imageSize, index, disable, onPress, onLongPress, isMultiple = false, remainingImagesCount, isTablet = false }: any) => {
		const { themeValue } = useTheme();
		const [isLoadFailProxy, setIsLoadFailProxy] = React.useState<boolean>(false);
		const styles = style(themeValue);

		const isUploading = !image?.url?.includes('http') && !image?.url?.includes('data:image/png;base64');
		const photoSize = useMemo(() => getPhotoSizeWithSize(imageSize, isMultiple, isUploading), [imageSize, isMultiple, isUploading]);

		if (!image.url) {
			return null;
		}

		return (
			<TouchableOpacity
				disabled={isUploading || disable}
				activeOpacity={0.8}
				key={index}
				onPress={() => onPress(image)}
				onLongPress={onLongPress}
			>
				<FastImage
					fallback={true}
					style={[
						styles.imageMessageRender,
						{
							width: photoSize?.width / (isTablet ? 1.8 : 1),
							height: photoSize?.height / (isTablet ? 1.8 : 1),
							opacity: isUploading ? 0.5 : 1,
							marginVertical: !remainingImagesCount && !isMultiple ? size.s_6 : 0
						}
					]}
					children={isUploading ? <UploadingIndicator /> : null}
					source={{
						uri: isLoadFailProxy
							? image?.url
							: createImgproxyUrl(image?.url ?? '', { width: image?.width || 500, height: image?.height || 500, resizeType: 'fit' }),
						priority: FastImage.priority.high
					}}
					resizeMode={isMultiple ? 'cover' : 'contain'}
					onError={() => {
						setIsLoadFailProxy(true);
					}}
				/>
				{!!remainingImagesCount && (
					<RemainingImagesOverlay remainingImagesCount={remainingImagesCount} photoSize={photoSize} styles={styles} isTablet={isTablet} />
				)}
			</TouchableOpacity>
		);
	}
);

const getPhotoSizeWithSize = (imageSize: any, isMultiple: boolean, isUploading: boolean) => {
	return {
		width: isUploading ? (isMultiple ? widthMedia / 2 : widthMedia) : isMultiple ? widthMedia / 2 : Math.min(imageSize.width, widthMedia),
		height: isUploading
			? isMultiple
				? heightMedia / 2
				: heightMedia
			: isMultiple
				? heightMedia / 2
				: (imageSize.height * Math.min(imageSize.width, widthMedia)) / imageSize.width
	};
};

export { RenderImageChat };
