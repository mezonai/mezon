import { useChatSending } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	accountActions,
	getStoreAsync,
	referencesActions,
	selectAnonymousMode,
	selectChannelById,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentClanPreventAnonymous,
	selectCurrentDM,
	selectCurrentTopicId,
	selectDmGroupById,
	useAppDispatch,
	useAppSelector,
	type ChannelsEntity
} from '@mezon/store-mobile';
import { TypeMessage, checkIsThread, getMaxFileSize, isFileSizeExceeded, isImageFile } from '@mezon/utils';
import Geolocation from '@react-native-community/geolocation';
import { errorCodes, pick, types, type DocumentPickerResponse } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, Keyboard, Linking, PermissionsAndroid, Platform, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import ShareLocationConfirmModal from '../../../../../components/ShareLocationConfirmModal/ShareLocationConfirmModal';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import type { EMessageActionType } from '../../enums';
import { ConfirmBuzzMessageModal } from '../ConfirmBuzzMessage';
import { style } from './styles';

export type IProps = {
	onClose?: (isFocus?: boolean) => void;
	directMessageId?: string;
	currentChannelId?: string;
	messageAction?: EMessageActionType;
};

type FunctionActionId =
	| 'location'
	| 'pickFiles'
	| 'create_thread'
	| 'anonymous'
	| 'buzz'
	| 'ephemeral'
	| 'transfer_funds'
	| 'poll'
	| 'quick_messages';

type AdvancedFunctionItem = {
	id: FunctionActionId;
	label: string;
	icon: IconCDN;
	backgroundColor: string;
	onPress?: () => void;
};

type FileWithDimensions = DocumentPickerResponse & {
	width?: number;
	height?: number;
};

const FUNCTION_COLORS = {
	LOCATION: '#E89A93',
	ATTACHMENT: '#2746e1',
	THREAD: '#9058f2',
	ANONYMOUS: '#09a7ba',
	BUZZ: '#D4667A',
	EPHEMERAL: '#d1b332',
	TRANSFER: '#5BBB8D',
	POLL: '#1c932b'
} as const;

const SHOULD_FOCUS_AFTER_ACTION: FunctionActionId[] = ['quick_messages', 'ephemeral', 'anonymous'];

