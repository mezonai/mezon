import { ActionEmitEvent, Icons, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	deleteWebhookById,
	fetchWebhooks,
	selectAllChannels,
	selectCurrentChannel,
	selectCurrentClanId,
	updateWebhookBySpecificId,
	useAppDispatch
} from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { ChannelIsNotThread } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { ApiWebhook, MezonUpdateWebhookByIdBody } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Image, Keyboard, Pressable, Text, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import * as ImagePicker from 'react-native-image-picker';
import { CameraOptions } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import { IFile } from '../../../../../componentUI/MezonImagePicker';
import MezonInput from '../../../../../componentUI/MezonInput';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../componentUI/MezonMenu';
import MezonOption from '../../../../../componentUI/MezonOption';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

export function WebhooksEdit({ route, navigation }: { route: any; navigation: any }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { webhook } = route.params || {};
	const { sessionRef, clientRef } = useMezon();
	const currentChannel = useSelector(selectCurrentChannel);
	const [urlImageWebhook, setUrlImageWebhook] = useState<string>('');
	const [webhookName, setWebhookName] = useState<string>('');
	const [webhookChannel, setWebhookChannel] = useState<ChannelsEntity>(null);
	const [hasChange, setHasChange] = useState<boolean>(false);
	const clanId = useSelector(selectCurrentClanId) as string;
	const allChannel = useSelector(selectAllChannels);
	const [isCopied, setIsCopied] = useState(false);
	const [isVisibleModal, setIsVisibleModal] = useState(false);
	const { t } = useTranslation(['screenStack', 'clanIntegrationsSetting']);
	const parentChannelsInClan = useMemo(() => allChannel?.filter((channel) => channel?.parent_id === ChannelIsNotThread.TRUE), [allChannel]);
	const dispatch = useAppDispatch();

	const channel = useMemo(() => {
		return parentChannelsInClan?.map((channel) => ({
			title: channel?.channel_label,
			value: channel?.channel_id,
			icon: <Icons.TextIcon color={themeValue.text} />
		}));
	}, [parentChannelsInClan, themeValue.text]);

	const getChannelSelect = useCallback(
		(idChannel = '') => {
			return parentChannelsInClan?.find((channel) => channel?.channel_id === idChannel);
		},
		[parentChannelsInClan]
	);

	useEffect(() => {
		if (webhook?.avatar || webhook?.channel_id || webhook?.webhook_name) {
			setUrlImageWebhook(webhook?.avatar);
			setWebhookName(webhook?.webhook_name);
			const channelSelect = getChannelSelect(webhook?.channel_id);
			setWebhookChannel(channelSelect);
		}
	}, [webhook, parentChannelsInClan, getChannelSelect]);

	const handleResetChange = useCallback(() => {
		if (hasChange) {
			setUrlImageWebhook(webhook?.avatar);
			setWebhookName(webhook?.webhook_name);
			const channelSelect = getChannelSelect(webhook?.channel_id);
			setWebhookChannel(channelSelect);
			setHasChange(false);
		}
	}, [hasChange, getChannelSelect, webhook]);

	const handleEditWebhook = useCallback(async () => {
		if (hasChange) {
			const request: MezonUpdateWebhookByIdBody = {
				avatar: urlImageWebhook,
				channel_id_update: webhookChannel?.channel_id,
				webhook_name: webhookName,
				channel_id: currentChannel.channel_id,
				clan_id: clanId
			};
			await dispatch(
				updateWebhookBySpecificId({
					request: request,
					webhookId: webhook?.id || '',
					channelId: currentChannel?.channel_id || '',
					clanId: clanId
				})
			);
			await dispatch(fetchWebhooks({ channelId: '0', clanId: clanId }));
			setHasChange(false);
		}
		navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS);
	}, [webhookName, navigation, clanId, currentChannel?.channel_id, dispatch, hasChange, urlImageWebhook, webhook?.id, webhookChannel?.channel_id]);

	useEffect(() => {
		navigation.setOptions({
			headerRight: () =>
				hasChange ? (
					<Pressable onPress={handleEditWebhook} style={{ padding: 20 }}>
						<Text style={styles.textHeader}>{t('webhooksEdit.save', { ns: 'clanIntegrationsSetting' })}</Text>
					</Pressable>
				) : null,

			headerLeft: () =>
				hasChange ? (
					<Pressable style={{ padding: 20 }}>
						<Text style={styles.textHeader} onPress={handleResetChange}>
							{t('webhooksEdit.cancel', { ns: 'clanIntegrationsSetting' })}
						</Text>
					</Pressable>
				) : (
					<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
						<Icons.ArrowLargeLeftIcon height={size.s_20} width={size.s_20} color={themeValue.text} />
					</Pressable>
				),

			headerTitle: t('menuClanStack.webhooksEdit')
		});
	}, [
		handleEditWebhook,
		urlImageWebhook,
		hasChange,
		webhookName,
		navigation,
		styles.textHeader,
		themeValue.text,
		webhookChannel,
		handleResetChange,
		t
	]);

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
				icon: <Icons.TextIcon color={themeValue.text} />
			}
		];
	}, [themeValue.text, webhookChannel?.channel_label]);
	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('webhooksEdit.channel', { ns: 'clanIntegrationsSetting' }),
			items: channelMenu
		}
	];

	const handleChooseFiles = async () => {
		setHasChange(true);
		const options = {
			durationLimit: 10000,
			mediaType: 'photo',
			quality: QUALITY_IMAGE_UPLOAD
		};

		ImagePicker.launchImageLibrary(options as CameraOptions, async (response) => {
			if (response.didCancel) {
				console.warn('User cancelled camera');
			} else if (response.errorCode) {
				console.error('Camera Error: ', response.errorMessage);
			} else {
				const file = response.assets[0];
				const fileData = await RNFS.readFile(file.uri, 'base64');
				const fileFormat: IFile = {
					uri: file?.uri,
					name: file?.fileName,
					type: file?.type,
					size: file?.fileSize?.toString(),
					fileData
				};
				handleFile([fileFormat][0]);
			}
		});
	};

	const handleFile = async (file: IFile | any) => {
		const session = sessionRef.current;
		const client = clientRef.current;
		if (!file || !client || !session) {
			throw new Error('Client or files are not initialized');
		}
		const res = await handleUploadFileMobile(client, session, currentChannel?.clan_id, currentChannel?.channel_id, file.name, file);
		if (!res?.url) return;
		setUrlImageWebhook(res?.url);
	};

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

	const handleCopyToClipboard = () => {
		Clipboard.setString(webhook?.url);
		setIsCopied(true);
	};

	const handleDeleteWebhook = async (webhook: ApiWebhook) => {
		await dispatch(deleteWebhookById({ webhook: webhook, channelId: currentChannel?.channel_id as string, clanId }));
		setIsVisibleModal(false);
		navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS);
		await dispatch(fetchWebhooks({ channelId: '0', clanId: clanId }));
	};

	const visibleChange = useCallback((value) => {
		setIsVisibleModal(value);
	}, []);

	return (
		<View style={{ backgroundColor: themeValue.primary, width: '100%', height: '100%', padding: size.s_10 }}>
			<View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '20%' }}>
				<TouchableOpacity onPress={handleChooseFiles} style={styles.upload}>
					<Image
						style={styles.image}
						source={{
							uri: urlImageWebhook
						}}
					/>
					<Icons.UploadPlusIcon style={styles.uploadIcon} height={size.s_20} width={size.s_20} color={themeValue.white} />
				</TouchableOpacity>
				<Text style={styles.textRecommend}>{t('webhooksEdit.recommendImage', { ns: 'clanIntegrationsSetting' })}</Text>
			</View>
			<MezonInput label={'Name'} value={webhookName} onTextChange={handleChangeText} />

			<MezonMenu menu={menu} />
			<View>
				<Text style={styles.label}>{t('webhooksEdit.webhookURL', { ns: 'clanIntegrationsSetting' })}</Text>
				<TouchableOpacity style={styles.btnLink} onPress={handleCopyToClipboard}>
					<Text style={styles.textBtnLink}>{webhook?.url}</Text>
					<Text style={styles.textLink}>
						{isCopied
							? t('webhooksEdit.copied', { ns: 'clanIntegrationsSetting' })
							: t('webhooksEdit.copy', { ns: 'clanIntegrationsSetting' })}
					</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity onPress={() => setIsVisibleModal(true)} style={styles.btnDelete}>
				<Text style={styles.textBtnDelete}>{t('webhooksEdit.delete', { ns: 'clanIntegrationsSetting' })}</Text>
			</TouchableOpacity>

			<MezonConfirm
				visible={isVisibleModal}
				onVisibleChange={visibleChange}
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
		</View>
	);
}
