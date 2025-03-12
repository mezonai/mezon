import { useTheme } from '@mezon/mobile-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import MezonOption, { IMezonOptionData } from '../../../componentUI/MezonOption';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type AppearanceSettingScreen = typeof APP_SCREEN.SETTINGS.APPEARANCE;
export default function AppearanceSetting({ navigation }: SettingScreenProps<AppearanceSettingScreen>) {
	const { theme, themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['appearanceSetting']);
	const { t: tTheme } = useTranslation(['appThemeSetting']);

	const menuTheme = useMemo(
		() =>
			[
				{
					title: t('menu.theme.title'),
					items: [
						{
							title: t('menu.theme.theme'),
							expandable: true,
							previewValue: tTheme(`fields.${theme}`),
							onPress: () => {
								navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
									screen: APP_SCREEN.SETTINGS.APP_THEME
								});
							}
						},
						{
							title: t('menu.theme.syncAcrossClients.title'),
							description: t('menu.theme.syncAcrossClients.description'),
							component: <MezonSwitch iconYesNo />
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[theme]
	);

	const menuSearch = useMemo(
		() =>
			[
				{
					title: t('menu.search.title'),
					items: [
						{
							title: t('menu.search.showResultCount.title'),
							description: t('menu.search.showResultCount.description'),
							component: <MezonSwitch iconYesNo />
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[]
	);

	const DMMessagePreviewOptions = useMemo(
		() =>
			[
				{
					title: t('fields.DMMessagePreview.AllMessages'),
					value: 0
				},
				{
					title: t('fields.DMMessagePreview.UnreadDMOnly'),
					value: 1
				},
				{
					title: t('fields.DMMessagePreview.None'),
					value: 2
				}
			] as IMezonOptionData,
		[]
	);

	return (
		<View style={styles.container}>
			<MezonMenu menu={menuTheme} />
			<MezonOption data={DMMessagePreviewOptions} title={t('fields.DMMessagePreview.title')} />
			<MezonMenu menu={menuSearch} />
		</View>
	);
}
