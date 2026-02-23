import type { MenuItemConstructorOptions } from 'electron';
import { BrowserWindow, Menu, Notification, app, dialog, ipcMain, powerMonitor, screen, shell } from 'electron';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import activeWindows from 'mezon-active-windows';
import { join } from 'path';
import ua from 'universal-analytics';
import tray from '../Tray';
import { EActivityCoding, EActivityGaming, EActivityMusic } from './activities';
import setupAutoUpdates from './autoUpdates';
import { rendererAppName, rendererAppPort } from './constants';
import { ACTIVE_WINDOW, FINISH_RENDER, LOCK_SCREEN, TRIGGER_SHORTCUT, UNLOCK_SCREEN } from './events/constants';
import setupRequestPermission from './requestPermission';
import { initBadge } from './services/badge';
import { forceQuit } from './utils';

const isQuitting = false;
const ACTIVITY_CODING = Object.values(EActivityCoding);
const ACTIVITY_MUSIC = Object.values(EActivityMusic);
const ACTIVITY_GAMING = Object.values(EActivityGaming);

const _IMAGE_WINDOW_KEY = 'IMAGE_WINDOW_KEY';
const STORE_ID = 'MEZON.Mezon_vdgv9gtrfadw6!MEZON.Mezon';

const isMac = process.platform === 'darwin';

dialog.showErrorBox = function (_title, _content) {
	// ignore
};

dialog.showOpenDialog = function (...args) {
	log.error('[Disabled Dialog] showOpenDialog called:', args);
	return Promise.resolve({ canceled: true, filePaths: [] });
};

export default class App {
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow: typeof Electron.BrowserWindow;
	static imageViewerWindow: Electron.BrowserWindow | null = null;
	static channelAppWindow: Electron.BrowserWindow | null = null;
	static attachmentData: any;
	static imageScriptWindowLoaded = false;

	private static updateCheckInterval: NodeJS.Timeout | null = null;
	private static activityTrackingInterval: NodeJS.Timeout | null = null;
	private static isActivityTrackingEnabled = true;

	public static isDevelopmentMode() {
		return !app.isPackaged;
	}

	private static cleanupIntervals() {
		if (App.updateCheckInterval) {
			clearInterval(App.updateCheckInterval);
			App.updateCheckInterval = null;
		}
		if (App.activityTrackingInterval) {
			clearInterval(App.activityTrackingInterval);
			App.activityTrackingInterval = null;
		}
	}

	private static onWindowAllClosed() {
		App.cleanupIntervals();
		App.application.quit();
	}

	private static onClose(event) {
		if (!isQuitting) {
			event.preventDefault();
			App.mainWindow.hide();
		}
		return false;
	}

	private static onReady() {
		if (rendererAppName) {
			App.application.setLoginItemSettings({
				openAtLogin: true,
				path: process.execPath
			});

			App.initMainWindow();
			App.loadMainWindow();
			App.setupMenu();
			App.setupBadge();
			tray.init(isQuitting);
			App.setupWindowManager();
			App.mainWindow.webContents.once('dom-ready', () => {
				setupAutoUpdates();
				setupRequestPermission();
			});
			App.setupDetectLockScreen();
		}

		if (process.platform === 'win32') {
			app.setAppUserModelId(STORE_ID);
		}

		autoUpdater.checkForUpdates();
		const updateCheckTimeInMilliseconds = 60 * 60 * 1000;

		App.updateCheckInterval = setInterval(() => {
			autoUpdater.checkForUpdates();
		}, updateCheckTimeInMilliseconds);

		const visitor = ua('G-9SD8R7Z8TJ');
		visitor.screenview('Home Screen', 'Mezon Name').send();
	}

	private static onActivate() {
		// Ensure a valid window exists or recreate if destroyed/null
		if (!App.isWindowValid(App.mainWindow)) {
			App.onReady();
		}

		// Reopen window after soft quit
		if (App.mainWindow && App.isWindowValid(App.mainWindow) && !App.mainWindow.isVisible()) {
			App.mainWindow.show();
		}
	}

