import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, appActions, getStoreAsync, referencesActions, selectChannelById, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { checkIsThread, getMaxFileSize, isFileSizeExceeded, isImageFile } from '@mezon/utils';
import Geolocation from '@react-native-community/geolocation';
import { errorCodes, pick, types } from '@react-native-documents/picker';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Linking, PermissionsAndroid, Platform, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IFile } from '../../../../../componentUI/MezonImagePicker';
import ShareLocationConfirmModal from '../../../../../components/ShareLocationConfirmModal';
import { IconCDN } from '../../../../../constants/icon_cdn';
import Gallery from './Gallery';
import { style } from './styles';
export type AttachmentPickerProps = {
	mode?: number;
	currentChannelId?: string;
	currentClanId?: string;
	onCancel?: (isForcesKeyboard?: boolean) => void;
};

function AttachmentPicker({ mode, currentChannelId, currentClanId, onCancel }: AttachmentPickerProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['message', 'sharing', 'common']);
	const timeRef = useRef<any>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		return () => {
			timeRef?.current && clearTimeout(timeRef.current);
		};
	}, []);

	const onPickFiles = async () => {
		try {
			timeRef.current = setTimeout(() => {
				dispatch(appActions.setIsFromFCMMobile(true));
			}, 500);
			const res = await pick({
				type: [types.allFiles]
			});
			const file = res?.[0];
			if (file && isFileSizeExceeded(file as any)) {
				const maxSize = getMaxFileSize(file as any);
				const maxSizeMB = Math.round(maxSize / 1024 / 1024);
				const isImage = isImageFile(file as any);
				const fileTypeText = isImage ? t('common:image') : t('common:files');
				
				Toast.show({
					type: 'error',
					text1: t('sharing:fileTooLarge'),
					text2: t('sharing:fileSizeExceeded', { fileType: fileTypeText, maxSize: maxSizeMB })
				});
				return;
			}

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentChannelId,
					files: [
						{
							filename: file?.name || file?.uri,
							url: file?.uri || (file as any)?.fileCopyUri,
							filetype: file?.type,
							size: file.size as number
						}
					]
				})
			);

			timeRef.current = setTimeout(() => {
				dispatch(appActions.setIsFromFCMMobile(false));
			}, 2000);
		} catch (err) {
			timeRef.current = setTimeout(() => {
				dispatch(appActions.setIsFromFCMMobile(false));
			}, 2000);
			if (err?.code === errorCodes.OPERATION_CANCELED) {
				onCancel?.();
				// User cancelled the picker
			} else {
				throw err;
			}
		}
	};

	const handleSelectedAttachments = useCallback((file: IFile) => {
		dispatch(
			referencesActions.setAtachmentAfterUpload({
				channelId: currentChannelId,
				files: [
					{
						filename: file.name,
						url: file.uri,
						filetype: file.type,
						size: file.size as number,
						width: file?.width,
						height: file?.height,
						thumbnail: file?.thumbnailPreview
					}
				]
			})
		);
	}, []);

	const checkLocationPermission = async () => {
		try {
			if (Platform.OS === 'android') {
				return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
			}
			return false;
		} catch (error) {
			console.warn('Permission check error:', error);
			return false;
		}
	};

	const requestLocationPermission = async () => {
		if (Platform.OS === 'android') {
			const granted = await checkLocationPermission();
			if (granted) {
				return true;
			} else {
				try {
					const requestResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
						title: 'Mezon App Location Permission',
						message: 'Share location needs access to your location permission.',
						buttonNeutral: 'Ask Me Later',
						buttonNegative: 'Cancel',
						buttonPositive: 'OK'
					});
					return requestResult === PermissionsAndroid.RESULTS.GRANTED;
				} catch (error) {
					console.warn('Permission request error:', error);
				}
				return false;
			}
		}
		return true;
	};

	const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
		return new Promise((resolve, reject) => {
			Geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					resolve({ latitude, longitude });
				},
				(error) => reject(error)
			);
		});
	};

	const openSettings = () => {
		Alert.alert('Location permission', 'Mezon needs your permission to access location', [
			{
				text: 'Cancel',
				style: 'cancel',
				onPress: () => {
					Toast.show({
						type: 'error',
						text1: 'Permission Denied',
						text2: 'Mezon needs your permission to access location.'
					});
				}
			},
			{
				text: 'OK',
				onPress: () => {
					if (Platform.OS === 'ios') {
						Linking.openURL('app-settings:');
					} else {
						Linking.openSettings();
					}
				}
			}
		]);
	};

	const handleLinkGoogleMap = async () => {
		const permissionGranted = await requestLocationPermission();
		if (permissionGranted) {
			try {
				onCancel?.(true);
				const { latitude, longitude } = await getCurrentPosition();
				const store = await getStoreAsync();
				let mode = ChannelStreamMode.STREAM_MODE_CHANNEL;
				const currentDirectId = selectDmGroupCurrentId(store.getState());
				if (currentDirectId) {
					mode = ChannelStreamMode.STREAM_MODE_DM;
				} else {
					const channel = selectChannelById(store.getState(), currentChannelId as string) as ChannelsEntity;
					const isThread = checkIsThread(channel);
					if (isThread) {
						mode = ChannelStreamMode.STREAM_MODE_THREAD;
					}
				}

				const geoLocation = {
					latitude,
					longitude
				};
				const data = {
					children: (
						<ShareLocationConfirmModal
							mode={mode}
							channelId={currentDirectId ? currentDirectId : currentChannelId}
							geoLocation={geoLocation}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			} catch (error) {
				console.error(error);
			}
		} else {
			console.error('Location permission denied');
			openSettings();
		}
	};

	const handleShowAllAlbums = useCallback(async () => {
		try {
			const result = await launchImageLibrary({
				selectionLimit: 10,
				mediaType: 'mixed'
			});

			if (!result?.assets?.length) {
				return;
			}
			const convertedFiles = result.assets.map((asset) => ({
				...asset,
				uri: Platform.OS === 'ios' && asset?.uri?.startsWith?.('file://') ? asset.uri.replace('file://', '') : asset.uri,
				name: asset?.fileName || `image_${Date.now()}`,
				size: asset?.fileSize || 0
			}));

			// Validate size for each selected file before processing
			const validFiles: IFile[] = [];
			let hasShownError = false;
			for (const file of convertedFiles as IFile[]) {
				if (file && isFileSizeExceeded(file as any)) {
					const isImage = isImageFile({ type: (file as any)?.type } as any);
					const maxAllowedSize = getMaxFileSize({ type: (file as any)?.type } as any);
					if (!hasShownError) {
						const fileTypeText = isImage ? t('common:image') : t('common:files');
						const maxSizeMB = Math.round(maxAllowedSize / 1024 / 1024);
						Toast.show({
							type: 'error',
							text1: t('sharing:fileTooLarge'),
							text2: t('sharing:fileSizeExceeded', { fileType: fileTypeText, maxSize: maxSizeMB })
						});
						hasShownError = true;
					}
					continue;
				}
				validFiles.push(file);
			}

			if (!validFiles.length) return;

			// Batch process all valid attachments
			validFiles.forEach(handleSelectedAttachments);
		} catch (error) {
			console.error('Failed to select images from library:', error);
			Toast.show({
				type: 'error',
				text1: 'Failed to access photo library',
				text2: 'Please try again or check permissions'
			});
		}
	}, [handleSelectedAttachments]);

	return (
		<View style={styles.container}>
			<View style={styles.wrapperHeader}>
				<TouchableOpacity activeOpacity={0.8} style={styles.buttonHeader} onPress={() => handleLinkGoogleMap()}>
					<MezonIconCDN icon={IconCDN.locationIcon} height={20} width={20} color={themeValue.text} />
					<Text style={styles.titleButtonHeader}>{t('message:actions.location')}</Text>
				</TouchableOpacity>
				<TouchableOpacity activeOpacity={0.8} style={styles.buttonAlbum} onPress={() => handleShowAllAlbums()}>
					<View style={styles.albumButtonGroup}>
						<Text style={styles.albumTitle}>{t('message:actions.allAlbums')}</Text>
						<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.textStrong} height={size.s_16} width={size.s_16} />
					</View>
				</TouchableOpacity>
				<TouchableOpacity activeOpacity={0.8} onPress={onPickFiles} style={styles.buttonHeader}>
					<MezonIconCDN icon={IconCDN.attachmentIcon} height={20} width={20} color={themeValue.text} />
					<Text style={styles.titleButtonHeader}>{t('message:actions.files')}</Text>
				</TouchableOpacity>
			</View>
			<Gallery onPickGallery={handleSelectedAttachments} currentChannelId={currentChannelId} />
		</View>
	);
}

export default AttachmentPicker;
