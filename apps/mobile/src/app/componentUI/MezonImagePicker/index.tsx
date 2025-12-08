import { ActionEmitEvent, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { openCropper, openPicker } from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import MezonClanAvatar from '../MezonClanAvatar';
import { style as _style } from './styles';

export interface IFile {
	uri: string;
	name: string;
	type: string;
	size: number | string;
	fileData: any;
	height?: number;
	width?: number;
	thumbnailPreview?: string;
}

interface IMezonImagePickerProps {
	onChange?: (file: any) => void;
	onLoad?: (url: string) => void;
	defaultValue: string;
	localValue?: any;
	height?: DimensionValue;
	width?: DimensionValue;
	rounded?: boolean;
	showHelpText?: boolean;
	autoUpload?: boolean;
	alt?: string;
	style?: StyleProp<ViewStyle>;
	defaultColor?: string;
	noDefaultText?: boolean;
	disabled?: boolean;
	onPressAvatar?: () => void;
	imageWidth?: number;
	imageHeight?: number;
	autoCloseBottomSheet?: boolean;
	isOauth?: boolean;
	imageSizeLimit?: number;
}

export interface IMezonImagePickerHandler {
	openSelector: () => void;
}

const SCALE = 5;

export async function handleSelectImage() {
	const response = await launchImageLibrary({
		mediaType: 'photo',
		includeBase64: true,
		quality: 1
	});

	if (response.didCancel) {
		//
	} else if (response.errorCode) {
		//
	} else {
		const file = response.assets[0];
		return {
			uri: file?.uri,
			name: file?.fileName,
			type: file?.type,
			size: file?.fileSize,
			fileData: file?.base64
		} as IFile;
	}
}

export default memo(
	forwardRef(function MezonImagePicker(
		{
			onChange,
			onLoad,
			defaultValue,
			height = 60,
			width = 60,
			showHelpText,
			autoUpload = false,
			rounded = false,
			localValue,
			alt,
			style,
			defaultColor,
			noDefaultText,
			disabled,
			onPressAvatar,
			imageHeight,
			imageWidth,
			autoCloseBottomSheet = true,
			isOauth = false,
			imageSizeLimit
		}: IMezonImagePickerProps,
		ref
	) {
		const { themeValue } = useTheme();
		const styles = _style(themeValue);
		const [image, setImage] = useState<string>(defaultValue);
		const { sessionRef, clientRef } = useMezon();
		const timerRef = useRef<any>(null);
		const { t } = useTranslation(['profile']);

		useEffect(() => {
			setImage(defaultValue);
		}, [defaultValue]);

		useEffect(() => {
			return () => {
				timerRef?.current && clearTimeout(timerRef.current);
			};
		}, []);

		async function handleUploadImage(file: IFile, isOauth = false) {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!file || !client || !session) {
				throw new Error('Client is not initialized');
			}
			const res = await handleUploadFileMobile(client, session, file.name, file, isOauth);
			return res.url;
		}

		async function handleImage() {
			try {
				// First, let user select an image without cropping to check if it's a GIF
				const selectedFile = await openPicker({
					mediaType: 'photo',
					includeBase64: true,
					cropping: false
				});

				if (!!imageSizeLimit && selectedFile.size > imageSizeLimit) {
					const maxSizeMB = Math.round(imageSizeLimit / 1024 / 1024);
					const maxSizeKB = Math.round(imageSizeLimit / 1024);
					Toast.show({
						type: 'error',
						text1: t('imageSizeLimit', { size: maxSizeMB > 0 ? maxSizeMB : maxSizeKB, unit: maxSizeMB > 0 ? 'MB' : 'KB' })
					});
					return;
				}

				const isGif = selectedFile.mime === 'image/gif';

				let finalFile;
				if (isGif) {
					// For GIFs, don't crop to preserve animation
					finalFile = selectedFile;
				} else {
					// For other images, apply cropping and compression
					finalFile = await openCropper({
						path: selectedFile.path,
						mediaType: 'photo',
						includeBase64: true,
						cropping: true,
						compressImageQuality: QUALITY_IMAGE_UPLOAD,
						...(typeof width === 'number' && { width: imageWidth || width * SCALE }),
						...(typeof height === 'number' && { height: imageWidth || height * SCALE })
					});
				}

				setImage(finalFile.path);
				onChange && onChange(finalFile);
				if (autoUpload) {
					const uploadImagePayload = {
						fileData: finalFile?.data,
						name: finalFile?.filename || finalFile?.path?.split?.('/')?.pop?.().trim() || 'image',
						uri: finalFile.path,
						size: finalFile.size,
						type: finalFile.mime,
						height: finalFile.height,
						width: finalFile.width
					} as IFile;
					const url = await handleUploadImage(uploadImagePayload, isOauth);
					if (url) {
						onLoad && onLoad(url);
					}
				}
				autoCloseBottomSheet && DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				autoCloseBottomSheet && DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				console.error('Error in handleImage:', error?.message || error);
				if (error?.message && error?.code !== 'E_PICKER_CANCELLED') {
					Toast.show({
						type: 'error',
						text1: error?.message
					});
				}
			}
		}

		function handlePress() {
			if (onPressAvatar) onPressAvatar();
			else handleImage();
		}

		useImperativeHandle(ref, () => ({
			openSelector() {
				handleImage();
			}
		}));

		return (
			<TouchableOpacity onPress={handlePress} disabled={disabled}>
				<View style={styles.bannerContainer}>
					<View style={[styles.bannerWrapper, { height, width }, rounded && { borderRadius: 999 }, style]}>
						{localValue ? (
							localValue
						) : image || !showHelpText ? (
							<MezonClanAvatar
								image={image}
								alt={alt}
								defaultColor={defaultColor}
								noDefaultText={noDefaultText}
								imageHeight={imageHeight}
								imageWidth={imageWidth}
							/>
						) : (
							<Text style={styles.textPlaceholder}>{t('chooseImage')}</Text>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	})
);
