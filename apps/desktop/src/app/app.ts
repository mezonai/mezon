import { app, BrowserWindow, Menu, MenuItemConstructorOptions, screen, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { windowManager } from 'node-window-manager';
import { join } from 'path';
import { format } from 'url';
import { rendererAppName, rendererAppPort } from './constants';

import tray from '../Tray';

import { ACTIVE_WINDOW, TRIGGER_SHORTCUT } from './events/constants';
import { initBadge } from './services/badge';

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
		autoUpdater.checkForUpdates();
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
		}
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
		App.mainWindow.on('close', (event) => this.onClose(event));

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

		App.application.setAppUserModelId('mezon.ai');
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		App.BrowserWindow = browserWindow;
		App.application = app;

		App.application.on('window-all-closed', App.onWindowAllClosed);
		App.application.on('ready', App.onReady);
		App.application.on('activate', App.onActivate);
	}

	/**
	 * setup badge for the app
	 */
	private static setupBadge() {
		return initBadge(App.application, App.mainWindow);
	}

	private static setupWindowManager() {
		if (process.platform === 'darwin') {
			const permissionGranted = windowManager.requestAccessibility();
			if (!permissionGranted) {
				console.warn('Accessibility permission is required for this application to work correctly on macOS.');
				return;
			}
		}

		const windowInfoArray = [];
		let defaultApp = null;
		const usageThreshold = 30 * 60 * 1000;
		let hasSentDefaultApp = false;
		let activityTimeout = null;
		let isFirstRun = true;

		const updateWindowInfoArray = () => {
			windowInfoArray.length = 0;
			windowManager.getWindows().forEach((window) => {
				if (window.isVisible()) {
					const pathDelimiter = process.platform === 'win32' ? '\\' : '/';
					const fullPath = window.path.split(pathDelimiter).pop();
					const appName = fullPath.replace(/\.(exe|app)$/, '');
					const windowTitle = window.getTitle();

					if ([EActivities.SPOTIFY, EActivities.CODE, EActivities.LOL, EActivities.VISUAL_STUDIO_CODE].includes(appName as EActivities)) {
						const startTime = new Date().toISOString();
						windowInfoArray.push({ appName, windowTitle, startTime });
					}
				}
			});
		};

		updateWindowInfoArray();

		if (windowInfoArray.length > 0) {
			defaultApp = windowInfoArray[0];
		}

		windowManager.on('window-activated', (window) => {
			const pathDelimiter = process.platform === 'win32' ? '\\' : '/';
			const fullPath = window.path.split(pathDelimiter).pop();
			const appName = fullPath.replace(/\.(exe|app)$/, '');
			const windowTitle = window.getTitle();
			const startTime = new Date().toISOString();

			if (defaultApp && defaultApp?.appName) {
				if (isFirstRun) {
					App.mainWindow.webContents.send(ACTIVE_WINDOW, { ...defaultApp, startTime });
					hasSentDefaultApp = true;
					isFirstRun = false;
				}
			} else if ([EActivities.SPOTIFY, EActivities.CODE, EActivities.LOL, EActivities.VISUAL_STUDIO_CODE].includes(appName) && isFirstRun) {
				defaultApp = { appName, windowTitle, startTime };
				App.mainWindow.webContents.send(ACTIVE_WINDOW, defaultApp);
				hasSentDefaultApp = true;
				isFirstRun = false;
			}

			if ([EActivities.SPOTIFY, EActivities.CODE, EActivities.LOL, EActivities.VISUAL_STUDIO_CODE].includes(appName) && !isFirstRun) {
				if (activityTimeout) {
					clearInterval(activityTimeout);
				}

				activityTimeout = setInterval(() => {
					const newWindowTitle = window.getTitle();
					if (!defaultApp || defaultApp.appName !== appName || defaultApp.windowTitle !== newWindowTitle) {
						defaultApp = { appName, windowTitle: newWindowTitle, startTime };
						hasSentDefaultApp = false;
					}

					if (!newWindowTitle) {
						isFirstRun = true;
						defaultApp = {};
						clearInterval(activityTimeout);
						hasSentDefaultApp = false;
					}

					if (defaultApp && !hasSentDefaultApp) {
						App.mainWindow.webContents.send(ACTIVE_WINDOW, defaultApp);
						hasSentDefaultApp = true;
					}
				}, usageThreshold);
			}
		});
	}

	private static setupMenu() {
		const isMac = process.platform === 'darwin';

		const appMenu: MenuItemConstructorOptions[] = [
			{
				label: app.name,
				submenu: [
					{ role: 'about' },
					{ label: 'Check for Updates...', click: () => autoUpdater.checkForUpdates() },
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