const AdvancedFunction = memo(({ onClose, currentChannelId, directMessageId, messageAction }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['message', 'sharing', 'common']);
	const dispatch = useAppDispatch();

	const currentChannel = useSelector(selectCurrentChannel);
	const clanId = useAppSelector(selectCurrentClanId);
	const currentTopicId = useAppSelector(selectCurrentTopicId);
	const currentDmGroup = useAppSelector((state) => selectDmGroupById(state, directMessageId));
	const anonymousMode = useAppSelector((state) => selectAnonymousMode(state, clanId));
	const currentClanPreventAnonymous = useAppSelector(selectCurrentClanPreventAnonymous);

	const channelOrDirect = useMemo(() => (directMessageId ? currentDmGroup : currentChannel), [directMessageId, currentDmGroup, currentChannel]);

	const mode = useMemo(() => {
		if (directMessageId && currentDmGroup) {
			return currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
		}
		if (currentChannel) {
			return currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD
				? ChannelStreamMode.STREAM_MODE_THREAD
				: ChannelStreamMode.STREAM_MODE_CHANNEL;
		}
	}, [currentChannel, currentDmGroup, directMessageId]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect,
		fromTopic: !!currentTopicId
	});

	const advancedFunctions: AdvancedFunctionItem[] = useMemo(() => {
		const allFunctions: (AdvancedFunctionItem | false)[] = [
			{
				id: 'location',
				label: t('message:actions:location'),
				icon: IconCDN.locationIcon,
				backgroundColor: FUNCTION_COLORS.LOCATION
			},
			{
				id: 'pickFiles',
				label: t('message:actions:files'),
				icon: IconCDN.attachmentIcon,
				backgroundColor: FUNCTION_COLORS.ATTACHMENT
			},
			!directMessageId &&
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!currentTopicId && {
					id: 'create_thread' as const,
					label: t('common:threads'),
					icon: IconCDN.threadPlusIcon,
					backgroundColor: FUNCTION_COLORS.THREAD
				},
			!directMessageId &&
				!currentClanPreventAnonymous && {
					id: 'anonymous' as const,
					label: anonymousMode ? t('message:turnOffAnonymous') : t('common:anonymous'),
					icon: IconCDN.anonymous,
					backgroundColor: FUNCTION_COLORS.ANONYMOUS
				},
			{
				id: 'buzz',
				label: 'Buzz',
				icon: IconCDN.buzz,
				backgroundColor: FUNCTION_COLORS.BUZZ
			},
			!directMessageId && {
				id: 'ephemeral' as const,
				label: 'Ephemeral',
				icon: IconCDN.bravePermission,
				backgroundColor: FUNCTION_COLORS.EPHEMERAL
			},
			{
				id: 'transfer_funds',
				label: t('common:transferFunds'),
				icon: IconCDN.transactionIcon,
				backgroundColor: FUNCTION_COLORS.TRANSFER
			},
			!directMessageId && {
				id: 'poll' as const,
				label: t('common:poll'),
				icon: IconCDN.pollIcon,
				backgroundColor: FUNCTION_COLORS.POLL
			}
		];

		return allFunctions.filter((item): item is AdvancedFunctionItem => Boolean(item));
	}, [t, directMessageId, currentChannel?.type, currentTopicId, currentClanPreventAnonymous, anonymousMode]);

	const handleCreateThread = useCallback(() => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
			screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD
		});
	}, [navigation]);

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
		const data = {
			children: (
				<MezonConfirm
					title={t('common:permissionNotification.locationPermissionTitle')}
					content={t('common:permissionNotification.locationPermissionDesc')}
					confirmText={t('common:openSettings')}
					onConfirm={() => {
						if (Platform.OS === 'ios') {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
							Linking.openURL('app-settings:');
						} else {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
							Linking.openSettings();
						}
					}}
					onCancel={() => {
						Toast.show({
							type: 'error',
							text1: t('common:permissionNotification.permissionDenied'),
							text2: t('common:permissionNotification.locationPermissionDesc')
						});
					}}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};
	const handleLinkGoogleMap = useCallback(async () => {
		const permissionGranted = await requestLocationPermission();
		if (permissionGranted) {
			try {
				Keyboard.dismiss();
				const { latitude, longitude } = await getCurrentPosition();
				const store = await getStoreAsync();
				let mode = ChannelStreamMode.STREAM_MODE_CHANNEL;
				const currentDirect = selectCurrentDM(store.getState());
				if (currentDirect) {
					mode =
						currentDirect?.type === ChannelType.CHANNEL_TYPE_GROUP
							? ChannelStreamMode.STREAM_MODE_GROUP
							: ChannelStreamMode.STREAM_MODE_DM;
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
							channelId={currentDirect?.id ? currentDirect?.id : currentChannelId}
							geoLocation={geoLocation}
							messageAction={messageAction}
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
	}, [currentChannelId, messageAction]);
	const handleBuzzMessage = useCallback(
		(text: string) => {
			sendMessage({ t: text || 'Buzz!!' }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
		},
		[sendMessage]
	);

	const handleActionBuzzMessage = useCallback(async () => {
		const data = {
			children: <ConfirmBuzzMessageModal onSubmit={handleBuzzMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [handleBuzzMessage]);

	const handleToggleAnonymous = useCallback(() => {
		dispatch(accountActions.setAnonymousMode(clanId));
	}, [clanId, dispatch]);

	const handleTransferFunds = useCallback(() => {
		navigation.push(APP_SCREEN.WALLET, {
			activeScreen: 'transfer'
		});
	}, [navigation]);

	const handlePoll = useCallback(() => {
		sendMessage({ t: '*poll' }, [], [], [], undefined, undefined, undefined);
	}, [sendMessage]);
	const getImageDimension = useCallback((imageUri: string): Promise<{ width: number; height: number }> => {
		return new Promise((resolve) => {
			Image.getSize(
				imageUri,
				(width, height) => {
					resolve({ width, height });
				},
				(error) => {
					console.error('Error getting image dimensions:', error);
				}
			);
		});
	}, []);
	const onPickFiles = useCallback(async () => {
		try {
			const res = await pick({
				type: [types.allFiles]
			});
			const file = res?.[0] as FileWithDimensions;
			const isImage = isImageFile(file as any);
			if (file && isFileSizeExceeded(file as any)) {
				const maxSize = getMaxFileSize(file as any);
				const maxSizeMB = Math.round(maxSize / 1024 / 1024);
				const fileTypeText = isImage ? t('common:image') : t('common:files');

				Toast.show({
					type: 'error',
					text1: t('sharing:fileTooLarge'),
					text2: t('sharing:fileSizeExceeded', { fileType: fileTypeText, maxSize: maxSizeMB })
				});
				return;
			}
			if ((!file?.width || !file?.height) && isImage) {
				const { width = 0, height = 0 } = await getImageDimension(file?.uri);

				file.width = width;
				file.height = height;
			}

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentChannelId,
					files: [
						{
							filename: file?.name || file?.uri,
							url: file?.uri || (file as any)?.fileCopyUri,
							filetype: file?.type,
							size: file.size as number,
							width: file?.width,
							height: file?.height
						}
					]
				})
			);
		} catch (err) {
			if (err?.code === errorCodes.OPERATION_CANCELED) {
				// User cancelled the picker
			} else {
				throw err;
			}
		}
	}, [t, getImageDimension, dispatch, currentChannelId]);

	const actionHandlers = useMemo(
		() => ({
			location: handleLinkGoogleMap,
			create_thread: handleCreateThread,
			buzz: handleActionBuzzMessage,
			anonymous: handleToggleAnonymous,
			transfer_funds: handleTransferFunds,
			quick_messages: () => DeviceEventEmitter.emit(ActionEmitEvent.ON_SEND_ACTION_FROM_ADVANCED_MENU, 'quickMessage'),
			ephemeral: () => DeviceEventEmitter.emit(ActionEmitEvent.ON_SEND_ACTION_FROM_ADVANCED_MENU, 'ephemeral'),
			poll: handlePoll,
			pickFiles: onPickFiles
		}),
		[handleLinkGoogleMap, handleCreateThread, handleActionBuzzMessage, handleToggleAnonymous, handleTransferFunds, handlePoll, onPickFiles]
	);

	const handleFunctionPress = useCallback(
		(_item: AdvancedFunctionItem) => {
			const handler = actionHandlers[_item.id];
			if (handler) {
				handler();
			}

			if (onClose) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false,
					mode: 'force'
				});
				onClose(SHOULD_FOCUS_AFTER_ACTION.includes(_item.id) && !currentTopicId);
			}
		},
		[actionHandlers, currentTopicId, onClose]
	);

	const renderFunctionItem = useCallback(
		(item: AdvancedFunctionItem) => (
			<TouchableOpacity key={item.id} style={styles.functionItem} onPress={() => handleFunctionPress(item)} activeOpacity={0.7}>
				<View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
					<MezonIconCDN icon={item.icon} width={size.s_22} height={size.s_22} color={baseColor.white} />
				</View>
				<Text style={styles.label} numberOfLines={2}>
					{item.label}
				</Text>
			</TouchableOpacity>
		),
		[styles, handleFunctionPress]
	);

	return (
		<View style={styles.container}>
			<View style={styles.gridContainer}>{advancedFunctions.map(renderFunctionItem)}</View>
		</View>
	);
});

export default AdvancedFunction;
