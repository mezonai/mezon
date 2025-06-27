export interface ThemeConfig {
	name: string;
	displayName: string;
	cssFile: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
	{
		name: 'dark',
		displayName: 'Dark Theme',
		cssFile: 'assets/themes/dark.css'
	},
	{
		name: 'light',
		displayName: 'Light Theme',
		cssFile: 'assets/themes/light.css'
	},
	{
		name: 'cyber',
		displayName: 'Cyber Theme',
		cssFile: 'assets/themes/cyber.css'
	}
];

let currentThemeLink: HTMLLinkElement | null = null;

export class ThemeManager {
	static async loadTheme(themeName: string): Promise<void> {
		const theme = AVAILABLE_THEMES.find((t) => t.name === themeName);
		if (!theme) {
			console.warn(`Theme "${themeName}" not found`);
			return;
		}

		try {
			if (currentThemeLink) {
				currentThemeLink.remove();
				currentThemeLink = null;
			}

			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = theme.cssFile;
			link.id = `theme-${themeName}`;

			document.head.appendChild(link);
			currentThemeLink = link;

			await new Promise((resolve, reject) => {
				link.onload = resolve;
				link.onerror = reject;
			});

			localStorage.setItem('current-theme', themeName);
		} catch (error) {
			console.error(`Failed to load theme "${themeName}":`, error);
		}
	}

	static getCurrentTheme(): string {
		return localStorage.getItem('current-theme') || 'dark';
	}

	static async initializeTheme(): Promise<void> {
		const currentTheme = this.getCurrentTheme();
		await this.loadTheme(currentTheme);
	}

	static getAvailableThemes(): ThemeConfig[] {
		return AVAILABLE_THEMES;
	}
}
