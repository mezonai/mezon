import { appActions, selectIsShowMemberList, selectTheme, useAppDispatch } from '@mezon/store';
import { ThemeManager } from '@mezon/themes';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useApp() {
	const dispatch = useAppDispatch();
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const appearanceTheme = useSelector(selectTheme);
	const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)');

	const setAppearanceTheme = useCallback(
		(value: string) => {
			dispatch(appActions.setTheme(value));
		},
		[dispatch]
	);

	const setIsShowMemberList = useCallback(
		(value: boolean) => {
			dispatch(appActions.setIsShowMemberList(value));
		},
		[dispatch]
	);

	useEffect(() => {
		if (!appearanceTheme) {
			setAppearanceTheme(ThemeManager.getCurrentTheme());
		}
	}, [appearanceTheme]);

	useEffect(() => {
		if (!appearanceTheme) return;

		const currentThemeInStorage = ThemeManager.getCurrentTheme();

		if (currentThemeInStorage === appearanceTheme) {
			const appearanceType = ThemeManager.getAppearanceType(appearanceTheme);
			if (appearanceType === 'light') {
				document.documentElement.classList.remove('dark');
			} else {
				document.documentElement.classList.add('dark');
			}
			return;
		}

		ThemeManager.loadTheme(appearanceTheme, true)
			.then((appearanceType) => {
				if (appearanceType === 'light') {
					document.documentElement.classList.remove('dark');
				} else {
					document.documentElement.classList.add('dark');
				}
			})
			.catch((error) => {
				console.error('Failed to load theme:', error);
				document.documentElement.classList.add('dark');
			});
	}, [appearanceTheme]);

	return useMemo(
		() => ({
			isShowMemberList,
			setIsShowMemberList,
			setAppearanceTheme,
			systemIsDark
		}),
		[isShowMemberList, setIsShowMemberList, setAppearanceTheme, systemIsDark]
	);
}

