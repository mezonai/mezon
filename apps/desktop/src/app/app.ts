import { BrowserWindow, Menu, MenuItemConstructorOptions, Notification, app, screen, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import activeWindows from 'mezon-active-windows';
import { join } from 'path';
import { format } from 'url';
import { electronAppName, rendererAppName, rendererAppPort } from './constants';

import tray from '../Tray';
import setupAutoUpdates from './autoUpdates';
import { ACTIVE_WINDOW, SET_ATTACHMENT_DATA, TRIGGER_SHORTCUT } from './events/constants';
import setupRequestPermission from './requestPermission';
import { initBadge } from './services/badge';
import { forceQuit } from './utils';

const isQuitting = false;

export enum EActivities {
	CODE = 'Code',
	VISUAL_STUDIO_CODE = 'Visual Studio Code',
	SPOTIFY = 'Spotify',
	LOL = 'LeagueClientUx'
}

export default class App {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow: typeof Electron.BrowserWindow;

	public static isDevelopmentMode() {
		return !app.isPackaged;
	}

	private static onWindowAllClosed() {
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
				openAtLogin: true
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
		}

		if (process.platform === 'win32') {
			app.setAppUserModelId('app.mezon.ai');
		}

		autoUpdater.checkForUpdates();
		const sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
		setInterval(() => {
			autoUpdater.checkForUpdates();
		}, sixHoursInMilliseconds);
	}

	private static onActivate() {
		if (App.mainWindow === null) {
			App.onReady();
		}

		// reopen window after soft quit on macos
		if (process.platform === 'darwin' && !App.mainWindow?.isVisible()) {
			App.mainWindow?.show();
		}
	}

	private static initMainWindow() {
		const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
		const width = Math.min(1280, workAreaSize.width || 1280);
		const height = Math.min(720, workAreaSize.height || 720);

		// Create the browser window.
		App.mainWindow = new BrowserWindow({
			width: width,
			height: height,
			show: false,
			frame: false,
			titleBarOverlay: process.platform == 'darwin' ? true : false,
			titleBarStyle: process.platform == 'darwin' ? 'hidden' : 'default',
			trafficLightPosition: process.platform == 'darwin' ? { x: 10, y: 10 } : undefined,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				backgroundThrottling: false,
				preload: join(__dirname, 'main.preload.js')
			},
			icon: join(__dirname, 'assets', 'desktop-taskbar-256x256.ico')
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
				if (process.platform == 'win32' || process.platform == 'linux') {
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
		App.application.on('open-url', function (event, url) {
			event.preventDefault();

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

		// if main window is ready to show, close the splash window and show the main window
		App.mainWindow.once('ready-to-show', () => {
			App.mainWindow.show();
		});
		// handle all external redirects in a new browser window
		App.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
			if (App.isDevelopmentMode()) {
				return { action: 'allow' };
			}
			shell.openExternal(url);
			return { action: 'deny' };
		});

		// Emitted when the window is closed.
		App.mainWindow.on('close', (event) => {
			if (forceQuit.isEnabled) {
				app.exit(0);
				forceQuit.disable();
			} else {
				event.preventDefault();
				App.mainWindow.hide();
			}
		});

		App.application.on('before-quit', () => {
			tray.destroy();
			App.application.exit();
		});
	}

	private static generateQueryString(params: Record<string, string>): string {
		return Object.keys(params)
			.map((key) => {
				return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
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
		// load the index.html of the app.
		if (!App.application.isPackaged) {
			const baseUrl = `http://localhost:${rendererAppPort}`;
			const fullUrl = this.generateFullUrl(baseUrl, params);
			App.mainWindow.loadURL(fullUrl);
		} else {
			const baseUrl = join(__dirname, '..', rendererAppName, 'index.html');
			App.mainWindow.loadURL(
				format({
					pathname: baseUrl,
					protocol: 'file:',
					slashes: true,
					query: params
				})
			);
		}
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		App.BrowserWindow = browserWindow;
		App.application = app;

		App.application.on('window-all-closed', App.onWindowAllClosed);
		App.application.on('ready', App.onReady);
		App.application.on('activate', App.onActivate);
	}

	static currentWindow: Electron.BrowserWindow | null = null;

	static openNewWindow(props: any, options?: Electron.BrowserWindowConstructorOptions, params?: Record<string, string>) {
		const defaultOptions: Electron.BrowserWindowConstructorOptions = {
			width: 1000,
			height: 800,
			show: false,
			titleBarOverlay: process.platform == 'darwin',
			titleBarStyle: 'hidden',
			trafficLightPosition: process.platform == 'darwin' ? { x: 10, y: 10 } : undefined,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				preload: join(__dirname, 'main.preload.js'),
				backgroundThrottling: false
			},
			icon: join(__dirname, 'assets', 'desktop-taskbar-256x256.ico'),
			autoHideMenuBar: true
		};

		const windowOptions = { ...defaultOptions, ...options };

		if (this.currentWindow && !this.currentWindow.isDestroyed()) {
			this.currentWindow.webContents.send(SET_ATTACHMENT_DATA, props);
			return;
		}

		this.currentWindow = new BrowserWindow(windowOptions);
		this.currentWindow.setBackgroundColor('#000000');
		this.currentWindow.once('ready-to-show', () => {
			setTimeout(() => {
				this.currentWindow?.show();
			}, 100);
		});
		const filePath = App.application.isPackaged
			? 'assets/image-window/image-window.html'
			: 'apps/desktop/src/assets/image-window/image-window.html';
		if (App.application.isPackaged) {
			const baseUrl = join(__dirname, '..', electronAppName, filePath);
			const fullUrl = this.generateFullUrl(baseUrl, params);

			this.currentWindow.loadURL(
				format({
					pathname: fullUrl,
					protocol: 'file:',
					slashes: true,
					query: params
				})
			);
		} else {
			const baseUrl = join(__dirname, '..', '..', '..', filePath);
			const fullUrl = this.generateFullUrl(baseUrl, params);

			this.currentWindow.loadURL(
				format({
					pathname: fullUrl,
					protocol: 'file:',
					slashes: true,
					query: params
				})
			);
		}

		this.currentWindow.webContents.on('did-finish-load', () => {
			this.currentWindow.webContents.send(SET_ATTACHMENT_DATA, props);
		});

		return this.currentWindow;
	}

	/**
	 * setup badge for the app
	 */
	private static setupBadge() {
		return initBadge(App.application, App.mainWindow);
	}

	private static setupWindowManager() {
		if (process.platform === 'darwin') {
			console.error('not implemented');
			return;
		}

		let defaultApp = null;
		const usageThreshold = 30 * 60 * 1000;
		let activityTimeout = null;

		const fetchActiveWindow = () => {
			const window = activeWindows?.getActiveWindow();
			if (window) {
				const appName = window?.windowClass.replace(/\.(exe|app)$/, '');
				const windowTitle = window?.windowName;
				const startTime = new Date().toISOString();

				if ([EActivities.SPOTIFY, EActivities.CODE, EActivities.LOL, EActivities.VISUAL_STUDIO_CODE].includes(appName as EActivities)) {
					const newAppInfo = { appName, windowTitle, startTime };

					if (!defaultApp || defaultApp?.appName !== newAppInfo?.appName || defaultApp.windowTitle !== newAppInfo?.windowTitle) {
						defaultApp = newAppInfo;
						App.mainWindow.webContents.send(ACTIVE_WINDOW, defaultApp);
					}
				}
			}
		};

		fetchActiveWindow();

		if (activityTimeout) {
			clearInterval(activityTimeout);
		}

		activityTimeout = setInterval(() => {
			fetchActiveWindow();
		}, usageThreshold);
	}

	private static setupMenu() {
		const isMac = process.platform === 'darwin';

		const appMenu: MenuItemConstructorOptions[] = [
			{
				label: app.name,
				submenu: [
					{ role: 'about' },
					{
						label: 'Check for Updates',
						click: () => {
							autoUpdater.checkForUpdates().then((data) => {
								if (!data?.updateInfo) return;
								const appVersion = app.getVersion();
								new Notification({
									icon: 'apps/desktop/src/assets/desktop-taskbar-256x256.ico',
									title: 'No update',
									body: `The current version (${appVersion}) is the latest.`
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
				submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
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
						: ([{ role: 'close' }] as MenuItemConstructorOptions[]))
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
}
