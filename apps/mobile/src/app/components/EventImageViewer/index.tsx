import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { AttachmentEntity, ChannelTimelineAttachment } from '@mezon/store-mobile';
import { sleep } from '@mezon/store-mobile';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Platform, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { GalleryRef, RenderItemInfo } from 'react-native-awesome-gallery';
import GalleryAwesome from 'react-native-awesome-gallery';
import Toast from 'react-native-toast-message';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useThrottledCallback } from 'use-debounce';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { useImage } from '../../hooks/useImage';
import { ItemImageModal } from '../ImageListModal/ItemImageModal';
import { RenderFooterModal } from '../ImageListModal/RenderFooterModal';
import { style as stylesFn } from '../ImageListModal/styles';
import LoadingModal from '../LoadingModal/LoadingModal';

interface IEventImageViewerProps {
	images: ChannelTimelineAttachment[];
	imageSelected: ChannelTimelineAttachment;
}

const ORIGIN_SCALE = 1;
const TIME_TO_SHOW_SAVE_IMAGE_SUCCESS = 3000;

const mapToAttachmentEntity = (att: ChannelTimelineAttachment): AttachmentEntity => ({
	id: att.id,
	url: att.file_url,
	filename: att.file_name,
	filetype: att.file_type,
	size: Number(att.file_size) || 0,
	width: att.width,
	height: att.height
});

