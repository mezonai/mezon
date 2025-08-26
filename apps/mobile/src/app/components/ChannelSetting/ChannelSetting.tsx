import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, isEqual } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	channelUsersActions,
	channelsActions,
	fetchSystemMessageByClanId,
	selectAllChannels,
	selectChannelById,
	selectClanSystemMessage,
	selectCurrentUserId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { EOverriddenPermission, EPermission, checkIsThread } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import { AddMemberOrRoleBS } from '../../screens/channelPermissionSetting/components/AddMemberOrRoleBS';
import { validInput } from '../../utils/validate';
import { style } from './styles';

interface IChannelSettingValue {
	channelName: string;
	channelTopic: string;
	//TODO: update more
}

type ScreenChannelSetting = typeof APP_SCREEN.MENU_CHANNEL.SETTINGS;
export function ChannelSetting({ navigation, route }: MenuChannelScreenProps<ScreenChannelSetting>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { channelId } = route.params;
	const { t } = useTranslation(['channelSetting', 'channelCreator']);
	const { t: t1 } = useTranslation(['screenStack']);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const dispatch = useAppDispatch();
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const isChannel = !checkIsThread(channel);
	const [isCheckValid, setIsCheckValid] = useState<boolean>(true);
	const [isCheckDuplicateNameChannel, setIsCheckDuplicateNameChannel] = useState<boolean>(false);
	const channelsClan = useSelector(selectAllChannels);
	const currentSystemMessage = useSelector(selectClanSystemMessage);
	const [originSettingValue, setOriginSettingValue] = useState<IChannelSettingValue>({
		channelName: '',
		channelTopic: ''
	});
	const [currentSettingValue, setCurrentSettingValue] = useState<IChannelSettingValue>({
		channelName: '',
		channelTopic: ''
	});
	const isNotChanged = useMemo(() => {
		return isEqual(originSettingValue, currentSettingValue);
	}, [originSettingValue, currentSettingValue]);

	const currentUserId = useSelector(selectCurrentUserId);

	const [isCanManageThread, isCanManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		channel?.channel_id ?? ''
	);

	useEffect(() => {
		dispatch(fetchSystemMessageByClanId({ clanId: channel?.clan_id }));
	}, []);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: isChannel ? t1('menuChannelStack.channelSetting') : t1('menuChannelStack.threadSetting'),
			headerRight: () => (
				<Pressable onPress={() => handleSaveChannelSetting()}>
					<Text style={[styles.saveChangeButton, !isNotChanged ? styles.changed : styles.notChange]}>{t('confirm.save')}</Text>
				</Pressable>
			)
		});
	}, [navigation, isNotChanged, styles.saveChangeButton, styles.changed, styles.notChange, t, isChannel, t1]);

	const handleUpdateValue = (value: Partial<IChannelSettingValue>) => {
		setCurrentSettingValue({ ...currentSettingValue, ...value });
	};

	useEffect(() => {
		if (channel?.channel_id) {
			const initialChannelSettingValue: IChannelSettingValue = {
				channelName: channel?.channel_label,
				channelTopic: ''
			};
			setOriginSettingValue(initialChannelSettingValue);
			setCurrentSettingValue(initialChannelSettingValue);
		}
	}, [channel]);

	useEffect(() => {
		setIsCheckValid(validInput(currentSettingValue?.channelName));
	}, [currentSettingValue?.channelName]);

	const handleSaveChannelSetting = async () => {
		const isCheckNameChannelValue =
			!!channelsClan?.length && channelsClan?.some((channel) => channel?.channel_label === currentSettingValue?.channelName);
		setIsCheckDuplicateNameChannel(isCheckNameChannelValue);
		const updateChannel = {
			channel_id: channel?.channel_id || '',
			channel_label: currentSettingValue?.channelName,
			category_id: channel?.category_id,
			app_url: channel?.app_url || '',
			app_id: channel?.app_id || '',
			age_restricted: channel?.age_restricted,
			e2ee: channel?.e2ee,
			topic: channel?.topic,
			parent_id: channel?.parent_id,
			channel_private: channel?.channel_private
		};
		if (isCheckNameChannelValue || !isCheckValid) return;
		await dispatch(channelsActions.updateChannel(updateChannel));
		navigation?.goBack();
		Toast.show({
			type: 'success',
			props: {
				text2: t('toast.updated'),
				leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
			}
		});
	};

	const permissionMenu = useMemo(
		() =>
			[
				{
					title: t('fields.channelPermission.permission'),
					expandable: true,
					icon: <MezonIconCDN icon={IconCDN.bravePermission} color={themeValue.text} />,
					isShow: isChannel && channel?.type !== ChannelType.CHANNEL_TYPE_APP,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION,
							params: {
								channelId
							}
						});
					}
				},

				{
					title: t('fields.quickAction.title'),
					expandable: true,
					icon: <MezonIconCDN icon={IconCDN.quickAction} color={themeValue.text} />,
					isShow: isChannel && channel?.type !== ChannelType.CHANNEL_TYPE_APP,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.QUICK_ACTION,
							params: {
								channelId
							}
						});
					}
				},

				{
					title: t('fields.privateChannelInvite.addMember'),
					expandable: true,
					icon: <MezonIconCDN icon={IconCDN.bravePermission} color={themeValue.text} />,
					isShow: isChannel && !!channel?.channel_private && channel?.type !== ChannelType.CHANNEL_TYPE_APP,
					onPress: () => {
						bottomSheetRef?.current?.present();
					}
				}
			] satisfies IMezonMenuItemProps[],
		[channel?.channel_private, channel?.type, channelId, isChannel, t, themeValue.text]
	);

	const webhookMenu = useMemo(
		() =>
			[
				{
					title: t('fields.channelWebhooks.webhook'),
					expandable: true,
					icon: <MezonIconCDN icon={IconCDN.webhookIcon} color={themeValue.text} />,
					isShow: channel?.type !== ChannelType.CHANNEL_TYPE_APP,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
							screen: APP_SCREEN.MENU_CLAN.INTEGRATIONS,
							params: {
								channelId: channel?.channel_id,
								isClanSetting: false
							}
						});
					}
				}
			] satisfies IMezonMenuItemProps[],
		[channel?.channel_id, channel?.type, t, themeValue.text]
	);

	const deleteMenu = useMemo(
		() =>
			[
				{
					title: isChannel ? t('fields.channelDelete.delete') : t('fields.threadDelete.delete'),
					textStyle: { color: baseColor.redStrong },
					onPress: () => handlePressDeleteChannel(),
					icon: <MezonIconCDN icon={IconCDN.trashIcon} color={baseColor.redStrong} />,
					isShow: isChannel ? isCanManageChannel : isCanManageThread || channel?.creator_id === currentUserId
				},
				{
					title: isChannel ? t('fields.channelDelete.leave') : t('fields.threadLeave.leave'),
					textStyle: { color: baseColor.redStrong },
					onPress: () => handlePressLeaveChannel(),
					icon: <MezonIconCDN icon={IconCDN.leaveGroupIcon} color={baseColor.redStrong} />,
					isShow:
						channel?.creator_id !== currentUserId &&
						(!isChannel || (channel?.channel_private === 1 && channel?.type !== ChannelType.CHANNEL_TYPE_APP))
				}
			] satisfies IMezonMenuItemProps[],
		[channel?.creator_id, channel?.type, currentUserId, isChannel, t]
	);

	const topMenu = useMemo(
		() =>
			[
				// { items: categoryMenu },
				{
					items: permissionMenu,
					bottomDescription: channel?.type === ChannelType.CHANNEL_TYPE_APP ? '' : t('fields.channelPermission.description')
				}
				// {
				// 	items: notificationMenu,
				// 	bottomDescription: ''
				// }
			] satisfies IMezonMenuSectionProps[],
		[channel?.type, permissionMenu, t]
	);

	const bottomMenu = useMemo(() => [{ items: webhookMenu }, { items: deleteMenu }] satisfies IMezonMenuSectionProps[], []);

	// const hideInactiveOptions = useMemo(
	// 	() =>
	// 		[
	// 			{
	// 				title: t('fields.channelHideInactivity._1hour'),
	// 				value: 0
	// 			},
	// 			{
	// 				title: t('fields.channelHideInactivity._24hours'),
	// 				value: 1
	// 			},
	// 			{
	// 				title: t('fields.channelHideInactivity._3days'),
	// 				value: 2
	// 			},
	// 			{
	// 				title: t('fields.channelHideInactivity._1Week'),
	// 				value: 3
	// 			}
	// 		] satisfies IMezonOptionData,
	// 	[]
	// );

	const handleDeleteChannel = useCallback(async () => {
		try {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			dispatch(appActions.setLoadingMainMobile(true));
			if (channel?.channel_id === currentSystemMessage?.channel_id) {
				Toast.show({ type: 'error', text1: t('confirm.delete.systemChannel') });
				return;
			}

			const response = await dispatch(
				channelsActions.deleteChannel({
					channelId: channel?.channel_id,
					clanId: channel?.clan_id
				})
			);
			if (response?.meta?.requestStatus === 'rejected') {
				throw response?.error?.message;
			}
			navigation.navigate(APP_SCREEN.HOME);
			if (channel?.parent_id !== '0') {
				await dispatch(
					channelsActions.joinChannel({
						clanId: channel?.clan_id,
						channelId: channel?.parent_id,
						noFetchMembers: false
					})
				);
			}
		} catch (error) {
			Toast.show({ type: 'error', text1: t('confirm.delete.error', { error }) });
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [channel?.channel_id, channel?.clan_id, channel?.parent_id, currentSystemMessage?.channel_id]);

	const handleConfirmLeaveThread = useCallback(async () => {
		try {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			dispatch(appActions.setLoadingMainMobile(true));
			if (isChannel) {
				const body = {
					channelId: channel.id,
					userId: currentUserId,
					channelType: channel.type,
					clanId: channel.clan_id
				};
				const response = await dispatch(channelUsersActions.removeChannelUsers(body));
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				}
			} else {
				const response = await dispatch(
					threadsActions.leaveThread({
						clanId: channel?.clan_id || '',
						channelId: channel?.parent_id || '',
						threadId: channel?.id || '',
						isPrivate: channel?.channel_private || 0
					})
				);
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				}
			}

			navigation.navigate(APP_SCREEN.HOME);
		} catch (error) {
			Toast.show({ type: 'error', text1: t('confirm.leave.error', { error }) });
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [channel?.channel_private, channel?.clan_id, channel?.id, channel?.parent_id, isChannel, currentUserId, channel?.type]);

	const handlePressLeaveChannel = () => {
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleConfirmLeaveThread}
					title={t('confirm.leave.title')}
					confirmText={t('confirm.leave.confirmText')}
					content={t('confirm.leave.content', {
						channelName: channel?.channel_label
					})}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handlePressDeleteChannel = () => {
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleDeleteChannel}
					title={t('confirm.delete.title')}
					confirmText={t('confirm.delete.confirmText')}
					content={t('confirm.delete.content', {
						channelName: channel?.channel_label
					})}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.inputWrapper}>
				<MezonInput
					label={t('fields.channelName.title')}
					value={currentSettingValue.channelName}
					onTextChange={(text) => handleUpdateValue({ channelName: text })}
					maxCharacter={64}
					errorMessage={
						isCheckDuplicateNameChannel
							? t('channelCreator:fields.channelName.duplicateChannelName')
							: !isCheckValid
								? t('fields.channelName.errorMessage')
								: ''
					}
					placeHolder={t('fields.channelName.placeholder')}
					isValid={!isCheckDuplicateNameChannel && isCheckValid}
				/>

				{isChannel && channel?.type !== ChannelType.CHANNEL_TYPE_APP && (
					<MezonInput
						label={t('fields.channelDescription.title')}
						value={currentSettingValue.channelTopic}
						onTextChange={(text) => handleUpdateValue({ channelTopic: text })}
						textarea
					/>
				)}
			</View>

			{isChannel && channel?.type !== ChannelType.CHANNEL_TYPE_APP && <MezonMenu menu={topMenu} />}

			{/*<MezonSlider data={slowModeOptions} title={t('fields.channelSlowMode.title')} />*/}

			{/*{isChannel && channel?.type !== ChannelType.CHANNEL_TYPE_APP && (*/}
			{/*	<MezonOption*/}
			{/*		title={t('fields.channelHideInactivity.title')}*/}
			{/*		data={hideInactiveOptions}*/}
			{/*		bottomDescription={t('fields.channelHideInactivity.description')}*/}
			{/*	/>*/}
			{/*)}*/}

			<MezonMenu menu={bottomMenu} />
			<AddMemberOrRoleBS bottomSheetRef={bottomSheetRef} channel={channel} />
		</ScrollView>
	);
}
