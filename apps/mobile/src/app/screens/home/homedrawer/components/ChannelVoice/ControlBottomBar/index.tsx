import type { TrackReference } from '@livekit/react-native';
import { useLocalParticipant } from '@livekit/react-native';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	jumpToChannel,
	load,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { clansActions, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { createLocalVideoTrack, Track } from 'livekit-client';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Linking, Platform, TouchableOpacity, View } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from '../styles';
import ButtonEndCall from './ButtonEndCall';
import ButtonRaiseHand from './ButtonRaiseHand';
import ToggleMic from './ButtonToggleMic';

const ControlBottomBar = ({
	isShow,
	onPressMinimizeRoom,
	focusedScreenShare,
	channelId,
	clanId,
	isGroupCall = false
}: {
	isShow: boolean;
	focusedScreenShare: TrackReference;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	isGroupCall?: boolean;
}) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { isCameraEnabled, localParticipant } = useLocalParticipant();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation(['common']);

	useEffect(() => {
		if (localParticipant) {
			loadLocalDefaults();
		}
	}, []);

	const loadLocalDefaults = async () => {
		await localParticipant.setCameraEnabled(false);
		await localParticipant.setMicrophoneEnabled(false);
	};

	const checkAndRequestCameraPermission = async () => {
		if (Platform.OS === 'ios') {
			let result = await check(PERMISSIONS.IOS.CAMERA);
			if (result !== RESULTS.GRANTED) {
				result = await request(PERMISSIONS.IOS.CAMERA);
			}
			return result === RESULTS.GRANTED;
		} else if (Platform.OS === 'android') {
			let result = await check(PERMISSIONS.ANDROID.CAMERA);
			if (result !== RESULTS.GRANTED) {
				result = await request(PERMISSIONS.ANDROID.CAMERA);
			}
			return result === RESULTS.GRANTED;
		}
		return false;
	};

	const showPermissionCameraAlert = () => {
		const data = {
			children: (
				<MezonConfirm
					title={t('permissionNotification.cameraPermissionTitle')}
					content={t('permissionNotification.cameraPermissionDesc')}
					confirmText={t('openSettings')}
					onConfirm={() => {
						Linking.openSettings();
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
					}}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handleToggleCamera = async () => {
		try {
			if (isCameraEnabled) {
				await localParticipant.setCameraEnabled(false);
			} else {
				try {
					await localParticipant.setCameraEnabled(true, {
						facingMode: 'user'
					});
				} catch (enableError) {
					if (enableError?.message === 'Permission denied.') {
						const hasPermission = await checkAndRequestCameraPermission();
						if (!hasPermission) {
							showPermissionCameraAlert();
							return;
						}
					}
					try {
						const newVideoTrack = await createLocalVideoTrack();
						const oldPublication = Array.from(localParticipant.videoTrackPublications.values()).find(
							(publication) => publication.source === Track.Source.Camera
						);
						if (oldPublication && oldPublication.track) {
							await localParticipant.unpublishTrack(oldPublication.track, true);
						}
						await localParticipant.publishTrack(newVideoTrack);
					} catch (newError) {
						console.error('err:', newError);
					}
				}
			}
		} catch (error) {
			console.error('Error toggling camera:', error);
		}
	};

	// const startBroadcastIOS = async () => {
	// 	const reactTag = findNodeHandle(screenCaptureRef.current);
	// 	await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
	// 	await localParticipant.setScreenShareEnabled(true);
	// };

	// const handleToggleScreenShare = async () => {
	// 	try {
	// 		if (Platform.OS === 'ios') {
	// 			await startBroadcastIOS();
	// 		} else {
	// 			await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error toggling screen share:', error);
	// 	}
	// };

	const handleShowChat = () => {
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
		}
		joinChannel();
		onPressMinimizeRoom();
	};

	const joinChannel = async () => {
		const clanIdCache = load(STORAGE_CLAN_ID);
		if (clanIdCache !== clanId) {
			const joinAndChangeClan = async (clanId: string) => {
				await Promise.all([dispatch(clansActions.joinClan({ clanId })), dispatch(clansActions.changeCurrentClan({ clanId, noCache: true }))]);
			};
			await joinAndChangeClan(clanId);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		save(STORAGE_CLAN_ID, clanId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, clanId);
	};

	return (
		<View
			style={[
				styles.menuFooter,
				{ bottom: Platform.OS === 'ios' ? (focusedScreenShare ? size.s_20 : insets.top + size.s_80) : size.s_20, zIndex: 2 },
				!isShow && {
					display: 'none'
				}
			]}
		>
			<View style={styles.controlBarContainer}>
				<TouchableOpacity onPress={handleToggleCamera} style={styles.menuIcon}>
					<MezonIconCDN icon={isCameraEnabled ? IconCDN.videoIcon : IconCDN.videoSlashIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
				<ToggleMic />
				{!isGroupCall && (
					<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
						<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
				{!isGroupCall && <ButtonRaiseHand channelId={channelId} />}
				<ButtonEndCall isGroupCall={isGroupCall} channelId={channelId} clanId={clanId} />
			</View>
		</View>
	);
};

export default React.memo(ControlBottomBar);
