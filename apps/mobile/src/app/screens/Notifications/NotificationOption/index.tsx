import { Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { IMezonMenuItemProps, IMezonMenuSectionProps, MezonMenu, MezonSwitch, reserve } from '../../../componentUI';
import { EActionDataNotify } from '../types';
import { style } from './NotificationOption.styles';
interface INotificationOptionProps {
	selectedTabs: { mention: boolean; individual: boolean };
	onChangeTab: (value: string, isSelected: true) => void;
}
const NotificationOption = memo(({ selectedTabs, onChangeTab }: INotificationOptionProps) => {
	const { t } = useTranslation(['notification']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handleTabChange = (value, isSelected) => {
		onChangeTab(value, isSelected);
	};
	const Btn = useCallback(
		({ val }: { val: EActionDataNotify }) => (
			<MezonSwitch value={selectedTabs[val]} onValueChange={(isSelected) => handleTabChange(val, isSelected)} />
		),
		[selectedTabs]
	);

	const notificationMenu = useMemo(
		() =>
			[
				{
					title: t('tabNotify.forYou'),
					icon: <Icons.AtIcon color={themeValue.textStrong} />,
					component: <Btn val={EActionDataNotify.Individual} />
				},
				{
					title: t('tabNotify.mention'),
					icon: <Icons.BellIcon color={themeValue.textStrong} />,
					component: <Btn val={EActionDataNotify.Mention} />
				},
				{
					title: t('tabNotify.messages'),
					icon: <Icons.ChatIcon color={themeValue.textStrong} />,
					component: <Btn val={EActionDataNotify.Messages} />
				},
				{
					title: t('tabNotify.topics'),
					icon: <Icons.DiscussionIcon color={themeValue.textStrong} />,
					component: <Btn val={EActionDataNotify.Topics} />
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
