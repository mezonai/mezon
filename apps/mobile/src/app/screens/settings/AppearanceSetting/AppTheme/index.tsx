import { ThemeMode, ThemeModeBase, themeColors, useTheme } from '@mezon/mobile-ui';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonSlideOption, { IMezonSlideOptionsData } from '../../../../componentUI/MezonSlideOption';
import { APP_SCREEN, SettingScreenProps } from '../../../../navigation/ScreenTypes';
import { style } from './styles';

type AppThemeScreen = typeof APP_SCREEN.SETTINGS.APP_THEME;
export default function AppThemeSetting({ navigation }: SettingScreenProps<AppThemeScreen>) {
	const { themeValue, setTheme, themeBasic } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['appThemeSetting']);

	const BoxSelector = useCallback(
		({ color = 'transparent', border = 'transparent' }: { color?: string; border?: string }) => (
			<View style={[styles.box, { backgroundColor: color, borderColor: border }]}></View>
		),
		[]
	);

	const BoxGradientSelector = useCallback(
		({
			color = 'transparent',
			colorSecond = 'transparent',
			border = 'transparent'
		}: {
			color?: string;
			colorSecond?: string;
			border?: string;
		}) => <LinearGradient colors={[color, colorSecond]} style={[styles.box, { borderColor: border }]} />,
		[]
	);

	const themeOptions = useMemo(
		() =>
			[
				{
					element: <BoxSelector color={themeColors.dark.primary} border={themeColors.dark.border} />,
					value: ThemeModeBase.DARK,
					title: t('fields.dark')
				},
				{
					element: <BoxSelector color={themeColors.light.primary} border={themeColors.light.border} />,
					value: ThemeModeBase.LIGHT,
					title: t('fields.light')
				},
				{
					element: (
						<BoxGradientSelector
							color={themeColors.sunrise.primary}
							colorSecond={themeColors.sunrise.secondary}
							border={themeColors.sunrise.border}
						/>
					),
					value: ThemeModeBase.SUNRISE,
					title: t('fields.sunrise')
				},
				{
					element: (
						<BoxGradientSelector
							color={themeColors.redDark.primary}
							colorSecond={themeColors.redDark.secondary}
							border={themeColors.redDark.border}
						/>
					),
					value: ThemeModeBase.REDDARK,
					title: t('fields.readDark')
				}
			] satisfies IMezonSlideOptionsData[],
		[]
	);

	const themeIndex = useMemo(() => {
		return themeOptions.findIndex((t) => t.value === themeBasic);
	}, []);

	function handleThemeChange(value: string) {
		setTheme(value as ThemeMode);
	}

	return (
		<LinearGradient colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]} style={styles.container}>
			<MezonSlideOption data={themeOptions} onChange={handleThemeChange} initialIndex={themeIndex} />
		</LinearGradient>
	);
}
