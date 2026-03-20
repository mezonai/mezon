import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import MezonMenu from '../../../componentUI/MezonMenu';
import { Icons } from '../../../componentUI/MobileIcons';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './NotificationOption.styles';
interface INotificationOptionProps {
	selectedTabs: string;
	onChangeTab: (value: string) => void;
}

const InboxType = {
	INDIVIDUAL: 'individual',
	MESSAGES: 'messages',
	MENTIONS: 'mentions',
	TOPICS: 'topics'
};

const NotificationOption = memo(({ selectedTabs, onChangeTab }: INotificationOptionProps) => {
	const { t } = useTranslation(['notification']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { dismiss } = useBottomSheetModal();

	const handleTabChange = (value) => {
		onChangeTab(value);
		dismiss();
	};

	const notificationMenu = useMemo(
		() =>
			[
				{
					title: t('tabNotify.forYou'),
					icon: <Icons.ForYouIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />,
					onPress: () => handleTabChange(InboxType.INDIVIDUAL),
					component:
						selectedTabs === InboxType.INDIVIDUAL ? (
							<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.textStrong} />
						) : null
				},
				{
					title: t('tabNotify.mention'),
					icon: <Icons.MentionIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />,
					onPress: () => handleTabChange(InboxType.MENTIONS),
					component:
						selectedTabs === InboxType.MENTIONS ? <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.textStrong} /> : null
				},
				{
					title: t('tabNotify.messages'),
					icon: <Icons.MessagesBoxIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />,
					onPress: () => handleTabChange(InboxType.MESSAGES),
					component:
						selectedTabs === InboxType.MESSAGES ? <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.textStrong} /> : null
				},
				{
					title: t('tabNotify.topics'),
					icon: <Icons.TopicIcon color={themeValue.textStrong} height={size.s_24} width={size.s_24} />,
					onPress: () => handleTabChange(InboxType.TOPICS),
					component:
						selectedTabs === InboxType.TOPICS ? <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.textStrong} /> : null
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);
	const menu = useMemo(() => [{ items: notificationMenu }] satisfies IMezonMenuSectionProps[], [notificationMenu]);

	return (
		<View style={styles.wrapperOption}>
			<MezonMenu menu={menu} />
		</View>
	);
});

export default NotificationOption;
