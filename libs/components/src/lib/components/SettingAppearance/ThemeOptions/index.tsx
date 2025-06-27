import { useApp } from '@mezon/core';
import { selectTheme } from '@mezon/store';
import { useTheme } from '@mezon/themes';
import { Icons } from '@mezon/ui';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ThemeOptions = () => {
	const appearanceTheme = useSelector(selectTheme);
	const { setAppearanceTheme, systemIsDark } = useApp();
	const [themeChosen, setThemeChosen] = useState<string>(appearanceTheme);

	const { themes, currentTheme, changeTheme, isLoading } = useTheme();

	const onWindowMatch = () => {
		if (themeChosen === 'system') {
			if (systemIsDark.matches) {
				setAppearanceTheme('dark');
				changeTheme('dark');
			} else {
				setAppearanceTheme('light');
				changeTheme('light');
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
			changeTheme(themeChosen);
		}
	}, [themeChosen, appearanceTheme, setAppearanceTheme, changeTheme]);

	const getThemePreviewColors = (themeName: string) => {
		switch (themeName) {
			case 'light':
				return { bg: '#FFFFFF', border: '#D9DBDD' };
			case 'dark':
				return { bg: '#313338', border: '#3B3D44' };
			case 'cyber':
				return { bg: '#0A0A0A', border: '#00FF94' };
			default:
				return { bg: '#313338', border: '#3B3D44' };
		}
	};

	const handleThemeClick = (themeName: string) => {
		setThemeChosen(themeName);
	};

	return (
		<div className="pt-10">
			<div className="dark:text-white text-black">Theme</div>
			<div className="theme-container flex flex-wrap gap-[20px] mt-3">
				{themes.map((theme) => {
					const colors = getThemePreviewColors(theme.name);
					const isSelected = themeChosen === theme.name;

					return (
						<div key={theme.name} className="flex flex-col items-center gap-2">
							<div
								className={`theme-preview w-[60px] h-[60px] rounded-full border-2 border-solid cursor-pointer relative transition-all duration-200 ${
									isSelected ? 'border-indigo-600 scale-110' : 'border-gray-300 hover:scale-105'
								} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
								style={{
									backgroundColor: colors.bg,
									borderColor: isSelected ? '#4F46E5' : colors.border
								}}
								onClick={() => handleThemeClick(theme.name)}
							>
								{isSelected && (
									<div className="w-fit p-[2px] bg-indigo-600 absolute top-0 right-0 rounded-full">
										<Icons.CheckIcon />
									</div>
								)}

								<div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
									{theme.name === 'cyber' && <div className="w-3 h-3 bg-green-400 rounded-full shadow-[0_0_8px_#00ff94]"></div>}
									{theme.name === 'nature' && <div className="w-3 h-3 bg-green-600 rounded-full"></div>}
									{theme.name === 'ocean' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
								</div>
							</div>
							<span className="text-xs dark:text-white text-black font-medium">{theme.displayName}</span>
						</div>
					);
				})}

				<div className="flex flex-col items-center gap-2">
					<div
						className={`system-theme w-[60px] h-[60px] rounded-full border-2 border-solid cursor-pointer flex justify-center items-center relative transition-all duration-200 ${
							themeChosen === 'system' ? 'border-indigo-600 scale-110' : 'border-gray-300 hover:scale-105'
						} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
						style={{
							backgroundColor: systemIsDark.matches ? '#313338' : '#FFFFFF',
							borderColor: themeChosen === 'system' ? '#4F46E5' : '#D9DBDD'
						}}
						onClick={() => handleThemeClick('system')}
					>
						<Icons.SpinArrowIcon />
						{themeChosen === 'system' && (
							<div className="w-fit p-[2px] bg-indigo-600 absolute top-0 right-0 rounded-full">
								<Icons.CheckIcon />
							</div>
						)}
					</div>
					<span className="text-xs dark:text-white text-black font-medium">System</span>
				</div>
			</div>

			{isLoading && <div className="mt-4 text-sm dark:text-gray-300 text-gray-600">Loading theme...</div>}
		</div>
	);
};

export default ThemeOptions;
