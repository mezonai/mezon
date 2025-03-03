import { appActions, selectTheme, useAppDispatch } from '@mezon/store-mobile';
import React, { createContext, useCallback, useMemo } from 'react';
import { Appearance } from 'react-native';
import { useSelector } from 'react-redux';
import { themeColors } from '../../themes';
import { ThemeContextType, ThemeMode, ThemeModeAuto, ThemeModeBase } from './types';

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);

	const systemTheme = useMemo(() => (Appearance.getColorScheme() === 'dark' ? ThemeModeBase.DARK : ThemeModeBase.LIGHT), []);

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
			theme: currentTheme,
			themeValue: currentThemeColors,
			setTheme
		};
	}, [currentTheme, currentThemeColors, setTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
