import { ActionEmitEvent, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel } from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { DeviceEventEmitter, DimensionValue, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
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
	penPosition?: {
		top?: number;
		left?: number;
		right?: number;
		bottom?: number;
	};
	noDefaultText?: boolean;
	disabled?: boolean;
	onPressAvatar?: () => void;
	imageWidth?: number;
	imageHeight?: number;
	autoCloseBottomSheet?: boolean;
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
			penPosition = {
				bottom: undefined,
				top: -7,
				left: undefined,
				right: -7
			},
			noDefaultText,
			disabled,
			onPressAvatar,
			imageHeight,
			imageWidth,
			autoCloseBottomSheet = true
		}: IMezonImagePickerProps,
		ref
	) {
		const { themeValue } = useTheme();
		const styles = _style(themeValue);
		const [image, setImage] = useState<string>(defaultValue);
		const currentChannel = useSelector(selectCurrentChannel);
		const { sessionRef, clientRef } = useMezon();
		const timerRef = useRef<any>(null);

		useEffect(() => {
			setImage(defaultValue);
		}, [defaultValue]);

		useEffect(() => {
			return () => {
				timerRef?.current && clearTimeout(timerRef.current);
			};
		}, []);

		async function handleUploadImage(file: IFile) {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!file || !client || !session) {
				throw new Error('Client is not initialized');
			}
			const res = await handleUploadFileMobile(client, session, currentChannel?.clan_id, currentChannel?.channel_id, file.name, file);
			return res.url;
		}

		async function handleImage() {
			try {
				const croppedFile = await openPicker({
					mediaType: 'photo',
					includeBase64: true,
					cropping: true,
					compressImageQuality: QUALITY_IMAGE_UPLOAD,
					...(typeof width === 'number' && { width: imageWidth || width * SCALE }),
					...(typeof height === 'number' && { height: imageWidth || height * SCALE })
				});
				setImage(croppedFile.path);
				onChange && onChange(croppedFile);
				if (autoUpload) {
					const uploadImagePayload = {
						fileData: croppedFile?.data,
						name: croppedFile?.filename || croppedFile?.path?.split?.('/')?.pop?.().trim() || 'image',
						uri: croppedFile.path,
						size: croppedFile.size,
						type: croppedFile.mime,
						height: croppedFile.height,
						width: croppedFile.width
					} as IFile;
					const url = await handleUploadImage(uploadImagePayload);
					if (url) {
						onLoad && onLoad(url);
					}
				}
				autoCloseBottomSheet && DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				autoCloseBottomSheet && DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				console.error('Error in handleImage:', error);
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
							<Text style={styles.textPlaceholder}>Choose an image</Text>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	})
);
