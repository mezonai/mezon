import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	deleteClanWebhookById,
	deleteWebhookById,
	fetchClanWebhooks,
	fetchWebhooks,
	selectAllChannels,
	selectClanWebhooksById,
	selectCurrentClanId,
	updateClanWebhookById,
	updateWebhookBySpecificId,
	useAppDispatch
} from '@mezon/store-mobile';
import { ChannelIsNotThread, MAX_FILE_SIZE_8MB } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { ApiWebhook, MezonUpdateClanWebhookByIdBody, MezonUpdateWebhookByIdBody } from 'mezon-js/api.gen';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../../../componentUI/MezonImagePicker';
import MezonInput from '../../../../../componentUI/MezonInput';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../componentUI/MezonMenu';
import MezonOption from '../../../../../componentUI/MezonOption';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

export function WebhooksEdit({ route, navigation }: { route: any; navigation: any }) {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const { webhook, isClanIntegration, isClanSetting } = route.params || {};
	const [urlImageWebhook, setUrlImageWebhook] = useState<string>(webhook?.avatar || '');
	const [webhookName, setWebhookName] = useState<string>(webhook?.webhook_name || '');
	const allChannel = useSelector(selectAllChannels);
	const parentChannelsInClan = useMemo(() => allChannel?.filter((channel) => channel?.parent_id === ChannelIsNotThread.TRUE), [allChannel]);
	const getChannelSelect = useCallback(
		(idChannel = '') => {
			return parentChannelsInClan?.find((channel) => channel?.channel_id === idChannel);
		},
		[parentChannelsInClan]
	);
	const [webhookChannel, setWebhookChannel] = useState<ChannelsEntity>(getChannelSelect(webhook?.channel_id));
	const [hasChange, setHasChange] = useState<boolean>(false);
	const clanId = useSelector(selectCurrentClanId) as string;
	const currentWebhook = useSelector((state: any) => selectClanWebhooksById(state, webhook?.id));
	const [isCopied, setIsCopied] = useState(false);
	const { t } = useTranslation(['screenStack', 'clanIntegrationsSetting']);
	const dispatch = useAppDispatch();

	const channel = useMemo(() => {
		return parentChannelsInClan?.map((channel) => ({
			title: channel?.channel_label,
			value: channel?.channel_id,
			icon: <MezonIconCDN icon={IconCDN.channelText} color={themeValue.text} />
		}));
	}, [parentChannelsInClan, themeValue.text]);

	const handleResetChange = useCallback(() => {
		if (hasChange) {
			setUrlImageWebhook(webhook?.avatar);
			setWebhookName(webhook?.webhook_name);
			const channelSelect = getChannelSelect(webhook?.channel_id);
			setWebhookChannel(channelSelect);
			setHasChange(false);
		}
	}, [hasChange, getChannelSelect, webhook]);

	const updateClanWebhookProcess = useCallback(
		async (webhookId: string, resetToken = false) => {
			try {
				const request: MezonUpdateClanWebhookByIdBody = {
					avatar: urlImageWebhook,
					webhook_name: webhookName,
					clan_id: clanId,
					reset_token: resetToken
				};

				const response = await dispatch(
					updateClanWebhookById({
						request,
						webhookId,
						clanId
					})
				);
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: t(resetToken ? 'toast.resetTokenSuccess' : 'toast.saveSuccess', { ns: 'clanIntegrationsSetting' }),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
						},
						text2Style: { fontSize: size.small }
					});
				}
			} catch (error) {
				Toast.show({
					type: 'error',
					text1: t(resetToken ? 'toast.resetTokenError' : 'toast.saveError', { ns: 'clanIntegrationsSetting' })
				});
			}
		},
		[urlImageWebhook, webhookName, clanId, dispatch, t]
	);

	const updateWebhookProcess = useCallback(
		async (webhookId: string) => {
			const request: MezonUpdateWebhookByIdBody = {
				avatar: urlImageWebhook,
				channel_id_update: webhookChannel?.channel_id,
				webhook_name: webhookName,
				channel_id: webhook?.channel_id,
				clan_id: clanId
			};

			await dispatch(
				updateWebhookBySpecificId({
					request,
					webhookId,
					channelId: webhook?.channel_id,
					clanId
				})
			);
			await dispatch(fetchWebhooks({ channelId: isClanSetting ? '0' : (webhook?.channel_id ?? ''), clanId }));
		},
		[urlImageWebhook, webhookChannel?.channel_id, webhookName, webhook?.channel_id, clanId, dispatch]
	);

	const handleEditWebhook = useCallback(async () => {
		if (!hasChange) return;

		if (isClanIntegration) {
			await updateClanWebhookProcess(webhook?.id, false);
		} else {
			await updateWebhookProcess(webhook?.id);
		}

		setHasChange(false);

		navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS, {
			channelId: webhook?.channel_id,
			isClanIntegration,
			isClanSetting,
			clanId
		});
	}, [
		hasChange,
		isClanIntegration,
		updateClanWebhookProcess,
		updateWebhookProcess,
		webhook?.id,
		webhook?.channel_id,
		navigation,
		clanId,
		isClanSetting
	]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () =>
				hasChange ? (
					<Pressable onPress={handleEditWebhook} style={{ paddingRight: size.s_14 }}>
						<Text style={styles.textHeader}>{t('webhooksEdit.save', { ns: 'clanIntegrationsSetting' })}</Text>
					</Pressable>
				) : null,

			headerLeft: () =>
				hasChange ? (
					<Pressable style={{ paddingLeft: size.s_14 }}>
						<Text style={styles.textHeader} onPress={handleResetChange}>
							{t('webhooksEdit.cancel', { ns: 'clanIntegrationsSetting' })}
						</Text>
					</Pressable>
				) : (
					<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
						<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</Pressable>
				),

			headerTitle: t('menuClanStack.webhooksEdit')
		});
	}, [hasChange, handleEditWebhook, styles.textHeader, t, handleResetChange, navigation, themeValue.text]);

	const channelMenu: IMezonMenuItemProps[] = useMemo(() => {
		return [
			{
				title: webhookChannel?.channel_label,
				onPress: () => {
					const data = {
						snapPoints: ['50%'],
						children: <MezonOption data={channel} value={webhookChannel?.channel_id} onChange={handleChangeOption} />
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
					Keyboard.dismiss();
				},
				expandable: true,
				icon: <MezonIconCDN icon={IconCDN.channelText} color={themeValue.text} />
			}
		];
	}, [themeValue.text, webhookChannel?.channel_label, webhookChannel?.channel_id, channel]);

	const menu: IMezonMenuSectionProps[] = useMemo(
		() => [
			{
				title: t('webhooksEdit.channel', { ns: 'clanIntegrationsSetting' }),
				items: channelMenu
			}
		],
		[channelMenu, t]
	);

	const handleLoad = useCallback((url: string) => {
		setHasChange(true);
		setUrlImageWebhook(url);
	}, []);

	const handleChangeText = useCallback((value) => {
		setHasChange(true);
		setWebhookName(value);
	}, []);

	const handleChangeOption = useCallback(
		(value) => {
			setHasChange(true);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			const channelSelect = getChannelSelect(value);
			setWebhookChannel(channelSelect);
		},
		[getChannelSelect]
	);

	const handleResetToken = useCallback(async () => {
		await updateClanWebhookProcess(webhook?.id, true);
	}, [updateClanWebhookProcess, webhook?.id]);

	const handleCopyToClipboard = useCallback(() => {
		Clipboard.setString(currentWebhook?.url || webhook?.url);
		setIsCopied(true);
	}, [currentWebhook?.url, webhook?.url]);

	const handleDeleteWebhook = useCallback(
		async (webhook: ApiWebhook) => {
			try {
				if (isClanIntegration) {
					await dispatch(deleteClanWebhookById({ webhook, clanId }));
					await dispatch(fetchClanWebhooks({ clanId }));
				} else {
					await dispatch(deleteWebhookById({ webhook, channelId: webhook?.channel_id as string, clanId }));
					await dispatch(fetchWebhooks({ channelId: isClanSetting ? '0' : (webhook?.channel_id ?? ''), clanId }));
				}

				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

				navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS, {
					clanId,
					isClanSetting,
					isClanIntegration,
					channelId: webhook?.channel_id
				});
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.deleteSuccess', { ns: 'clanIntegrationsSetting' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					},
					text2Style: { fontSize: size.small }
				});
			} catch (error) {
				console.error('Error deleting webhook:', error);
				Toast.show({
					type: 'error',
					text1: t('toast.deleteError', { ns: 'clanIntegrationsSetting' })
				});
			}
		},
		[isClanIntegration, t, navigation, clanId, isClanSetting, dispatch]
	);

	const handleDeletePress = useCallback(() => {
		const data = {
			children: (
				<MezonConfirm
					confirmText={t('webhooksEdit.yes', { ns: 'clanIntegrationsSetting' })}
					title={t('webhooksEdit.deleteCaptionHook', { ns: 'clanIntegrationsSetting' })}
					children={
						<Text style={{ color: themeValue.white }}>
							{t('webhooksEdit.deleteWebhookConfirmation', {
								ns: 'clanIntegrationsSetting',
								webhookName: webhook?.webhook_name
							})}
						</Text>
					}
					onConfirm={() => handleDeleteWebhook(webhook)}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [t, themeValue.white, webhook?.webhook_name, handleDeleteWebhook, webhook]);

	return (
		<View style={styles.wrapper}>
			<View style={styles.headerContainer}>
				<View style={styles.upload}>
					<MezonImagePicker
						defaultValue={urlImageWebhook}
						style={styles.image}
						onLoad={handleLoad}
						showHelpText
						autoUpload
						imageSizeLimit={MAX_FILE_SIZE_8MB}
						imageHeight={200}
						imageWidth={200}
					/>
					<MezonIconCDN
						icon={IconCDN.uploadPlusIcon}
						customStyle={styles.uploadIcon}
						height={size.s_20}
						width={size.s_20}
						color={themeValue.white}
					/>
				</View>
				<Text style={styles.textRecommend}>{t('webhooksEdit.recommendImage', { ns: 'clanIntegrationsSetting' })}</Text>
			</View>
			<MezonInput
				titleStyle={styles.label}
				label={t('webhooksEdit.name', { ns: 'clanIntegrationsSetting' })}
				value={webhookName}
				onTextChange={handleChangeText}
			/>

			{!isClanIntegration && <MezonMenu menu={menu} />}

			<View>
				<Text style={styles.label}>{t('webhooksEdit.webhookURL', { ns: 'clanIntegrationsSetting' })}</Text>
				<TouchableOpacity style={styles.btnLink} onPress={handleCopyToClipboard}>
					<Text style={styles.textBtnLink}>{currentWebhook?.url || webhook?.url}</Text>
					<Text style={styles.textLink}>
						{isCopied
							? t('webhooksEdit.copied', { ns: 'clanIntegrationsSetting' })
							: t('webhooksEdit.copy', { ns: 'clanIntegrationsSetting' })}
					</Text>
				</TouchableOpacity>
			</View>

			{isClanIntegration && (
				<TouchableOpacity style={styles.btnResetToken} onPress={handleResetToken}>
					<Text style={styles.textBtnDelete}>{t('webhooksEdit.resetToken', { ns: 'clanIntegrationsSetting' })}</Text>
				</TouchableOpacity>
			)}

			<TouchableOpacity onPress={handleDeletePress} style={styles.btnDelete}>
				<Text style={styles.textBtnDelete}>{t('webhooksEdit.delete', { ns: 'clanIntegrationsSetting' })}</Text>
			</TouchableOpacity>
		</View>
	);
}
