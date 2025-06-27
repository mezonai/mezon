import React from 'react';
import { useTheme } from '../hooks/useTheme';

export const ThemeDemo: React.FC = () => {
	const { currentTheme, themes, changeTheme, isLoading } = useTheme();

	return (
		<div className="p-6 space-y-6">
			<div className="bg-theme-secondary p-4 rounded-lg border border-theme-primary">
				<h2 className="text-lg font-semibold text-theme-primary mb-3">Current Theme: {currentTheme}</h2>
				<div className="flex flex-wrap gap-2">
					{themes.map((theme) => (
						<button
							key={theme.name}
							className={`px-4 py-2 rounded border transition-all ${
								currentTheme === theme.name
									? 'btn-theme-primary'
									: 'bg-theme-tertiary text-theme-secondary border-theme-primary hover:bg-theme-hover'
							}`}
							onClick={() => changeTheme(theme.name)}
							disabled={isLoading}
						>
							{theme.displayName}
						</button>
					))}
				</div>
				{isLoading && <p className="text-theme-secondary mt-2">Loading theme...</p>}
			</div>
		</div>
	);
};
