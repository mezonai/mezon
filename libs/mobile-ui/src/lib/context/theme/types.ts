import { themeColors } from '../../themes';

export enum ThemeModeBase {
	LIGHT = 'light',
	DARK = 'dark'
}

export enum ThemeModeAuto {
	AUTO = 'system'
}

export type ThemeMode = ThemeModeBase | ThemeModeAuto;

export interface ThemeContextType {
	themeBasic: ThemeModeBase;
	theme: ThemeModeAuto;
	themeValue: (typeof themeColors)[ThemeModeBase];
	setTheme: (theme: ThemeMode) => void;
}
