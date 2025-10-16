import { appActions, useAppDispatch } from '@mezon/store-mobile';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Clipboard from '@react-native-clipboard/clipboard';
import { useCallback } from 'react';
import { Alert, Linking, NativeModules, Platform } from 'react-native';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import RNFetchBlob from 'rn-fetch-blob';

const { ImageClipboardModule } = NativeModules;

export function useImage() {
	const dispatch = useAppDispatch();

	const downloadImage = useCallback(
		async (imageUrl: string, type: string) => {
			try {
				let filePath = '';

				if (imageUrl.startsWith('data:image/')) {
					const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
					const extension = type === 'webp' && Platform.OS === 'ios' ? 'png' : type || 'png';
					filePath = `${RNFetchBlob.fs.dirs.CacheDir}/image_${Date.now()}.${extension}`;

					await RNFetchBlob.fs.writeFile(filePath, base64Data, 'base64');
					return filePath;
				} else {
					const response = await RNFetchBlob.config({
						fileCache: true,
						appendExt: type === 'webp' && Platform.OS === 'ios' ? 'png' : type || 'png'
					}).fetch('GET', imageUrl);

					if (response.info().status === 200) {
						filePath = response.path();
						return filePath;
					} else {
						console.error('Error downloading image:', response.info());
						return null;
					}
				}
			} catch (error) {
				console.error('Error downloading image:', error);
			} finally {
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[dispatch]
	);

	type GetImageOptions = { forSharing?: boolean };
	const getImageAsBase64OrFile = async (imageUrl: string, type?: string, options?: GetImageOptions) => {
		try {
			let base64Data: string;
			let filePath: string;
			let extension = type || 'png';

			const useOutgoingShareDir = options?.forSharing === true;
			const baseDir = RNFetchBlob.fs.dirs.CacheDir + (useOutgoingShareDir ? '/outgoing_share' : '');
			if (useOutgoingShareDir) {
				try {
					const exists = await RNFetchBlob.fs.exists(baseDir);
					if (!exists) await RNFetchBlob.fs.mkdir(baseDir);
				} catch (e) {
					console.error('Error creating directory:', e);
				}
			}

			if (imageUrl.startsWith('data:image/')) {
				const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
				if (!type) {
					const mimeMatch = imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
					if (mimeMatch?.[1]) extension = mimeMatch[1];
				}
				filePath = `${baseDir || RNFetchBlob.fs.dirs.CacheDir}/image_${Date.now()}.${extension}`;
				await RNFetchBlob.fs.writeFile(filePath, base64Data, 'base64');
			} else {
				filePath = `${baseDir || RNFetchBlob.fs.dirs.CacheDir}/image_${Date.now()}.${extension}`;
				const res = await RNFetchBlob.config({ path: filePath }).fetch('GET', imageUrl);
				base64Data = await RNFetchBlob.fs.readFile(res.path(), 'base64');
			}

			if (!base64Data) throw new Error('Failed to get base64 data');
			if (Platform.OS === 'ios') {
				if (ImageClipboardModule && ImageClipboardModule?.copyImageFromPath) {
					await ImageClipboardModule.copyImageFromPath(filePath);
				} else {
					const fileUrl = `file://${filePath}`;
					await Clipboard.setImage(fileUrl);
				}
			} else {
				await ImageClipboardModule.setImage(base64Data);
			}

			return {
				base64: base64Data,
				filePath,
				dataUri: `data:image/${extension};base64,${base64Data}`
			};
		} catch (err) {
			console.error('Error processing image:', err);
			throw err;
		}
	};

	const checkAndRequestPermission = async () => {
		const permission = Platform.select({
			ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
			android:
				typeof Platform.Version === 'number' && Platform.Version >= 33
					? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
					: typeof Platform.Version === 'number' && Platform.Version >= 29
						? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
						: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
		});

		if (!permission) return false;

		try {
			const result = await check(permission);

			switch (result) {
				case RESULTS.GRANTED:
					return true;
				case RESULTS.DENIED: {
					const requestResult = await request(permission);
					return requestResult === RESULTS.GRANTED;
				}
				case RESULTS.BLOCKED:
					return false;
				default:
					return false;
			}
		} catch {
			return false;
		}
	};

	const openAppSettings = () => {
		if (Platform.OS === 'ios') {
			Linking.openURL('app-settings:');
		} else {
			Linking.openSettings();
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

	const saveImageToCameraRoll = useCallback(
		async (filePath: string, type: string, isShowSuccessToast = true, isUnlink = true) => {
			try {
				const hasPermission = await checkAndRequestPermission();
				if (!hasPermission) {
					alertOpenSettings();
					return;
				}
				await CameraRoll.save(filePath, { type: type === 'video' ? 'video' : 'photo' });

				isShowSuccessToast &&
					Toast.show({
						text1: 'Save successfully',
						type: 'info'
					});
			} catch (err) {
				Toast.show({
					text1: err?.message ? err?.message : 'Error saving image',
					type: 'error'
				});
				throw err;
			} finally {
				if (Platform.OS === 'android' && isUnlink) {
					await RNFetchBlob.fs.unlink(filePath);
				}
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[dispatch]
	);

	return {
		downloadImage,
		saveImageToCameraRoll,
		getImageAsBase64OrFile
	};
}
