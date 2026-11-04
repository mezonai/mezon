import { useApp } from '@mezon/core';
import { selectTheme } from '@mezon/store';
import { useTheme } from '@mezon/themes';
import { MezonIcon, MzIcons16, MzIcons20, SpinningIcon } from '@mezon/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const ThemeOptions = () => {
	const { t } = useTranslation('common');
	const appearanceTheme = useSelector(selectTheme);
	const { setAppearanceTheme, systemIsDark } = useApp();
	const [themeChosen, setThemeChosen] = useState<string>(appearanceTheme);
	const { themes, isLoading, error } = useTheme();

	const onWindowMatch = () => {
		if (themeChosen === 'system') {
			if (systemIsDark.matches) {
				setAppearanceTheme('dark');
			} else {
				setAppearanceTheme('light');
			}
		}
	};
	useEffect(() => {
		onWindowMatch();
		const handleChange = () => {
			onWindowMatch();
		};
		systemIsDark.addEventListener('change', handleChange);
		return () => {
			systemIsDark.removeEventListener('change', handleChange);
		};
	}, [themeChosen, systemIsDark]);

	useEffect(() => {
		if (themeChosen !== 'system') {
			setAppearanceTheme(themeChosen);
		}
	}, [themeChosen, appearanceTheme, setAppearanceTheme]);

	const handleThemeColorClick = async (themeName: string) => {
		if (isLoading) return;

		try {
			// Only update the theme selection, let useApp handle the actual theme loading
			setThemeChosen(themeName);
		} catch (error) {
			console.error('Error changing theme:', error);
		}
	};

	return (
		<div className="pt-10 flex flex-col gap-2">
			<div>{t('theme')}</div>

			{error && (
				<div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-md">
					<div className="flex items-center gap-2">
						<div className="text-red-600">
							<MezonIcon icon={MzIcons16.mzChannelWarning} />
						</div>
						<p className="text-sm text-red-700">{error}</p>
					</div>
				</div>
			)}

			{isLoading && (
				<div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
					<div className="flex items-center gap-2">
						<SpinningIcon icon={MzIcons20.mzSpinner} className="text-blue-600" />
						<p className="text-sm text-blue-700">{t('switchingTheme')}</p>
					</div>
				</div>
			)}

			<div className="mt-3 flex flex-col">
				<div className="flex flex-wrap gap-y-4 gap-x-[30px] mt-5">
					{themes.map((theme) => {
						const themeDisplayName = t(`themeOptions.${theme.name}`, { defaultValue: theme.displayName });
						return (
							<div key={theme.name} className="relative" onClick={() => handleThemeColorClick(theme.name)}>
								<div
									className={`
										aspect-square rounded-full cursor-pointer w-[60px] h-[60px] transition-all
										${appearanceTheme === theme.name ? 'border-2 border-indigo-600 shadow-lg' : 'border border-gray-300'}
										${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105'}
										${appearanceTheme === theme.name ? 'ring-2 ring-indigo-200' : ''}
									`}
									style={{
										background: theme.color
									}}
									title={themeDisplayName}
								/>
								<div
									className={`
										w-fit p-[2px] bg-indigo-600 absolute top-0 right-0 rounded-full transition-all
										${appearanceTheme === theme.name ? 'block scale-100' : 'hidden scale-0'}
									`}
								>
									<MezonIcon icon={MzIcons16.mzCheck} className="text-white" />
								</div>

								<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
									<div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{themeDisplayName}</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ThemeOptions;
