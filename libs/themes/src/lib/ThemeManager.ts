export interface ThemeConfig {
	name: string;
	displayName: string;
	cssFile: string;
	color: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
	{
		name: 'dark',
		displayName: 'Dark Theme',
		color: '#26272B',
		cssFile: 'assets/themes/dark.css'
	},
	{
		name: 'light',
		displayName: 'Light Theme',
		color: '#FFFFFF',
		cssFile: 'assets/themes/light.css'
	},
	{
		name: 'sunrise',
		displayName: 'Sunrise Theme',
		color: 'linear-gradient(135deg, #e0c3fc, #fbc2eb, #fcd5ce, #fff1eb)',
		cssFile: 'assets/themes/sunrise.css'
	},
	{
		name: 'purple_haze',
		displayName: 'Purple Haze',
		color: 'linear-gradient(135deg, #a78bfa, #f472b6, #60a5fa)',
		cssFile: 'assets/themes/purple_haze.css'
	},
	{
		name: 'redDark',
		displayName: 'Red Dark',
		color: 'linear-gradient(135deg, #3b0a0a, #7f1d1d, #e11d48)',
		cssFile: 'assets/themes/redDark.css'
	},
	{
		name: 'Abyss Dark',
		displayName: 'Abyss Dark',
		color: 'linear-gradient(135deg, #0f172a, #1e3a8a, #6d28d9)',
		cssFile: 'assets/themes/abyss_dark_.css'
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
