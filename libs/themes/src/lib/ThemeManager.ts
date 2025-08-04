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
		name: 'abyss_dark',
		displayName: 'Abyss Dark',
		color: 'linear-gradient(135deg, #0f172a, #1e3a8a, #6d28d9)',
		cssFile: 'assets/themes/abyss_dark_.css'
	}
];

const LIGHT_THEMES = ['light', 'sunrise'];

let currentThemeLink: HTMLLinkElement | null = null;
let loadingOverlay: HTMLDivElement | null = null;

const DEFAULT_THEME = 'sunrise';
const THEME_LOAD_TIMEOUT = 10000;

export class ThemeManager {
	static isLightTheme(themeName: string): boolean {
		return LIGHT_THEMES.includes(themeName);
	}

	static getAppearanceType(themeName: string): 'light' | 'dark' {
		return this.isLightTheme(themeName) ? 'light' : 'dark';
	}

	private static showLoadingOverlay(): void {
		this.hideLoadingOverlay();

		loadingOverlay = document.createElement('div');
		loadingOverlay.id = 'theme-loading-overlay';
		loadingOverlay.innerHTML = `
			<div style="
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.8);
				display: flex;
				justify-content: center;
				align-items: center;
				z-index: 9999;
				backdrop-filter: blur(4px);
			">
				<div style="
					background: rgba(255, 255, 255, 0.1);
					padding: 20px;
					border-radius: 12px;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 12px;
				">
					<div style="
						width: 32px;
						height: 32px;
						border: 3px solid rgba(255, 255, 255, 0.3);
						border-top: 3px solid white;
						border-radius: 50%;
						animation: spin 1s linear infinite;
					"></div>
					<div style="color: white; font-size: 14px;">Loading theme...</div>
				</div>
			</div>
			<style>
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			</style>
		`;

		document.body.appendChild(loadingOverlay);
	}

	private static hideLoadingOverlay(): void {
		if (loadingOverlay) {
			loadingOverlay.remove();
			loadingOverlay = null;
		}
	}

	static async loadTheme(themeName: string, showLoading = true): Promise<'light' | 'dark'> {
		const theme = AVAILABLE_THEMES.find((t) => t.name === themeName);

		if (!theme) {
			console.warn(`Theme "${themeName}" not found, falling back to default theme`);
			if (themeName !== DEFAULT_THEME) {
				return this.loadTheme(DEFAULT_THEME, showLoading);
			}
			return this.getAppearanceType(DEFAULT_THEME);
		}

		if (showLoading) {
			this.showLoadingOverlay();
		}

		try {
			// Remove all existing theme links
			const existingThemeLinks = document.querySelectorAll('link[id^="theme-"]');
			existingThemeLinks.forEach((link) => link.remove());

			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = theme.cssFile;
			link.id = `theme-${themeName}`;

			document.head.appendChild(link);

			await new Promise<void>((resolve, reject) => {
				link.onload = () => {
					resolve();
				};
			});

			currentThemeLink = link;
			localStorage.setItem('current-theme', themeName);

			return this.getAppearanceType(themeName);
		} catch (error) {
			console.error(`Failed to load theme "${themeName}":`, error);

			const failedLink = document.getElementById(`theme-${themeName}`);
			if (failedLink) {
				failedLink.remove();
			}

			if (themeName !== DEFAULT_THEME) {
				console.log(`Falling back to default theme: ${DEFAULT_THEME}`);
				return this.loadTheme(DEFAULT_THEME, false);
			}

			throw error;
		} finally {
			if (showLoading) {
				setTimeout(() => {
					this.hideLoadingOverlay();
				}, 200);
			}
		}
	}

	static getCurrentTheme(): 'light' | 'dark' | 'sunrise' | 'purple_haze' | 'redDark' | 'abyss_dark' {
		const stored = localStorage.getItem('current-theme');
		if (stored && AVAILABLE_THEMES.find((t) => t.name === stored)) {
			return stored as 'light' | 'dark' | 'sunrise' | 'purple_haze' | 'redDark' | 'abyss_dark';
		}
		return DEFAULT_THEME;
	}

	static async initializeTheme(): Promise<'sunrise' | 'dark' | 'light' | 'purple_haze' | 'redDark' | 'abyss_dark'> {
		const currentTheme = this.getCurrentTheme();
		try {
			return await this.loadTheme(currentTheme, false);
		} catch (error) {
			console.error('Failed to initialize theme, using default:', error);
			return await this.loadTheme(DEFAULT_THEME, false);
		}
	}

	static getAvailableThemes(): ThemeConfig[] {
		return AVAILABLE_THEMES;
	}

	static getDefaultTheme(): string {
		return DEFAULT_THEME;
	}
}
