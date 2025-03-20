import { app, BrowserWindow } from 'electron';
import Store from 'electron-store';
import fs from 'fs';

export const IS_MAC_OS = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = process.platform === 'linux';
export const IS_PREVIEW = process.env.IS_PREVIEW === 'true';
export const IS_FIRST_RUN = !fs.existsSync(`${app.getPath('userData')}/config.json`);
export const IS_PRODUCTION = process.env.APP_ENV === 'production';

export const windows = new Set<BrowserWindow>();
export const store: Store = new Store();

export function getCurrentWindow(): BrowserWindow | null {
	return BrowserWindow.getFocusedWindow();
}

export function getLastWindow(): BrowserWindow | undefined {
	return Array.from(windows).pop();
}

export function hasExtraWindows(): boolean {
	return BrowserWindow.getAllWindows().length > 1;
}

export function reloadWindows(isAutoUpdateEnabled = true): void {
	BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
		const { hash } = new URL(window.webContents.getURL());

		if (isAutoUpdateEnabled) {
			window.loadURL(`${process.env.BASE_URL}${hash}`);
		} else {
			window.loadURL(`file://${__dirname}/index.html${hash}`);
		}
	});
}

export function focusLastWindow(): void {
	if (BrowserWindow.getAllWindows().every((window) => !window.isVisible())) {
		BrowserWindow.getAllWindows().forEach((window) => window.show());
	} else {
		getLastWindow()?.focus();
	}
}

export function getAppTitle(chatTitle?: string): string {
	const appName = app.getName();

	if (!chatTitle) {
		return appName;
	}

	return `${chatTitle} · ${appName}`;
}

export const forceQuit = {
	value: false,

	enable() {
		this.value = true;
	},

	disable() {
		this.value = false;
	},

	get isEnabled(): boolean {
		return this.value;
	}
};

export function sanitizeUrl(url: string): string {
	if (!url) return '';

	try {
		const decodedUrl = decodeURIComponent(url);
		const encodedUrl = encodeURI(decodedUrl);
		const parsed = new URL(encodedUrl);

		if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
			return '';
		}
		if (parsed.protocol === 'data:' && !encodedUrl.startsWith('data:image/')) {
			return '';
		}
		return encodedUrl;
	} catch (e) {
		return '';
	}
}

export function escapeHtml(unsafe: string): string {
	if (!unsafe) return '';
	return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
