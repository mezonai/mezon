import { Block, Colors, size, Text } from '@mezon/mobile-ui';
import { AttachmentEntity, selectAttachmentPhoto } from '@mezon/store';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet } from 'react-native';
import Gallery, { GalleryRef, RenderItemInfo } from 'react-native-awesome-gallery';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import LoadingModal from '../LoadingModal/LoadingModal';
import { RenderFooterModal } from './RenderFooterModal';
import { RenderHeaderModal } from './RenderHeaderModal';

interface IImageListModalProps {
	visible?: boolean;
	onClose?: () => void;
	imageSelected?: AttachmentEntity;
}

interface IVisibleToolbarConfig {
	showHeader: boolean;
	showFooter: boolean;
}
const ORIGIN_SCALE = 1;
const TIME_TO_HIDE_THUMBNAIL = 5000;
const TIME_TO_SHOW_SAVE_IMAGE_SUCCESS = 3000;

export const ImageListModal = React.memo((props: IImageListModalProps) => {
	const { visible, onClose, imageSelected } = props;
	const { t } = useTranslation('common');
	const [currentImage, setCurrentImage] = useState<AttachmentEntity | null>(null);
	const [visibleToolbarConfig, setVisibleToolbarConfig] = useState<IVisibleToolbarConfig>({ showHeader: true, showFooter: false });
	const [currentScale, setCurrentScale] = useState(1);
	const [showSavedImage, setShowSavedImage] = useState(false);
	const [isLoadingSaveImage, setIsLoadingSaveImage] = useState(false);
	const allImageList = useSelector(selectAttachmentPhoto());
	const ref = useRef<GalleryRef>(null);
	const footerTimeoutRef = useRef<NodeJS.Timeout>(null);
	const imageSavedTimeoutRef = useRef<NodeJS.Timeout>(null);

	const initialIndex = useMemo(() => {
		return allImageList.findIndex((file) => file?.url === imageSelected?.url);
	}, [allImageList, imageSelected]);

	const formattedImageList = useMemo(() => {
		const index = allImageList.findIndex((file) => file?.url === imageSelected?.url);
		return index === -1 ? [{ ...imageSelected, id: `${Snowflake.generate()}` }, ...allImageList] : allImageList;
	}, [allImageList, imageSelected]);

	const updateToolbarConfig = useCallback(
		(newValue: Partial<IVisibleToolbarConfig>) => {
			setVisibleToolbarConfig({ ...visibleToolbarConfig, ...newValue });
		},
		[visibleToolbarConfig]
	);

	const onIndexChange = useCallback(
		(newIndex: number) => {
			if (formattedImageList[newIndex]?.id !== currentImage?.id) {
				setCurrentImage(formattedImageList[newIndex]);
				ref.current?.reset(); //Note: reset scale
			}
		},
		[currentImage?.id, formattedImageList]
	);

	const setTimeoutHideFooter = useCallback(() => {
		footerTimeoutRef.current = setTimeout(() => {
			updateToolbarConfig({
				showFooter: false
			});
		}, TIME_TO_HIDE_THUMBNAIL);
	}, [updateToolbarConfig]);

	const onTap = () => {
		updateToolbarConfig({
			showHeader: !visibleToolbarConfig.showHeader,
			showFooter: !visibleToolbarConfig.showHeader
		});
	};

	const clearTimeoutFooter = () => {
		footerTimeoutRef.current && clearTimeout(footerTimeoutRef.current);
	};

	const onPanStart = () => {
		clearTimeoutFooter();
		if (visibleToolbarConfig.showFooter) {
			setTimeoutHideFooter();
			return;
		}
		if (!visibleToolbarConfig.showFooter && currentScale === 1) {
			updateToolbarConfig({ showFooter: true });
			setTimeoutHideFooter();
			return;
		}
	};

	const onDoubleTap = (toScale: number) => {
		if (toScale > ORIGIN_SCALE) {
			clearTimeoutFooter();
			updateToolbarConfig({
				showHeader: false,
				showFooter: false
			});
		}
	};

	const onImageThumbnailChange = useCallback(
		(image: AttachmentEntity) => {
			const imageIndexSelected = formattedImageList?.findIndex((i) => i?.id === image?.id);
			if (imageIndexSelected > -1) {
				setCurrentImage(image);
				ref.current?.setIndex(imageIndexSelected);
				ref.current?.reset();

				if (visibleToolbarConfig.showFooter) {
					clearTimeoutFooter();
					setTimeoutHideFooter();
				}
			}
		},
		[formattedImageList, setTimeoutHideFooter, visibleToolbarConfig?.showFooter]
	);

	const renderItem = ({ item, setImageDimensions }: RenderItemInfo<ApiMessageAttachment>) => {
		return (
			<FastImage
				source={{ uri: item?.url ?? '' }}
				style={StyleSheet.absoluteFillObject}
				resizeMode="contain"
				onLoad={(e) => {
					const { width, height } = e.nativeEvent;
					setImageDimensions({ width, height });
				}}
			/>
		);
	};

	const onImageSaved = useCallback(() => {
		setShowSavedImage(true);
		imageSavedTimeoutRef.current = setTimeout(() => {
			setShowSavedImage(false);
		}, TIME_TO_SHOW_SAVE_IMAGE_SUCCESS);
	}, []);

	const onLoading = useCallback((isLoading) => {
		setIsLoadingSaveImage(isLoading);
	}, []);

	useEffect(() => {
		if (visibleToolbarConfig.showFooter) {
			clearTimeout(footerTimeoutRef.current);
			setTimeoutHideFooter();
		}
	}, [visibleToolbarConfig?.showFooter, currentImage?.id, setTimeoutHideFooter]);

	useEffect(() => {
		return () => {
			footerTimeoutRef.current && clearTimeout(footerTimeoutRef.current);
			imageSavedTimeoutRef.current && clearTimeout(imageSavedTimeoutRef.current);
		};
	}, []);

	const setScaleDebounced = useThrottledCallback(setCurrentScale, 300);

	return (
		<Modal visible={visible}>
			<Block flex={1}>
				{visibleToolbarConfig.showHeader && (
					<RenderHeaderModal onClose={onClose} imageSelected={currentImage} onImageSaved={onImageSaved} onLoading={onLoading} />
				)}
				<Gallery
					ref={ref}
					initialIndex={initialIndex === -1 ? 0 : initialIndex}
					data={formattedImageList}
					keyExtractor={(item, index) => `${item?.filename}_${index}`}
					onSwipeToClose={onClose}
					onIndexChange={onIndexChange}
					renderItem={renderItem}
					onDoubleTap={onDoubleTap}
					onTap={onTap}
					onPanStart={onPanStart}
					onScaleChange={setScaleDebounced}
				/>
				<RenderFooterModal
					allImageList={formattedImageList}
					visible={visibleToolbarConfig.showFooter}
					imageSelected={currentImage}
					onImageThumbnailChange={onImageThumbnailChange}
				/>
				{showSavedImage && (
					<Block position="absolute" top={'50%'} width={'100%'} alignItems="center">
						<Block backgroundColor={Colors.bgDarkSlate} padding={size.s_10} borderRadius={size.s_10}>
							<Text color={Colors.white}>{t('savedSuccessfully')}</Text>
						</Block>
					</Block>
				)}
			</Block>
			<LoadingModal isVisible={isLoadingSaveImage} />
		</Modal>
	);
});
