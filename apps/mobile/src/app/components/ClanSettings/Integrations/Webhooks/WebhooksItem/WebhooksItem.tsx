import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ApiWebhook } from 'mezon-js/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

export function WebhooksItem({ webhook, isClanIntegration, isClanSetting }: { webhook: ApiWebhook, isClanIntegration: boolean, isClanSetting: boolean }) {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['clanIntegrationsSetting']);

	const styles = style(themeValue);
	const convertDate = (isoDateString: string): string => {
		const date = new Date(isoDateString);
		const options: Intl.DateTimeFormatOptions = {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		};
		return date.toLocaleDateString('en-GB', options);
	};
	const webhookOwner = useAppSelector((state) => selectMemberClanByUserId(state, webhook.creatorId as string));
	const handleEditWebhooks = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS_EDIT, {
			webhook,
			isClanIntegration,
			isClanSetting
		});
	};
	return (
		<TouchableOpacity onPress={handleEditWebhooks}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					backgroundColor: themeValue.secondaryWeight,
					paddingHorizontal: size.s_20,
					paddingVertical: size.s_10,
					gap: size.s_10,
					borderRadius: size.s_10,
					marginBottom: size.s_10
				}}
			>
				<Image
					style={styles.image}
					source={{
						uri: webhook?.avatar
					}}
				/>
				<View style={{ flex: 1 }}>
					<Text style={styles.name}>{webhook?.webhook_name}</Text>
					<Text style={styles.textTime}>
						{t('webhooksItem.createdBy', {
							webhookCreateTime: convertDate(webhook.createTime || ''),
							webhookUserOwnerName: webhookOwner?.user?.username
						})}
					</Text>
				</View>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />
			</View>
		</TouchableOpacity>
	);
}
