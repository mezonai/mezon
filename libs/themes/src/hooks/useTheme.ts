import { useCallback, useEffect, useState } from 'react';
import { AVAILABLE_THEMES, ThemeConfig, ThemeManager } from '../lib/ThemeManager';

export interface UseThemeReturn {
	currentTheme: string;
	themes: ThemeConfig[];
	changeTheme: (themeName: string) => Promise<void>;
	isLoading: boolean;
}

export const useTheme = (): UseThemeReturn => {
	const [currentTheme, setCurrentTheme] = useState<string>(() => ThemeManager.getCurrentTheme());
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const changeTheme = useCallback(
		async (themeName: string) => {
			if (themeName === currentTheme) return;

			setIsLoading(true);
			try {
				await ThemeManager.loadTheme(themeName);
				setCurrentTheme(themeName);
			} catch (error) {
				console.error('Failed to change theme:', error);
			} finally {
				setIsLoading(false);
			}
		},
		[currentTheme]
	);

	useEffect(() => {
		const initTheme = async () => {
			setIsLoading(true);
			try {
				await ThemeManager.initializeTheme();
			} catch (error) {
				console.error('Failed to initialize theme:', error);
			} finally {
				setIsLoading(false);
			}
		};

		initTheme();
	}, []);

	return {
		currentTheme,
		themes: AVAILABLE_THEMES,
		changeTheme,
		isLoading
	};
};
