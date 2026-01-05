import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	generateClanWebhook,
	generateWebhook,
	selectAllClanWebhooks,
	selectWebhooksByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import { APP_SCREEN } from 'apps/mobile/src/app/navigation/ScreenTypes';
import { ApiGenerateClanWebhookRequest, ApiWebhookCreateRequest } from 'mezon-js/types';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { CHANNEL_WEBHOOK_DOCS_URL, CLAN_WEBHOOK_DOCS_URL } from '../Integrations';
import { WebhookChannelSelectModal } from './WebhookChannelSelectModal';
import { WebhooksEmpty } from './WebhooksEmpty';
import { WebhooksItem } from './WebhooksItem';
import { style } from './styles';

// Constants
const WEBHOOK_NAMES = ['Captain hook', 'Spidey bot', 'Komu Knight'] as const;
const WEBHOOK_AVATARS = [
	`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_0mezon_logo_white.png`,
	`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_1mezon_logo_black.png`,
	`${process.env.NX_BASE_IMG_URL}/0/1833395573034586112/1787375123666309000/955_0mezon_logo.png`
] as const;

const useWebhookData = (route: any) => {
	const { clanId, isClanSetting, channelId, isClanIntegration } = route?.params || {};

	const allChannelWebhooks = useAppSelector((state) => selectWebhooksByChannelId(state, isClanSetting ? '0' : (channelId ?? ''), clanId));
	const allClanWebhooks = useAppSelector(selectAllClanWebhooks);

	const webhookList = useMemo(() => {
		return isClanIntegration ? allClanWebhooks : allChannelWebhooks;
	}, [allClanWebhooks, allChannelWebhooks, isClanIntegration]);

	return {
		clanId,
		isClanSetting,
		channelId,
		isClanIntegration,
		webhookList
	};
};

const useWebhookActions = (clanId: string, isClanSetting: boolean, isClanIntegration: boolean, channelId: string) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanIntegrationsSetting']);

	const getRandomWebhookName = useCallback((): string => {
		const randomIndex = Math.floor(Math.random() * WEBHOOK_NAMES.length);
		return WEBHOOK_NAMES[randomIndex];
	}, []);

	const getRandomAvatar = useCallback((): string => {
		const randomIndex = Math.floor(Math.random() * WEBHOOK_AVATARS.length);
		return WEBHOOK_AVATARS[randomIndex];
	}, []);

	const addWebhookProcess = useCallback(
		async (channelId?: string) => {
			try {
				const newWebhookReq: ApiWebhookCreateRequest = {
					channelId: channelId,
					webhook_name: getRandomWebhookName(),
					avatar: getRandomAvatar(),
					clanId: clanId
				};
				const response = await dispatch(generateWebhook({ request: newWebhookReq, channelId, clanId, isClanSetting }));
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: t('toast.addSuccess'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
						},
						text2Style: { fontSize: size.small }
					});
				}
			} catch (error) {
				console.error('Error creating webhook:', error);
				Toast.show({
					type: 'error',
					text1: t('toast.addError')
				});
			}
		},
		[getRandomWebhookName, getRandomAvatar, clanId, dispatch, isClanSetting, t]
	);

	const handleAddChannelWebhook = useCallback(async () => {
		if (isClanSetting) {
			const data = {
				children: (
					<WebhookChannelSelectModal
						onConfirm={async (selectedChannelId) => {
							await addWebhookProcess(selectedChannelId);
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
						}}
						onCancel={() => {
							return;
						}}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		} else {
			await addWebhookProcess(channelId);
		}
	}, [isClanSetting, addWebhookProcess, channelId]);

	const handleAddClanWebhook = useCallback(async () => {
		if (isClanIntegration) {
			try {
				const newWebhookReq: ApiGenerateClanWebhookRequest = {
					webhook_name: getRandomWebhookName(),
					avatar: getRandomAvatar(),
					clanId: clanId
				};
				const response = await dispatch(generateClanWebhook({ request: newWebhookReq, clanId }));
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error(response?.meta?.requestStatus);
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: t('toast.addSuccess'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
						},
						text2Style: { fontSize: size.small }
					});
				}
			} catch (error) {
				console.error('Error creating webhook:', error);
				Toast.show({
					type: 'error',
					text1: t('toast.addError')
				});
			}
		}
	}, [isClanIntegration, getRandomWebhookName, getRandomAvatar, clanId, dispatch, t]);

	return {
		handleAddChannelWebhook,
		handleAddClanWebhook
	};
};

const useWebhookDescription = (isClanIntegration: boolean, styles: any) => {
	const { t } = useTranslation(['clanIntegrationsSetting']);
	const navigation = useNavigation<any>();

	const handleOpenDocs = useCallback(
		(url: string) => {
			navigation.navigate(APP_SCREEN.APP_BROWSER, { url, title: 'Webhooks' });
		},
		[navigation]
	);

	const descriptionText = useMemo(() => {
		const baseDescription = isClanIntegration ? t('clanWebhooks.description') : t('webhooks.description');

		if (isClanIntegration) {
			return (
				<>
					{baseDescription} &nbsp;
					<Text style={styles.textLink} onPress={() => handleOpenDocs(CLAN_WEBHOOK_DOCS_URL)}>
						{t('clanWebhooks.tips')}
					</Text>
				</>
			);
		}

		return (
			<>
				{baseDescription}&nbsp;
				<Text style={styles.textLink} onPress={() => handleOpenDocs(CHANNEL_WEBHOOK_DOCS_URL)}>
					{t('webhooks.learnMore')}
				</Text>
				&nbsp;{t('webhooks.try')}&nbsp;
				<Text style={styles.textLink} onPress={() => handleOpenDocs(CHANNEL_WEBHOOK_DOCS_URL)}>
					{t('webhooks.buildOne')}
				</Text>
			</>
		);
	}, [isClanIntegration, t, styles.textLink, handleOpenDocs]);

	return descriptionText;
};

// Main component
export function Webhooks({ route }: { route: any }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const { clanId, isClanSetting, channelId, isClanIntegration, webhookList } = useWebhookData(route);

	const { handleAddChannelWebhook, handleAddClanWebhook } = useWebhookActions(clanId, isClanSetting, isClanIntegration, channelId);

	const descriptionText = useWebhookDescription(isClanIntegration, styles);

	const handleAddWebhook = useCallback(() => {
		if (isClanIntegration) {
			handleAddClanWebhook();
		} else {
			handleAddChannelWebhook();
		}
	}, [isClanIntegration, handleAddClanWebhook, handleAddChannelWebhook]);

	const renderWebhookItem = useCallback(
		({ item }: { item: any }) => <WebhooksItem webhook={item} isClanIntegration={isClanIntegration} isClanSetting={isClanSetting} />,
		[isClanIntegration, isClanSetting]
	);

	const keyExtractor = useCallback((item: any) => item.id?.toString(), []);

	return (
		<View style={styles.wrapper}>
			<Text style={styles.description}>{descriptionText}</Text>

			<FlatList
				data={webhookList}
				keyExtractor={keyExtractor}
				renderItem={renderWebhookItem}
				ListEmptyComponent={<WebhooksEmpty />}
				contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
				showsVerticalScrollIndicator={false}
			/>

			<Pressable style={styles.stickyNewButton} onPress={handleAddWebhook}>
				<Text style={styles.stickyNewButtonText}> + </Text>
			</Pressable>
		</View>
	);
}
