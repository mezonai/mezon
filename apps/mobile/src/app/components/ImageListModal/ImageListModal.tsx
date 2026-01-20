import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size } from '@mezon/mobile-ui';
import type { AttachmentEntity } from '@mezon/store-mobile';
import { selectGalleryAttachmentsByChannel, sleep, useAppSelector } from '@mezon/store-mobile';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Text, View, useWindowDimensions } from 'react-native';
import type { GalleryRef, RenderItemInfo } from 'react-native-awesome-gallery';
import GalleryAwesome from 'react-native-awesome-gallery';
import Toast from 'react-native-toast-message';
import { useThrottledCallback } from 'use-debounce';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import LoadingModal from '../LoadingModal/LoadingModal';
import { ItemImageModal } from './ItemImageModal';
import { RenderFooterModal } from './RenderFooterModal';
import { RenderHeaderModal } from './RenderHeaderModal';
import { style as stylesFn } from './styles';

interface IImageListModalProps {
	imageSelected?: AttachmentEntity;
	channelId: string;
	disableGoback?: boolean;
}

interface IVisibleToolbarConfig {
	showHeader: boolean;
	showFooter: boolean;
}
const ORIGIN_SCALE = 1;
const TIME_TO_SHOW_SAVE_IMAGE_SUCCESS = 3000;

