import { size, useTheme } from '@mezon/mobile-ui';
import { AttachmentEntity } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getAspectRatioSize, useImageResolution } from 'react-native-zoom-toolkit';
import { style } from './styles';
interface IRenderFooterModalProps {
	imageSelected?: AttachmentEntity;
	onImageThumbnailChange: (image: AttachmentEntity) => void;
	visible?: boolean;
	allImageList: AttachmentEntity[];
}

export const RenderFooterModal = memo((props: IRenderFooterModalProps) => {
	const { imageSelected, onImageThumbnailChange, visible, allImageList } = props;
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const { resolution } = useImageResolution({ uri: imageSelected?.url });
	const imageSize = getAspectRatioSize({
		aspectRatio: resolution?.width / resolution?.height,
		width: size.s_60
	});
	const flatListRef = useRef<Animated.FlatList<AttachmentEntity>>(null);

	useEffect(() => {
		if (imageSelected?.id) {
			const index = allImageList?.findIndex((file) => file?.id === imageSelected?.id);
			if (index >= 0 && flatListRef.current && visible) {
				flatListRef.current.scrollToIndex({
					animated: true,
					viewPosition: 0.5,
					index
				});
			}
		}
	}, [imageSelected?.id]);

	const handlePress = (imageFile: AttachmentEntity) => {
		if (imageFile?.id !== imageSelected?.id) {
			onImageThumbnailChange(imageFile);
		}
	};

	const renderItem = ({ item }: { item: AttachmentEntity }) => {
		const isSelected = item?.id === imageSelected?.id;
		return (
			<TouchableOpacity onPress={() => handlePress(item)}>
				<View style={[styles.imageWrapper, isSelected && [styles.imageSelected, { width: imageSize.width }]]}>
					<FastImage
						source={{
							uri: createImgproxyUrl(item?.url ?? '', { width: 50, height: 50, resizeType: 'fit' })
						}}
						style={[styles.image]}
						resizeMode={imageSelected ? 'cover' : 'contain'}
					/>
				</View>
			</TouchableOpacity>
		);
	};
	return (
		<View
			style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				zIndex: 1,
				justifyContent: 'space-between',
				flexDirection: 'row',
				backgroundColor: 'rgba(0, 0, 0, 0.4)',
				width: '100%',
				height: visible ? size.s_100 : 0,
				alignItems: 'center'
			}}
		>
			<View>
				<Animated.FlatList
					horizontal
					ref={flatListRef}
					data={allImageList}
					renderItem={renderItem}
					keyExtractor={(item, index) => `${item?.id}_${index}}`}
					showsHorizontalScrollIndicator={false}
					decelerationRate="fast"
				/>
			</View>
		</View>
	);
});
