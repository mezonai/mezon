import { QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel } from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { DimensionValue, Platform, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { openCropper } from 'react-native-image-crop-picker';
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
			onPressAvatar
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
			const file = await handleSelectImage();
			if (file) {
				timerRef.current = setTimeout(
					async () => {
						const croppedFile = await openCropper({
							path: file.uri,
							mediaType: 'photo',
							includeBase64: true,
							compressImageQuality: QUALITY_IMAGE_UPLOAD,
							...(typeof width === 'number' && { width: width * SCALE }),
							...(typeof height === 'number' && { height: height * SCALE })
						});
						setImage(croppedFile.path);
						onChange && onChange(croppedFile);
						if (autoUpload) {
							const uploadImagePayload = {
								fileData: croppedFile?.data,
								name: file.name,
								uri: croppedFile.path,
								size: croppedFile.size,
								type: croppedFile.mime
							} as IFile;
							const url = await handleUploadImage(uploadImagePayload);
							if (url) {
								onLoad && onLoad(url);
							}
						}
					},
					Platform.OS === 'ios' ? 500 : 0
				);
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
			<Pressable onPress={handlePress} disabled={disabled}>
				<View style={styles.bannerContainer}>
					<View style={[styles.bannerWrapper, { height, width }, rounded && { borderRadius: 999 }, style]}>
						{localValue ? (
							localValue
						) : image || !showHelpText ? (
							<MezonClanAvatar image={image} alt={alt} defaultColor={defaultColor} noDefaultText={noDefaultText} />
						) : (
							<Text style={styles.textPlaceholder}>Choose an image</Text>
						)}
					</View>
				</View>
			</Pressable>
		);
	})
);
