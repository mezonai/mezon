import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { CheckIcon, Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps, reserve } from '../../../componentUI/MezonMenu';
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
					icon: <Icons.AtIcon color={themeValue.textStrong} />,
					onPress: () => handleTabChange(InboxType.INDIVIDUAL),
					component: selectedTabs === InboxType.INDIVIDUAL ? <CheckIcon color={themeValue.textStrong} /> : null
				},
				{
					title: t('tabNotify.mention'),
					icon: <Icons.BellIcon color={themeValue.textStrong} />,
					onPress: () => handleTabChange(InboxType.MENTIONS),
					component: selectedTabs === InboxType.MENTIONS ? <CheckIcon color={themeValue.textStrong} /> : null
				},
				{
					title: t('tabNotify.messages'),
					icon: <Icons.ChatIcon color={themeValue.textStrong} />,
					onPress: () => handleTabChange(InboxType.MESSAGES),
					component: selectedTabs === InboxType.MESSAGES ? <CheckIcon color={themeValue.textStrong} /> : null
				},
				{
					title: t('tabNotify.topics'),
					icon: <Icons.DiscussionIcon color={themeValue.textStrong} />,
					onPress: () => handleTabChange(InboxType.TOPICS),
					component: selectedTabs === InboxType.TOPICS ? <CheckIcon color={themeValue.textStrong} /> : null
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const settingMenu = useMemo(
		() =>
			[
				{
					title: t('tabNotify.notificationSettings'),
					icon: <Icons.SettingsIcon color={themeValue.textStrong} />,
					expandable: true,
					onPress: () => reserve()
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const menu = useMemo(
		() => [{ items: notificationMenu }, { items: settingMenu }] satisfies IMezonMenuSectionProps[],
		[notificationMenu, settingMenu]
	);

	return (
		<View style={styles.wrapperOption}>
			<MezonMenu menu={menu} />
		</View>
	);
});

export default NotificationOption;
