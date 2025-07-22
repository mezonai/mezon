import { useReference } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { appActions, useAppDispatch } from '@mezon/store-mobile';
import { MAX_FILE_SIZE } from '@mezon/utils';
import {
	CameraRoll,
	PhotoIdentifier,
	cameraRollEventEmitter,
	iosRefreshGallerySelection,
	iosRequestReadWriteGalleryPermission
} from '@react-native-camera-roll/camera-roll';
import { iosReadGalleryPermission } from '@react-native-camera-roll/camera-roll/src/CameraRollIOSPermission';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, EmitterSubscription, Linking, PermissionsAndroid, Platform, View } from 'react-native';
import RNFS from 'react-native-fs';
import { FlatList } from 'react-native-gesture-handler';
import * as ImagePicker from 'react-native-image-picker';
import { CameraOptions } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { IFile } from '../../../../../../componentUI/MezonImagePicker';
import GalleryItem from './components/GalleryItem';

export const { height } = Dimensions.get('window');
interface IProps {
	onPickGallery: (files: IFile | any) => void;
	currentChannelId: string;
}

const Gallery = ({ onPickGallery, currentChannelId }: IProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['qrScanner']);
	const [hasPermission, setHasPermission] = useState(false);
	const [photos, setPhotos] = useState<PhotoIdentifier[]>([]);
	const [pageInfo, setPageInfo] = useState(null);
	const [isPermissionLimitIOS, setIsPermissionLimitIOS] = useState(false);
	const dispatch = useAppDispatch();
	const timerRef = useRef<any>(null);
	const isLoadingMoreRef = useRef<boolean>(false);
	const { removeAttachmentByIndex, attachmentFilteredByChannelId } = useReference(currentChannelId);

	const isDisableSelectAttachment = useMemo(() => {
		if (!attachmentFilteredByChannelId) return false;
		const { files } = attachmentFilteredByChannelId;
		return files?.length >= 10;
	}, [attachmentFilteredByChannelId]);

	const loadPhotos = useCallback(async (after = null) => {
		if (isLoadingMoreRef?.current) return;
		isLoadingMoreRef.current = true;
		try {
			const res = await CameraRoll.getPhotos({
				first: 32,
				assetType: 'All',
				...(!!after && { after: after }),
				include: ['filename', 'fileSize', 'fileExtension', 'imageSize', 'orientation'],
				groupTypes: 'All'
			});

			setPhotos((prev) => [...(prev || []), ...(res?.edges || [])]);
			setPageInfo(res.page_info);
		} catch (error) {
			console.error('Error loading photos', error);
		} finally {
			isLoadingMoreRef.current = false;
		}
	}, []);

	useEffect(() => {
		const subscription: EmitterSubscription = cameraRollEventEmitter.addListener('onLibrarySelectionChange', (_event) => {
			if (isPermissionLimitIOS) {
				loadPhotos();
			}
		});
		checkAndRequestPermissions();

		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
			if (subscription) {
				subscription.remove();
			}
		};
	}, [isPermissionLimitIOS]);

	const checkAndRequestPermissions = async () => {
		const hasPermission = await requestPermission();
		if (hasPermission) {
			loadPhotos();
		} else {
			await requestPermission();
		}
	};

	const alertOpenSettings = (title?: string, desc?: string) => {
		Alert.alert(title || 'Photo Permission', desc || 'App needs access to your photo library', [
			{
				text: 'Cancel',
				style: 'cancel'
			},
			{
				text: 'OK',
				onPress: () => {
					openAppSettings();
				}
			}
		]);
	};

	const getCheckPermissionPromise = async () => {
		try {
			if (Platform.OS === 'android') {
				if (Platform.Version >= 33) {
					const hasImagePermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
					const hasVideoPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);

					return hasImagePermission && hasVideoPermission;
				} else {
					return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
				}
			}
			return false;
		} catch (error) {
			console.warn('Permission check error:', error);
			return false;
		}
	};

	const requestPermission = async () => {
		if (Platform.OS === 'android') {
			dispatch(appActions.setIsFromFCMMobile(true));
			const hasPermission = await getCheckPermissionPromise();
			if (hasPermission) {
				return true;
			}

			try {
				// For Android 13+ (API 33+)
				if (Platform.Version >= 33) {
					const granted = await PermissionsAndroid.requestMultiple([
						PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
						PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
					]);

					timerRef.current = setTimeout(() => dispatch(appActions.setIsFromFCMMobile(false)), 2000);

					if (
						granted['android.permission.READ_MEDIA_IMAGES'] !== PermissionsAndroid.RESULTS.GRANTED ||
						granted['android.permission.READ_MEDIA_VIDEO'] !== PermissionsAndroid.RESULTS.GRANTED
					) {
						alertOpenSettings();
					}

					return (
						granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED &&
						granted['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED
					);
				}
				// For Android 12 and below
				else {
					const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
						title: 'Photo Library Access',
						message: 'This app needs access to your photo library.',
						buttonNeutral: 'Ask Me Later',
						buttonNegative: 'Cancel',
						buttonPositive: 'OK'
					});

					timerRef.current = setTimeout(() => dispatch(appActions.setIsFromFCMMobile(false)), 2000);

					if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
						alertOpenSettings();
					}

					return granted === PermissionsAndroid.RESULTS.GRANTED;
				}
			} catch (err) {
				console.warn('Permission request error:', err);
				return false;
			}
		} else if (Platform.OS === 'ios') {
			dispatch(appActions.setIsFromFCMMobile(true));

			const result = await iosReadGalleryPermission('readWrite');
			timerRef.current = setTimeout(() => dispatch(appActions.setIsFromFCMMobile(false)), 2000);

			if (result === 'not-determined' || result === 'denied') {
				const requestResult = await iosRequestReadWriteGalleryPermission();
				return requestResult === 'granted' || requestResult === 'limited';
			} else if (result === 'limited') {
				setIsPermissionLimitIOS(true);
				await iosRefreshGallerySelection();
			}

			return result === 'granted' || result === 'limited';
		}

		return false;
	};

	const openAppSettings = () => {
		if (Platform.OS === 'ios') {
			Linking.openURL('app-settings:');
		} else {
			Linking.openSettings();
		}
	};

	const renderItem = ({ item }) => {
		return (
			<GalleryItem
				item={item}
				themeValue={themeValue}
				isDisableSelectAttachment={isDisableSelectAttachment}
				attachmentFilteredByChannelId={attachmentFilteredByChannelId}
				onOpenCamera={onOpenCamera}
				handleGalleryPress={handleGalleryPress}
				handleRemove={handleRemove}
			/>
		);
	};

	const handleGalleryPress = useCallback(
		async (file: PhotoIdentifier) => {
			try {
				const image = file?.node?.image;
				const type = file?.node?.type;
				const name = file?.node?.image?.filename || file?.node?.image?.uri;
				const size = file?.node?.image?.fileSize;

				if (size && size >= MAX_FILE_SIZE) {
					Toast.show({
						type: 'error',
						text1: 'File size cannot exceed 50MB!'
					});
					return;
				}

				let filePath = image?.uri;

				if (Platform.OS === 'ios' && filePath.startsWith('ph://')) {
					const ms = new Date().getTime();
					const ext = image.extension;
					const destPath = `${RNFS.CachesDirectoryPath}/${ms}.${ext}`;

					if (type && type.startsWith('video')) {
						filePath = await RNFS.copyAssetsVideoIOS(filePath, destPath);
					} else {
						filePath = await RNFS.copyAssetsFileIOS(filePath, destPath, image.width, image.height);
					}
				}

				const fileFormat: IFile = {
					uri: filePath,
					type: Platform.OS === 'ios' ? `${file?.node?.type}/${image?.extension}` : file?.node?.type,
					size: size,
					name,
					fileData: filePath,
					width: image?.width,
					height: image?.height
				};

				onPickGallery(fileFormat);
			} catch (err) {
				console.error('Error: ', err);
			}
		},
		[onPickGallery]
	);

	const requestCameraPermission = async () => {
		try {
			if (Platform.OS === 'android') {
				const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
				if (granted === PermissionsAndroid.RESULTS.GRANTED) {
					setHasPermission(true);
					return true;
				} else {
					Alert.alert(
						t('cameraPermissionDenied'),
						t('pleaseAllowCamera'),
						[
							{ text: t('cancel'), style: 'cancel' },
							{ text: t('openSettings'), onPress: () => Linking.openSettings() }
						],
						{ cancelable: false }
					);
					return false;
				}
			} else if (Platform.OS === 'ios') {
				setHasPermission(true);
				return true;
			}
		} catch (err) {
			console.warn(err);
			return false;
		}
		return false;
	};

	const onOpenCamera = useCallback(async () => {
		if (!hasPermission) {
			const granted = await requestCameraPermission();
			if (!granted) return;
		}

		const options = {
			durationLimit: 10000,
			mediaType: 'photo'
		};

		ImagePicker.launchCamera(options as CameraOptions, async (response) => {
			if (response.didCancel) {
				console.warn('User cancelled camera');
			} else if (response.errorCode) {
				console.error('Camera Error: ', response.errorMessage);
			} else {
				const file = response.assets[0];

				const fileFormat: IFile = {
					uri: file?.uri,
					name: file?.fileName,
					type: file?.type,
					size: file?.fileSize,
					fileData: file?.uri,
					width: file?.width,
					height: file?.height
				};

				onPickGallery(fileFormat);
			}
		});
	}, [hasPermission, onPickGallery]);

	const handleLoadMore = async () => {
		if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
			await loadPhotos(pageInfo.end_cursor);
		}
	};

	const handleRemove = useCallback(
		(filename: string) => {
			const index = attachmentFilteredByChannelId?.files?.findIndex((file) => file.filename === filename);
			removeAttachmentByIndex(currentChannelId, index);
		},
		[attachmentFilteredByChannelId, currentChannelId, removeAttachmentByIndex]
	);

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				data={[{ isUseCamera: true }, ...photos]}
				numColumns={3}
				renderItem={renderItem}
				keyExtractor={(item, index) => `${index.toString()}_gallery_${item?.node?.id}`}
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={2}
				updateCellsBatchingPeriod={50}
				scrollEventThrottle={16}
				removeClippedSubviews={true}
				viewabilityConfig={{
					itemVisiblePercentThreshold: 50,
					minimumViewTime: 300
				}}
				contentOffset={{ x: 0, y: 0 }}
				disableVirtualization
				style={{
					maxHeight: height * 0.8
				}}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				ListFooterComponent={() => isLoadingMoreRef?.current && <ActivityIndicator size="small" color={themeValue.text} />}
			/>
		</View>
	);
};

export default Gallery;
