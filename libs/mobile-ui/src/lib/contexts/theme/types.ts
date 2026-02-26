import type { themeColors } from '../../themes';

export enum ThemeModeBase {
	LIGHT = 'light',
	DARK = 'dark',
	SUNRISE = 'sunrise',
	REDDARK = 'redDark',
	PURPLE_HAZE = 'purpleHaze',
	ABYSS_DARK = 'abyssDark',
	SUNSET = 'sunset'
}

export enum ThemeModeAuto {
	AUTO = 'system'
}

export type ThemeMode = ThemeModeBase | ThemeModeAuto;

export interface ThemeContextType {
	themeBasic: ThemeModeBase;
	theme: ThemeMode;
	themeValue: (typeof themeColors)[ThemeModeBase];
	setTheme: (theme: ThemeMode) => void;
}