export const EventImageViewer = React.memo((props: IEventImageViewerProps) => {
	const { width, height } = useWindowDimensions();
	const { images, imageSelected } = props;
	const { t } = useTranslation(['common']);
	const { themeValue } = useTheme();
	const styles = stylesFn(themeValue);

	const formattedImageList = useMemo(() => {
		return images.map(mapToAttachmentEntity);
	}, [images]);

	const initialSelectedEntity = useMemo(() => mapToAttachmentEntity(imageSelected), [imageSelected]);
	const [currentImage, setCurrentImage] = useState<AttachmentEntity | null>(initialSelectedEntity);
	const [visibleToolbarConfig, setVisibleToolbarConfig] = useState({ showHeader: true, showFooter: false });
	const [showSavedImage, setShowSavedImage] = useState(false);
	const [isLoadingSaveImage, setIsLoadingSaveImage] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const { downloadImage, saveMediaToCameraRoll, getImageAsBase64OrFile } = useImage();

	const ref = useRef<GalleryRef>(null);
	const currentScaleRef = useRef<number>(1);
	const imageSavedTimeoutRef = useRef<NodeJS.Timeout>(null);

	const initialIndex = useMemo(() => {
		const idx = formattedImageList.findIndex((file) => file?.url === initialSelectedEntity?.url);
		return idx === -1 ? 0 : idx;
	}, [formattedImageList, initialSelectedEntity]);

	const onClose = useCallback(() => {
		if (Math.floor(currentScaleRef?.current) === 1) {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		}
	}, []);

	const updateToolbarConfig = useCallback((newValue: Partial<typeof visibleToolbarConfig>) => {
		setVisibleToolbarConfig((prev) => ({ ...prev, ...newValue }));
	}, []);

	useEffect(() => {
		if (currentImage?.url && formattedImageList?.length > 0) {
			const newIndex = formattedImageList.findIndex((item) => item?.url === currentImage.url);
			if (newIndex !== -1) {
				ref.current?.setIndex(newIndex);
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
		}
	}, [updateToolbarConfig, visibleToolbarConfig?.showFooter]);

	const onDoubleTap = useCallback(
		(toScale: number) => {
			if (toScale > ORIGIN_SCALE) {
				updateToolbarConfig({ showHeader: false, showFooter: false });
			}
		},
		[updateToolbarConfig]
	);

	const onImageThumbnailChange = useCallback(
		(image: AttachmentEntity) => {
			const imageIndexSelected = formattedImageList.findIndex((i) => i?.id === image?.id);
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

	useEffect(() => {
		const sub = Dimensions.addEventListener('change', async () => {
			await sleep(100);
			ref?.current?.reset();
		});
		return () => sub.remove();
	}, []);

	const setScaleDebounced = useThrottledCallback((scale: number) => {
		currentScaleRef.current = scale;
	}, 300);

	const handleDownloadImage = async () => {
		setShowTooltip(false);
		if (!currentImage?.url) return;
		setIsLoadingSaveImage(true);
		try {
			const { url, filetype } = currentImage;
			const filetypeParts = filetype?.split?.('/');
			const filePath = await downloadImage(url, filetype?.includes('image') ? filetypeParts?.[1] || 'png' : 'png');
			if (filePath) {
				await saveMediaToCameraRoll(`file://${filePath}`, filetype?.includes('image') ? (filetypeParts?.[0] ?? 'image') : 'image', false);
				onImageSaved();
			}
		} catch (error) {
			console.error('Error downloading image: ', error);
		} finally {
			setIsLoadingSaveImage(false);
		}
	};

	const handleCopyImage = async () => {
		setShowTooltip(false);
		if (!currentImage?.url) return;
		setIsLoadingSaveImage(true);
		try {
			const { url, filetype } = currentImage;
			const image = await getImageAsBase64OrFile(url, filetype?.includes('image') ? filetype?.split?.('/')?.[1] || 'png' : 'png');
			if (image) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('copyImage'),
						leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={'#676b73'} />
					}
				});
			}
		} catch (error) {
			console.error('Error copying image: ', error);
		} finally {
			setIsLoadingSaveImage(false);
		}
	};

	const handleShareImage = async () => {
		setShowTooltip(false);
		if (!currentImage?.url) return;
		setIsLoadingSaveImage(true);
		try {
			const { url, filetype, filename } = currentImage;
			const imageData = await getImageAsBase64OrFile(url, filetype?.includes('image') ? filetype?.split?.('/')?.[1] || 'png' : 'png', {
				forSharing: true
			});
			if (!imageData?.filePath) return;
			const Share = (await import('react-native-share')).default;
			await Share.open({
				url: `file://${imageData.filePath}`,
				type: filetype?.includes('image') ? filetype || 'image/png' : 'image/png',
				filename: filename || 'image',
				failOnCancel: false
			});
		} catch (error) {
			console.error('Error sharing image: ', error);
		} finally {
			setIsLoadingSaveImage(false);
		}
	};

	const toggleTooltip = () => {
		setShowTooltip((prev) => !prev);
	};

	return (
		<View style={styles.container}>
			{/* Simplified Header */}
			<View
				style={[
					styles.headerContainer,
					{ paddingTop: Platform.OS === 'ios' ? size.s_40 : size.s_30 },
					!visibleToolbarConfig.showHeader && { height: 0, zIndex: -1 }
				]}
			>
				<View style={styles.headerLeftSection}>
					<TouchableOpacity onPress={onClose}>
						<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={baseColor.white} />
					</TouchableOpacity>
				</View>
				<Tooltip
					isVisible={showTooltip}
					content={
						<View style={styles.option}>
							<TouchableOpacity style={styles.itemOption} onPress={handleCopyImage}>
								<Text style={styles.textOption}>{t('copy')}</Text>
								<MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
							</TouchableOpacity>
							<TouchableOpacity style={styles.itemOption} onPress={handleShareImage}>
								<Text style={styles.textOption}>{t('share')}</Text>
								<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
							</TouchableOpacity>
							<TouchableOpacity style={[styles.itemOption, { borderBottomWidth: 0 }]} onPress={handleDownloadImage}>
								<Text style={styles.textOption}>{t('download')}</Text>
								<MezonIconCDN icon={IconCDN.downloadIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
							</TouchableOpacity>
						</View>
					}
					contentStyle={{
						zIndex: 100,
						backgroundColor: themeValue.primary,
						borderRadius: size.s_10,
						minWidth: size.s_165,
						paddingVertical: size.s_10,
						top: Platform.OS === 'android' ? -size.s_50 : 0,
						left: Platform.OS === 'android' ? size.s_10 : 0
					}}
					arrowSize={{ width: 0, height: 0 }}
					placement="bottom"
					onClose={toggleTooltip}
					closeOnBackgroundInteraction={true}
					disableShadow={true}
					closeOnContentInteraction={true}
				>
					<TouchableOpacity onPress={toggleTooltip} style={styles.iconTooltip}>
						<MezonIconCDN icon={IconCDN.moreVerticalIcon} height={size.s_20} width={size.s_18} color={baseColor.white} />
					</TouchableOpacity>
				</Tooltip>
			</View>

			<GalleryAwesome
				ref={ref}
				style={styles.galleryContainer}
				numToRender={1}
				containerDimensions={{ height, width }}
				initialIndex={initialIndex}
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