	private static showOfflinePage(errorDescription?: string) {
		if (!App.isWindowValid(App.mainWindow)) return;

		const offlineHTML = `
			<!DOCTYPE html>
			<html class="dark">
			<head>
				<style>
					* { margin: 0; padding: 0; box-sizing: border-box; }
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						background-color: #313338;
						color: #e6e6e6;
						height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
						-webkit-app-region: drag;
					}
					.offline-container {
						text-align: center;
						max-width: 400px;
						padding: 40px;
						-webkit-app-region: no-drag;
					}
					.offline-icon {
						font-size: 48px;
						margin-bottom: 16px;
					}
					.offline-title {
						font-size: 20px;
						font-weight: 600;
						margin-bottom: 8px;
						color: #ffffff;
					}
					.offline-message {
						font-size: 14px;
						color: #a0a0a0;
						margin-bottom: 24px;
						line-height: 1.5;
					}
					.status-text {
						font-size: 12px;
						color: #ef4444;
						margin-bottom: 16px;
					}
					.retry-button {
						background-color: #5864f2;
						color: #ffffff;
						border: none;
						padding: 10px 24px;
						border-radius: 4px;
						font-size: 14px;
						font-weight: 500;
						cursor: pointer;
					}
					.retry-button:hover {
						background-color: #4752c4;
					}
					.retry-button:disabled {
						background-color: #3b3d5c;
						cursor: not-allowed;
					}
				</style>
			</head>
			<body>
				<div class="offline-container">
					<div class="offline-title">Network Error</div>
					<div class="offline-message">Unable to connect. Please check your internet connection and try again.</div>
					<div class="status-text" id="status">${errorDescription || ''}</div>
					<button class="retry-button" id="retryBtn" onclick="retryConnection()">Retry</button>
				</div>
				<script>
					function retryConnection() {
						var btn = document.getElementById('retryBtn');
						var status = document.getElementById('status');

						if (!navigator.onLine) {
							status.textContent = 'Still offline. Please check your connection.';
							return;
						}

						btn.disabled = true;
						btn.textContent = 'Connecting...';
						status.textContent = '';

						var img = new Image();
						img.onload = function() {
							window.location.href = 'https://mezon.ai/';
						};
						img.onerror = function() {
							btn.disabled = false;
							btn.textContent = 'Retry';
							status.textContent = 'Connection failed. Please try again.';
						};
						img.src = 'https://mezon.ai/assets/favicon.ico?t=' + Date.now();
					}

					window.addEventListener('online', function() {
						document.getElementById('status').textContent = 'Connection restored. Click Retry.';
					});
					window.addEventListener('offline', function() {
						document.getElementById('status').textContent = 'Still offline.';
					});
				</script>
			</body>
			</html>
		`;

		App.mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlineHTML)}`);
		if (!App.mainWindow.isVisible()) {
			App.mainWindow.show();
		}
	}

	private static initMainWindow() {
		const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
		const width = Math.min(1280, workAreaSize.width || 1280);
		const height = Math.min(720, workAreaSize.height || 720);

		const loginSettings = App.application.getLoginItemSettings();
		const showOnStartup = loginSettings.wasOpenedAtLogin;
		const isHidden = process.argv.includes('--hidden');

		// Create the browser window.
		App.mainWindow = new BrowserWindow({
			width,
			height,
			show: !(showOnStartup && isHidden),
			backgroundColor: '#313338',
			frame: false,
			titleBarOverlay: false,
			titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
			trafficLightPosition: process.platform === 'darwin' ? { x: -100, y: -100 } : undefined,
			fullscreenable: false,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				backgroundThrottling: false,
				preload: join(__dirname, 'main.preload.js')
			},
			icon: join(__dirname, 'assets', 'desktop-taskbar.ico')
		});
		App.mainWindow.setMinimumSize(950, 500);
		App.mainWindow.setMenuBarVisibility(false);
		App.mainWindow.center();

		App.mainWindow.on('blur', () => {
			App.mainWindow.webContents.send('window-blurred', true);
		});

		App.mainWindow.on('focus', () => {
			App.mainWindow.webContents.send('window-focused', true);
		});

		const gotTheLock = App.application.requestSingleInstanceLock();
		if (gotTheLock) {
			App.application.on('second-instance', (e, argv) => {
				if (process.platform === 'win32' || process.platform === 'linux') {
					const url = argv.pop().slice(1);

					if (url) {
						const index = url.indexOf('data=');
						if (index > 0) {
							const dataString = url.substring(index + 5);

							if (dataString) {
								App.loadMainWindow({ deepLinkUrl: dataString });
							}
						}
					}
				}

				if (App.mainWindow) {
					if (App.mainWindow.isMinimized()) App.mainWindow.restore();
					App.mainWindow.show();
					App.mainWindow.focus();
				}
			});
		} else {
			App.application.quit();
			return;
		}

		// App.mainWindow.webContents.openDevTools();
		if (!App.application.isDefaultProtocolClient('mezonapp')) {
			App.application.setAsDefaultProtocolClient('mezonapp');
		}

		// Protocol handler for osx
		App.application.on('open-url', function (_event, url) {
			_event.preventDefault();

			if (url) {
				const index = url.indexOf('=');
				const dataString = url.substring(index + 1);

				if (dataString) {
					App.loadMainWindow({ deepLinkUrl: dataString });
				}
			}
		});

		App.application.on('will-finish-launching', function () {
			// console.log("will-finish-launching");
		});

		ipcMain.once(FINISH_RENDER, () => {
			if (App.isWindowValid(App.mainWindow) && !App.mainWindow.isVisible()) {
				App.mainWindow.show();
			}
		});
		// handle all external redirects in a new browser window
		App.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
			if (App.isDevelopmentMode()) {
				return { action: 'allow' };
			}
			shell.openExternal(url);
			return { action: 'deny' };
		});

		App.mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
			log.error(`Failed to load: ${validatedURL}, Error code: ${errorCode}, Description: ${errorDescription}`);
			if (errorCode !== -3) {
				App.showOfflinePage(errorDescription);
			}
		});

		App.mainWindow.webContents.on('certificate-error', (event, url, error, _certificate, callback) => {
			log.error(`Certificate error for ${url}: ${error}`);
			event.preventDefault();
			callback(false);
		});

		App.mainWindow.webContents.on('render-process-gone', (_event, details) => {
			log.error('Render process gone:', details);
			if (details.reason !== 'clean-exit') {
				log.info('Attempting to reload after crash...');
				setTimeout(() => {
					if (App.isWindowValid(App.mainWindow)) {
						App.mainWindow.reload();
					}
				}, 1000);
			}
		});

		App.mainWindow.on('unresponsive', () => {
			log.warn('Window became unresponsive');
		});

		App.mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
			if (message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('net::ERR_')) {
				log.error(`Network error: ${message} at ${sourceId}:${line}`);
			}
		});

		// Intercept close to hide the window unless force quit
		App.mainWindow.on('close', (_event) => {
			if (forceQuit.isEnabled) {
				app.exit(0);
				forceQuit.disable();
				return;
			}
			_event.preventDefault();
			App.mainWindow.hide();
		});

		App.application.on('before-quit', async () => {
			try {
				autoUpdater.checkForUpdates();
			} catch (error) {
				console.error('Update check failed:', error);
			}
			// Cleanup intervals to prevent memory leaks
			App.cleanupIntervals();
			tray.destroy();
			App.application.exit();
		});
	}

	private static generateQueryString(params: Record<string, string>): string {
		return Object.keys(params)
			.map((key) => {
				return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
			})
			.join('&');
	}

	private static generateFullUrl(base: string, params: Record<string, string>): string {
		if (params) {
			const queryString = App.generateQueryString(params);
			return queryString ? `${base}?${queryString}` : base;
		}
		return base;
	}

	private static loadMainWindow(params?: Record<string, string>) {
		if (!App.application.isPackaged) {
			const baseUrl = `http://localhost:${rendererAppPort}`;
			const fullUrl = this.generateFullUrl(baseUrl, params);
			App.mainWindow.loadURL(fullUrl);
		} else {
			App.mainWindow.loadURL('https://mezon.ai/');
		}
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		App.BrowserWindow = browserWindow;
		App.application = app;

		App.application.on('window-all-closed', App.onWindowAllClosed);
		App.application.on('ready', App.onReady);
		App.application.on('activate', App.onActivate);
	}

	static isWindowValid(window: Electron.BrowserWindow | null): boolean {
		return window !== null && !window.isDestroyed();
	}

	public static ensureMainWindow(params?: Record<string, string>) {
		if (!App.isWindowValid(App.mainWindow)) {
			App.initMainWindow();
			App.loadMainWindow(params ?? {});
			return;
		}

		if (App.mainWindow.isMinimized()) {
			App.mainWindow.restore();
		}

		if (!App.mainWindow.isVisible()) {
			App.mainWindow.show();
		}

		App.mainWindow.setAlwaysOnTop(true);
		App.mainWindow.focus();
		setImmediate(() => {
			App.mainWindow.setAlwaysOnTop(false);
		});
	}

	public static setActivityTrackingEnabled(enabled: boolean) {
		App.isActivityTrackingEnabled = enabled;
		if (enabled) {
			App.setupWindowManager();
		} else {
			if (App.activityTrackingInterval) {
				clearInterval(App.activityTrackingInterval);
				App.activityTrackingInterval = null;
			}
		}
	}

	/**
	 * setup badge for the app
	 */
	private static setupBadge() {
		return initBadge(App.application, App.mainWindow);
	}

	private static setupWindowManager() {
		if (!App.isActivityTrackingEnabled) return;
		let defaultApp = null;
		const usageThreshold = 30 * 60 * 1000;

		const fetchActiveWindow = (): void => {
			const window = activeWindows?.getActiveWindow();
			if (!window) return;

			const { windowClass, windowName } = window;
			const appName = windowClass.replace(/\.(exe|app)$/, '');
			const windowTitle = windowName;
			const startTime = new Date().toISOString();

			const typeActivity = getActivityType(appName);
			if (typeActivity === null) return;

			const newAppInfo = { appName, windowTitle, startTime, typeActivity };

			if (!defaultApp || defaultApp.appName !== newAppInfo.appName || defaultApp.windowTitle !== newAppInfo.windowTitle) {
				defaultApp = newAppInfo;
				App.mainWindow.webContents.send(ACTIVE_WINDOW, defaultApp);
			}
		};

		const getActivityType = (appName: string): number | null => {
			if (ACTIVITY_CODING.includes(appName as EActivityCoding)) return 1;
			if (ACTIVITY_MUSIC.includes(appName as EActivityMusic)) return 2;
			if (ACTIVITY_GAMING.includes(appName as EActivityGaming)) return 3;
			return null;
		};

		try {
			fetchActiveWindow();
		} catch (ex) {
			console.error(ex);
		}

		if (App.activityTrackingInterval) {
			clearInterval(App.activityTrackingInterval);
		}

		App.activityTrackingInterval = setInterval(() => {
			try {
				if (App.isActivityTrackingEnabled) {
					fetchActiveWindow();
				}
			} catch (ex) {
				console.error(ex);
			}
		}, usageThreshold);
	}

	private static setupMenu() {
		const appMenu: MenuItemConstructorOptions[] = [
			{
				label: app.name,
				submenu: [
					{ role: 'about' },
					{
						label: 'Check for Updates',
						click: () => {
							if (process.platform === 'win32') {
								shell.openExternal('ms-windows-store://pdp/?ProductId=9pf25lf1fj17');
								return;
							}
							if (process.platform === 'darwin') {
								shell.openExternal('macappstore://itunes.apple.com/app/mezon-desktop/id6756601798');
								return;
							}
							autoUpdater.checkForUpdates().then((data) => {
								if (!data?.updateInfo) return;
								const appVersion = app.getVersion();
								let body = `The current version (${appVersion}) is up to date.`;
								if (data?.updateInfo.version != appVersion) {
									body = `The current version is ${appVersion}. A new version ${data?.updateInfo.version} is available`;
								}
								new Notification({
									icon: 'apps/desktop/src/assets/desktop-taskbar.ico',
									title: 'Checking for updates..',
									body
								}).show();
							});
						}
					},
					{ type: 'separator' },
					{
						type: 'normal',
						label: 'Settings...',
						accelerator: 'CmdOrCtrl+,',
						click: () => App.mainWindow.webContents.send(TRIGGER_SHORTCUT, 'CmdOrCtrl+,')
					},
					{ type: 'separator' },
					{ role: 'services' },
					{ type: 'separator' },
					{ role: 'hide' },
					{ role: 'hideOthers' },
					{ role: 'unhide' },
					{ type: 'separator' },
					{ role: 'quit' }
				]
			}
		];

		const template: MenuItemConstructorOptions[] = [
			// { role: 'appMenu' }
			...(isMac ? appMenu : []),
			// { role: 'fileMenu' }
			{
				label: 'File',
				submenu: [
					...(isMac
						? ([
								{
									label: 'Hide Window',
									accelerator: 'CmdOrCtrl+W',
									click: () => {
										App.mainWindow.hide();
									}
								}
							] as MenuItemConstructorOptions[])
						: ([{ role: 'quit' }] as MenuItemConstructorOptions[]))
				]
			},
			// { role: 'editMenu' }
			{
				label: 'Edit',
				submenu: [
					{ role: 'undo' },
					{ role: 'redo' },
					{ type: 'separator' },
					{ role: 'cut' },
					{ role: 'copy' },
					{ role: 'paste' },
					...(isMac
						? ([
								{ role: 'pasteAndMatchStyle' },
								{ role: 'delete' },
								{ role: 'selectAll' },
								{ type: 'separator' },
								{
									label: 'Speech',
									submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }]
								}
							] as MenuItemConstructorOptions[])
						: ([{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }] as MenuItemConstructorOptions[]))
				]
			},
			// { role: 'viewMenu' }
			{
				label: 'View',
				submenu: [
					{
						label: 'Reload',
						accelerator: 'CmdOrCtrl+R',
						click: () => {
							App.mainWindow.webContents.send('reload-app');
						}
					},
					{
						label: 'Hide',
						accelerator: 'CmdOrCtrl+W',
						click: () => {
							App.mainWindow.hide();
						}
					},
					{ type: 'separator' },
					{ role: 'resetZoom' },
					{ role: 'zoomIn' },
					{ role: 'zoomOut' },
					{ type: 'separator' },
					{ role: 'togglefullscreen' },
					{ role: 'toggleDevTools' }
				]
			},
			// { role: 'windowMenu' }
			{
				label: 'Window',
				submenu: [
					{ role: 'minimize' },
					{ role: 'zoom' },
					...(isMac
						? ([{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }] as MenuItemConstructorOptions[])
						: ([{ role: 'quit' }] as MenuItemConstructorOptions[]))
				]
			},
			{
				role: 'help',
				submenu: [
					{
						label: 'Learn More',
						click: async () => {
							await shell.openExternal('https://mezon.ai');
						}
					}
				]
			}
		];

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}

	private static setupDetectLockScreen() {
		powerMonitor.on('lock-screen', () => {
			App.mainWindow.webContents.send(LOCK_SCREEN);
		});

		powerMonitor.on('unlock-screen', () => {
			App.mainWindow.webContents.send(UNLOCK_SCREEN);
		});
	}
}
