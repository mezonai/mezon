import { ActionEmitEvent, CheckIcon } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { appActions, useAppDispatch } from '@mezon/store-mobile';
import {
	Album,
	CameraRoll,
	iosReadGalleryPermission,
	iosRefreshGallerySelection,
	iosRequestReadWriteGalleryPermission
} from '@react-native-camera-roll/camera-roll';
import { useEffect, useRef, useState } from 'react';
import { Alert, DeviceEventEmitter, Image, Linking, PermissionsAndroid, Platform, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { style } from './styles';

interface AlbumWithCover extends Album {
	coverPhoto?: string;
}

interface IAlbumProps {
	valueAlbum?: string;
	onAlbumChange?: (album: string) => void;
}

export const AlbumPanel = ({ valueAlbum, onAlbumChange }: IAlbumProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
	const dispatch = useAppDispatch();
	const timerRef = useRef<any>();

	useEffect(() => {
		checkAndRequestPermissions();

		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	const checkAndRequestPermissions = async () => {
		const hasPermission = await requestPermission();
		if (hasPermission) {
			getAlbums();
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

	const handleSelectAlbum = (album: AlbumWithCover) => {
		onAlbumChange(album?.title);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_SELECT_ALBUM, album?.title || '');
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

	const getAlbums = async () => {
		CameraRoll.getAlbums({
			assetType: 'Photos'
		})
			.then(async (r) => {
				const albumsWithCovers = await Promise.all(
					r?.map(async (album) => {
						const albumPhotos = await CameraRoll.getPhotos({
							first: 1,
							assetType: 'All',
							groupTypes: 'Album',
							groupName: album?.title
						});

						return {
							...album,
							coverPhoto: albumPhotos?.edges?.[0]?.node?.image?.uri
						};
					})
				);

				const albumsVideos = await CameraRoll.getAlbums({ assetType: 'Videos' });

				const allPhotos = await CameraRoll.getPhotos({
					first: 1,
					assetType: 'All'
				});

				const allVideos = await CameraRoll.getPhotos({
					first: 1,
					assetType: 'Videos'
				});

				const allAlbum = {
					id: '0',
					title: 'All',
					count: albumsWithCovers?.reduce((acc, album) => acc + album?.count, 0) || 0,
					coverPhoto: allPhotos?.edges?.[0]?.node?.image?.uri || ''
				} as AlbumWithCover;

				const videoAlbum = {
					id: '1',
					title: 'All Videos',
					count: albumsVideos?.reduce((acc, album) => acc + album?.count, 0) || 0,
					coverPhoto: allVideos?.edges?.[0]?.node?.image?.uri || ''
				} as AlbumWithCover;
				setAlbums([allAlbum, videoAlbum, ...(albumsWithCovers || [])]);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const renderItem = ({ item }: { item: AlbumWithCover }) => {
		return (
			<TouchableOpacity
				style={styles.albumItem}
				onPress={() => {
					handleSelectAlbum(item);
				}}
			>
				<Image source={{ uri: item?.coverPhoto }} style={styles.albumCoverImage} />
				<View style={styles.albumTitleAndCount}>
					<Text style={styles.albumTitle}>{item.title}</Text>
					<Text style={styles.albumImageCount}>{item.count}</Text>
				</View>
				{item?.title === valueAlbum && (
					<View style={styles.albumSelectedIcon}>
						<CheckIcon color={baseColor.blurple} />
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.albumPanel}>
			<FlatList data={albums} keyExtractor={(item, index) => `album_item_${item?.id}_${index}`} renderItem={renderItem} />
		</View>
	);
};
