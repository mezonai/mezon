import { useClans, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, optionNotification } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import {
	appActions,
	checkDuplicateNameClan,
	createSystemMessage,
	defaultNotificationActions,
	fetchSystemMessageByClanId,
	getStoreAsync,
	selectAllChannels,
	selectDefaultNotificationClan,
	updateSystemMessage,
	useAppDispatch
} from '@mezon/store-mobile';
import { EPermission, MAX_FILE_SIZE_10MB, sleep } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import type { ApiSystemMessage, ApiSystemMessageRequest } from 'mezon-js/api.gen';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import MezonInput from '../../../componentUI/MezonInput';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import MezonMenu from '../../../componentUI/MezonMenu';
import MezonOption from '../../../componentUI/MezonOption';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { IconCDN } from '../../../constants/icon_cdn';
import type { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { validInput } from '../../../utils/validate';
import DeleteClanModal from '../../DeleteClanModal';
import { ErrorInput } from '../../ErrorInput';
import ChannelsMessageSystem from './MessageSystemChannel';
import { style } from './styles';

export const { width } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING;
export function ClanOverviewSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { currentClan, updateClan } = useClans();
	const { t } = useTranslation(['clanOverviewSetting']);
	const { t: tNotification } = useTranslation('clanNotificationsSetting');
	const [clanName, setClanName] = useState<string>(currentClan?.clan_name ?? '');
	const [banner, setBanner] = useState<string>(currentClan?.banner ?? '');
	const [loading, setLoading] = useState<boolean>(false);
	const [hasAdminPermission, hasManageClanPermission, clanOwnerPermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const [isCheckValid, setIsCheckValid] = useState<boolean>();
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [systemMessage, setSystemMessage] = useState<ApiSystemMessage | null>(null);
	const [selectedChannelMessage, setSelectedChannelMessage] = useState<ChannelsEntity>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<ApiSystemMessageRequest | null>(null);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const [notificationSetting, setNotificationSetting] = useState<number>(defaultNotificationClan?.notification_setting_type);

	const dispatch = useAppDispatch();

	const handleCheckDuplicateClanname = async () => {
		const store = await getStoreAsync();
		const isDuplicate = await store.dispatch(checkDuplicateNameClan(clanName?.trim()));
		return isDuplicate?.payload || false;
	};

	const channelsList = useSelector(selectAllChannels);
	const listChannelWithoutVoice = channelsList.filter(
		(channel) =>
			!channel?.channel_private &&
			channel?.clan_id === currentClan?.clan_id &&
			channel?.type === ChannelType?.CHANNEL_TYPE_CHANNEL &&
			channel?.channel_id !== selectedChannelMessage?.channel_id
	);

	useEffect(() => {
		const isClanNameChanged = clanName !== currentClan?.clan_name;
		const isBannerChanged = banner !== (currentClan?.banner || '');

		let hasSystemMessageChanged = false;
		if (updateSystemMessageRequest && systemMessage) {
			hasSystemMessageChanged =
				systemMessage.welcome_random !== updateSystemMessageRequest.welcome_random ||
				systemMessage.welcome_sticker !== updateSystemMessageRequest.welcome_sticker ||
				systemMessage.channel_id !== updateSystemMessageRequest.channel_id ||
				systemMessage.hide_audit_log !== updateSystemMessageRequest.hide_audit_log;
		}

		if (!validInput(clanName)) {
			setErrorMessage(t('menu.serverName.errorMessage'));
		}

		setIsCheckValid((isClanNameChanged && validInput(clanName)) || isBannerChanged || hasSystemMessageChanged);
	}, [clanName, banner, updateSystemMessageRequest, systemMessage, notificationSetting, defaultNotificationClan?.notification_setting_type]);

	const fetchSystemMessage = async () => {
		if (!currentClan?.clan_id) return;
		const resultAction = await dispatch(fetchSystemMessageByClanId({ clanId: currentClan?.clan_id, noCache: true }));
		const message = unwrapResult(resultAction);
		if (message) {
			setSystemMessage(message);
			setUpdateSystemMessageRequest(message);
			const selectedChannel = listChannelWithoutVoice?.find((channel) => channel?.channel_id === message?.channel_id);
			if (selectedChannel) {
				setSelectedChannelMessage(selectedChannel);
			}
		}
	};

	useEffect(() => {
		fetchSystemMessage();
	}, [currentClan]);

	const disabled = useMemo(() => {
		return !(hasAdminPermission || hasManageClanPermission || clanOwnerPermission);
	}, [clanOwnerPermission, hasAdminPermission, hasManageClanPermission]);

	const handleUpdateSystemMessage = async () => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClan?.clan_id && updateSystemMessageRequest) {
			const cachedMessageUpdate: ApiSystemMessage = {
				channel_id: updateSystemMessageRequest?.channel_id === systemMessage?.channel_id ? '' : updateSystemMessageRequest?.channel_id,
				clan_id: systemMessage?.clan_id,
				id: systemMessage?.id,
				hide_audit_log:
					updateSystemMessageRequest?.hide_audit_log === systemMessage?.hide_audit_log ? '' : updateSystemMessageRequest?.hide_audit_log,
				welcome_random:
					updateSystemMessageRequest?.welcome_random === systemMessage?.welcome_random ? '' : updateSystemMessageRequest?.welcome_random,
				welcome_sticker:
					updateSystemMessageRequest?.welcome_sticker === systemMessage?.welcome_sticker ? '' : updateSystemMessageRequest?.welcome_sticker
			};
			const request = {
				clanId: currentClan.clan_id,
				newMessage: cachedMessageUpdate,
				cachedMessage: updateSystemMessageRequest
			};
			const response = await dispatch(updateSystemMessage(request));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			}
		} else if (updateSystemMessageRequest) {
			const response = await dispatch(createSystemMessage(updateSystemMessageRequest));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			}
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleChangeOptionNotification = useCallback(async (value: number) => {
		try {
			setNotificationSetting(value);
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await dispatch(
				defaultNotificationActions.setDefaultNotificationClan({ clan_id: currentClan?.clan_id, notification_type: value })
			);

			if (response?.meta?.requestStatus === 'rejected') {
				throw response?.meta?.requestStatus;
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('toast.saveError'),
				text2: error?.message || String(error)
			});
			await sleep(50);
			setNotificationSetting(defaultNotificationClan?.notification_setting_type);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, []);

	const handleSave = useCallback(async () => {
		setLoading(true);
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const isClanNameChanged = clanName !== currentClan?.clan_name;

			if (isClanNameChanged) {
				const isDuplicateClan = await handleCheckDuplicateClanname();
				if (isDuplicateClan) {
					setErrorMessage(t('menu.serverName.duplicateNameMessage'));
					setIsCheckValid(false);
					setLoading(false);
					throw new Error(t('menu.serverName.duplicateNameMessage'));
				}
			}

			await updateClan({
				clan_id: currentClan?.clan_id ?? '',
				request: {
					banner,
					clan_name: clanName?.trim() || (currentClan?.clan_name ?? ''),
					creator_id: currentClan?.creator_id ?? '',
					is_onboarding: currentClan?.is_onboarding,
					logo: currentClan?.logo ?? '',
					welcome_channel_id: currentClan?.welcome_channel_id ?? ''
				}
			});

			await handleUpdateSystemMessage();

			Toast.show({
				type: 'success',
				text1: t('toast.saveSuccess')
			});
			navigation.goBack();
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('toast.saveError'),
				text2: error?.message || String(error)
			});
		} finally {
			setLoading(false);
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [clanName, currentClan, banner, dispatch, handleCheckDuplicateClanname, updateClan, handleUpdateSystemMessage, t, navigation]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerBackTitleVisible: false,
			headerRight: () => {
				if (disabled) return <View />;
				return (
					<Pressable onPress={handleSave} disabled={loading || !isCheckValid}>
						<Text style={{ ...styles.headerActionTitle, opacity: loading || !isCheckValid ? 0.5 : 1 }}>{t('header.save')}</Text>
					</Pressable>
				);
			}
		});
	}, [navigation, disabled, loading, isCheckValid, styles.headerActionTitle, t, handleSave]);

	function handleLoad(url: string) {
		if (hasAdminPermission || clanOwnerPermission) {
			setBanner(url);
		} else {
			Toast.show({
				type: 'error',
				text1: t('menu.serverName.permissionDenied')
			});
		}
	}

	const handleClearBanner = () => {
		if (hasAdminPermission || clanOwnerPermission) {
			setBanner('');
		} else {
			Toast.show({
				type: 'error',
				text1: t('menu.serverName.permissionDenied')
			});
		}
	};

	const handleSelectChannel = useCallback((channel) => {
		setSelectedChannelMessage(channel);
		setUpdateSystemMessageRequest((prev) => ({
			...prev,
			channel_id: channel?.channel_id
		}));
	}, []);

	const openBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <DeleteClanModal />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const openBottomSheetSystemChannel = () => {
		const data = {
			heightFitContent: true,
			children: <ChannelsMessageSystem onSelectChannel={handleSelectChannel} listChannelWithoutVoice={listChannelWithoutVoice} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const systemMessageMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.systemMessage.channel'),
			expandable: true,
			component: <Text style={{ color: themeValue.text, fontSize: size.s_12 }}>{selectedChannelMessage?.channel_label}</Text>,
			onPress: openBottomSheetSystemChannel,
			disabled
		},
		{
			title: t('menu.systemMessage.welcomeRandom'),
			component: (
				<MezonSwitch
					disabled={disabled}
					value={systemMessage?.welcome_random === '1'}
					onValueChange={(value) =>
						setUpdateSystemMessageRequest((prev) => ({
							...prev,
							welcome_random: value ? '1' : '0'
						}))
					}
				/>
			),
			disabled
		},
		{
			title: t('menu.systemMessage.welcomeSticker'),
			component: (
				<MezonSwitch
					disabled={disabled}
					value={systemMessage?.welcome_sticker === '1'}
					onValueChange={(value) =>
						setUpdateSystemMessageRequest((prev) => ({
							...prev,
							welcome_sticker: value ? '1' : '0'
						}))
					}
				/>
			),
			disabled
		},
		{
			title: t('menu.systemMessage.hideAuditLog'),
			component: (
				<MezonSwitch
					disabled={disabled}
					value={systemMessage?.hide_audit_log !== '1'}
					onValueChange={(value) =>
						setUpdateSystemMessageRequest((prev) => ({
							...prev,
							hide_audit_log: value ? '0' : '1'
						}))
					}
				/>
			),
			disabled
		}
	];

	const deleteMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.deleteServer.delete'),
			textStyle: { color: baseColor.redStrong },
			onPress: openBottomSheet
		}
	];

	const generalMenu: IMezonMenuSectionProps[] = [
		// {
		// 	items: inactiveMenu,
		// 	title: t('menu.inactive.title'),
		// 	bottomDescription: t('menu.inactive.description')
		// },
		{
			items: systemMessageMenu,
			title: t('menu.systemMessage.title'),
			bottomDescription: t('menu.systemMessage.description')
		}
	];

	const dangerMenu: IMezonMenuSectionProps[] = [
		{
			items: deleteMenu
		}
	];

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: themeValue.secondary
			}}
		>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps={'handled'}>
				<MezonImagePicker
					disabled={disabled}
					defaultValue={banner}
					height={size.s_200}
					width={width - size.s_40}
					imageHeight={400}
					imageWidth={400}
					onLoad={handleLoad}
					showHelpText
					autoUpload
					imageSizeLimit={MAX_FILE_SIZE_10MB}
				/>

				{banner && (
					<Pressable style={{ position: 'absolute', right: size.s_14, top: size.s_2 }} onPress={handleClearBanner}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={25} width={25} color={themeValue.white} />
					</Pressable>
				)}

				<View style={{ marginVertical: 10 }}>
					<MezonInput
						label={t('menu.serverName.title')}
						onTextChange={setClanName}
						value={clanName}
						maxCharacter={64}
						disabled={disabled}
					/>
					{!isCheckValid && !!errorMessage && <ErrorInput style={styles.errorInput} errorMessage={errorMessage} />}
				</View>

				<MezonMenu menu={generalMenu} />

				<MezonOption
					value={notificationSetting}
					title={t('fields.defaultNotification.title')}
					bottomDescription={t('fields.defaultNotification.description')}
					data={optionNotification(tNotification)}
					onChange={(value) => handleChangeOptionNotification(value as number)}
				/>
				{!disabled && <MezonMenu menu={dangerMenu} />}
			</ScrollView>
		</View>
	);
}