export const ImageListModal = React.memo((props: IImageListModalProps) => {
	const { width, height } = useWindowDimensions();
	const { imageSelected, channelId, disableGoback = false } = props;
	const { t } = useTranslation(['common', 'message']);
	const styles = stylesFn();
	const [currentImage, setCurrentImage] = useState<AttachmentEntity | null>(imageSelected);
	const [visibleToolbarConfig, setVisibleToolbarConfig] = useState<IVisibleToolbarConfig>({ showHeader: true, showFooter: false });
	const [showSavedImage, setShowSavedImage] = useState(false);
	const [isLoadingSaveImage, setIsLoadingSaveImage] = useState(false);
	const galleryAttachmentsByChannel = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, channelId));

	const ref = useRef<GalleryRef>(null);
	const currentScaleRef = useRef<number>(1);
	const imageSavedTimeoutRef = useRef<NodeJS.Timeout>(null);

	const formattedImageList = useMemo(() => {
		const attachments =
			galleryAttachmentsByChannel?.filter((attachment) => !attachment?.url?.includes(`${process.env.NX_BASE_IMG_URL}/stickers`)) ?? [];
		let index: number;
		if (attachments?.length) {
			index = attachments.findIndex((file) => file?.url === imageSelected?.url);
		} else {
			index = -1;
		}
		const list =
			index === -1
				? [{ ...imageSelected, id: `${Snowflake.generate()}` }, ...(attachments ? attachments : [])]
				: attachments
					? attachments
					: [];
		return [...list].reverse();
	}, [galleryAttachmentsByChannel, imageSelected]);

	const initialIndex = useMemo(() => {
		if (formattedImageList?.length) {
			return formattedImageList?.findIndex((file) => file?.url === imageSelected?.url);
		} else {
			return 0;
		}
	}, [formattedImageList, imageSelected]);

	const onClose = useCallback(() => {
		if (Math.floor(currentScaleRef?.current) === 1) DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, []);

	const updateToolbarConfig = useCallback(
		(newValue: Partial<IVisibleToolbarConfig>) => {
			setVisibleToolbarConfig({ ...visibleToolbarConfig, ...newValue });
		},
		[visibleToolbarConfig]
	);

	useEffect(() => {
		if (currentImage?.url && formattedImageList?.length > 0) {
			try {
				const newIndex = formattedImageList?.findIndex((item) => item?.url === currentImage.url);
				if (newIndex !== -1) {
					ref.current?.setIndex(newIndex);
				}
			} catch (error) {
				console.error('Error finding image index:', error);
			}
		}
	}, [currentImage?.url, formattedImageList]);

	const onIndexChange = useCallback(
		(newIndex: number) => {
			if (formattedImageList?.[newIndex]?.id !== currentImage?.id) {
				setCurrentImage(formattedImageList[newIndex]);
				ref.current?.reset();
			}
		},
		[currentImage, formattedImageList]
	);

	const onTap = useCallback(() => {
		updateToolbarConfig({
			showHeader: !visibleToolbarConfig.showHeader,
			showFooter: !visibleToolbarConfig.showHeader
		});
	}, [updateToolbarConfig, visibleToolbarConfig?.showHeader]);

	const onPanStart = useCallback(() => {
		if (!visibleToolbarConfig.showFooter && currentScaleRef?.current === 1) {
			updateToolbarConfig({ showFooter: true });
			return;
		}
	}, [updateToolbarConfig, visibleToolbarConfig?.showFooter]);

	const onDoubleTap = useCallback(
		(toScale: number) => {
			if (toScale > ORIGIN_SCALE) {
				updateToolbarConfig({
					showHeader: false,
					showFooter: false
				});
			}
		},
		[updateToolbarConfig]
	);

	const onImageThumbnailChange = useCallback(
		(image: AttachmentEntity) => {
			const imageIndexSelected = formattedImageList?.findIndex((i) => i?.id === image?.id);
			if (imageIndexSelected > -1) {
				setCurrentImage(image);
				ref.current?.setIndex(imageIndexSelected);
				ref.current?.reset();
			}
		},
		[formattedImageList]
	);

	const renderItem = useCallback(({ item, index, setImageDimensions }: RenderItemInfo<ApiMessageAttachment>) => {
		return <ItemImageModal index={index} item={item} setImageDimensions={setImageDimensions} />;
	}, []);

	const onImageSaved = useCallback(() => {
		setShowSavedImage(true);
		imageSavedTimeoutRef.current = setTimeout(() => {
			setShowSavedImage(false);
		}, TIME_TO_SHOW_SAVE_IMAGE_SUCCESS);
	}, []);

	const onLoading = useCallback((isLoading) => {
		setIsLoadingSaveImage(isLoading);
	}, []);

	const onImageCopy = useCallback((error?: string) => {
		if (!error) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('copyImage'),
					leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={'#676b73'} />
				}
			});
		} else {
			Toast.show({
				type: 'error',
				text1: t('copyImageFailed', { error })
			});
		}
	}, []);

	const onImageShare = useCallback((error?: string) => {
		if (!error) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('message:toast.shareImageSuccess'),
					leadingIcon: <MezonIconCDN icon={IconCDN.shareIcon} color={baseColor.green} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('message:toast.shareImageFailed', { error }),
					leadingIcon: <MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.red} />
				}
			});
		}
	}, []);

	useEffect(() => {
		const sub = Dimensions.addEventListener('change', async ({ window }) => {
			await sleep(100);
			ref?.current?.reset();
		});
		return () => sub.remove();
	}, []);

	const setScaleDebounced = useThrottledCallback((scale: number) => {
		currentScaleRef.current = scale;
	}, 300);

	return (
		<View style={styles.container}>
			<RenderHeaderModal
				imageSelected={currentImage}
				onImageSaved={onImageSaved}
				visible={visibleToolbarConfig.showHeader}
				onLoading={onLoading}
				onImageCopy={onImageCopy}
				onImageShare={onImageShare}
				disableGoback={disableGoback}
			/>
			<GalleryAwesome
				ref={ref}
				style={styles.galleryContainer}
				numToRender={1}
				containerDimensions={{ height, width }}
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
				<View style={styles.savedImageContainer}>
					<View style={styles.savedImageBox}>
						<Text style={styles.savedImageText}>{t('savedSuccessfully')}</Text>
					</View>
				</View>
			)}
			<LoadingModal isVisible={isLoadingSaveImage} />
		</View>
	);
});
