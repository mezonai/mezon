import { appActions, selectTheme, useAppDispatch } from '@mezon/store-mobile';
import React, { createContext, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import { themeColors } from '../../themes';
import type { ThemeContextType, ThemeMode } from './types';
import { ThemeModeAuto, ThemeModeBase } from './types';

const LEGACY_THEME_MAP: Record<string, ThemeModeBase> = {
	purple_haze: ThemeModeBase.PURPLE_HAZE,
	abyss_dark: ThemeModeBase.ABYSS_DARK
};

function normalizeTheme(theme: string): ThemeMode {
	return (LEGACY_THEME_MAP[theme] ?? theme) as ThemeMode;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const rawTheme = useSelector(selectTheme);
	const appearanceTheme = normalizeTheme(rawTheme);

	const colorScheme = useColorScheme();
	const systemTheme = useMemo(() => (colorScheme === 'dark' ? ThemeModeBase.DARK : ThemeModeBase.LIGHT), [colorScheme]);

	const setTheme = useCallback(
		(value: ThemeMode) => {
			dispatch(appActions.setTheme(value));
		},
		[dispatch]
	);

	const currentTheme = useMemo(() => {
		return appearanceTheme === ThemeModeAuto.AUTO ? systemTheme : (appearanceTheme as ThemeMode);
	}, [appearanceTheme, systemTheme]);

	const currentThemeColors = useMemo(() => {
		return themeColors[currentTheme as ThemeModeBase];
	}, [currentTheme]);

	const themeBasicMode = appearanceTheme === 'system' ? systemTheme : appearanceTheme;

	const value = useMemo(() => {
		return {
			themeBasic: themeBasicMode,
			theme: appearanceTheme,
			themeValue: currentThemeColors,
			setTheme
		};
	}, [themeBasicMode, appearanceTheme, currentThemeColors, setTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
