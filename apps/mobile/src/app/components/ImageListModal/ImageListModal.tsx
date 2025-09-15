import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size } from '@mezon/mobile-ui';
import { AttachmentEntity, selectAllListAttachmentByChannel, sleep } from '@mezon/store-mobile';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Text, View, useWindowDimensions } from 'react-native';
import GalleryAwesome, { GalleryRef, RenderItemInfo } from 'react-native-awesome-gallery';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import LoadingModal from '../LoadingModal/LoadingModal';
import { ItemImageModal } from './ItemImageModal';
import { RenderFooterModal } from './RenderFooterModal';
import { RenderHeaderModal } from './RenderHeaderModal';

interface IImageListModalProps {
	imageSelected?: AttachmentEntity;
	channelId: string;
}

interface IVisibleToolbarConfig {
	showHeader: boolean;
	showFooter: boolean;
}
const ORIGIN_SCALE = 1;
const TIME_TO_HIDE_THUMBNAIL = 5000;
const TIME_TO_SHOW_SAVE_IMAGE_SUCCESS = 3000;

export const ImageListModal = React.memo((props: IImageListModalProps) => {
	const { width, height } = useWindowDimensions();
	const { imageSelected, channelId } = props;
	const { t } = useTranslation(['common', 'message']);
	const [currentImage, setCurrentImage] = useState<AttachmentEntity | null>(imageSelected);
	const [visibleToolbarConfig, setVisibleToolbarConfig] = useState<IVisibleToolbarConfig>({ showHeader: true, showFooter: false });
	const [showSavedImage, setShowSavedImage] = useState(false);
	const [isLoadingSaveImage, setIsLoadingSaveImage] = useState(false);
	const attachments = useSelector((state) => selectAllListAttachmentByChannel(state, channelId));
	const ref = useRef<GalleryRef>(null);
	const footerTimeoutRef = useRef<NodeJS.Timeout>(null);
	const currentScaleRef = useRef<number>(1);
	const imageSavedTimeoutRef = useRef<NodeJS.Timeout>(null);

	const initialIndex = useMemo(() => {
		if (attachments?.length) {
			return attachments.findIndex((file) => file?.url === imageSelected?.url);
		} else {
			return 0;
		}
	}, [attachments, imageSelected]);

	const formattedImageList = useMemo(() => {
		let index: number;
		if (attachments?.length) {
			index = attachments.findIndex((file) => file?.url === imageSelected?.url);
		} else {
			index = -1;
		}
		return index === -1
			? [{ ...imageSelected, id: `${Snowflake.generate()}` }, ...(attachments ? attachments : [])]
			: attachments
				? attachments
				: [];
	}, [attachments, imageSelected]);

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

	const setTimeoutHideFooter = useCallback(() => {
		footerTimeoutRef.current = setTimeout(() => {
			updateToolbarConfig({
				showFooter: false
			});
		}, TIME_TO_HIDE_THUMBNAIL);
	}, [updateToolbarConfig]);

	const onTap = useCallback(() => {
		updateToolbarConfig({
			showHeader: !visibleToolbarConfig.showHeader,
			showFooter: !visibleToolbarConfig.showHeader
		});
	}, [updateToolbarConfig, visibleToolbarConfig?.showHeader]);

	const clearTimeoutFooter = () => {
		footerTimeoutRef.current && clearTimeout(footerTimeoutRef.current);
	};

	const onPanStart = useCallback(() => {
		clearTimeoutFooter();
		if (visibleToolbarConfig.showFooter) {
			setTimeoutHideFooter();
			return;
		}
		if (!visibleToolbarConfig.showFooter && currentScaleRef?.current === 1) {
			updateToolbarConfig({ showFooter: true });
			setTimeoutHideFooter();
			return;
		}
	}, [setTimeoutHideFooter, updateToolbarConfig, visibleToolbarConfig?.showFooter]);

	const onDoubleTap = useCallback(
		(toScale: number) => {
			if (toScale > ORIGIN_SCALE) {
				clearTimeoutFooter();
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

				if (visibleToolbarConfig.showFooter) {
					clearTimeoutFooter();
					setTimeoutHideFooter();
				}
			}
		},
		[formattedImageList, setTimeoutHideFooter, visibleToolbarConfig?.showFooter]
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
		<View style={{ flex: 1 }}>
			{visibleToolbarConfig.showHeader && (
				<RenderHeaderModal
					imageSelected={currentImage}
					onImageSaved={onImageSaved}
					onLoading={onLoading}
					onImageCopy={onImageCopy}
					onImageShare={onImageShare}
				/>
			)}
			<GalleryAwesome
				ref={ref}
				style={{ flex: 1 }}
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
				<View style={{ position: 'absolute', top: '50%', width: '100%', alignItems: 'center' }}>
					<View style={{ backgroundColor: '#2a2e31', padding: size.s_10, borderRadius: size.s_10 }}>
						<Text style={{ color: 'white' }}>{t('savedSuccessfully')}</Text>
					</View>
				</View>
			)}
			<LoadingModal isVisible={isLoadingSaveImage} />
		</View>
	);
});
