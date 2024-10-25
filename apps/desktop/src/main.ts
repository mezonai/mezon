import { BrowserWindow, Notification, app, dialog, ipcMain } from 'electron';
import log from 'electron-log/main';
import { UpdateInfo, autoUpdater } from 'electron-updater';
import App from './app/app';
import { NAVIGATE_TO_URL, SENDER_ID } from './app/events/constants';
import ElectronEvents from './app/events/electron.events';
import SquirrelEvents from './app/events/squirrel.events';
import { environment } from './environments/environment';

export default class Main {
	static initialize() {
		if (SquirrelEvents.handleEvents()) {
			// squirrel event handled (except first run event) and app will exit in 1000ms, so don't do anything else
			app.quit();
		}
	}

	static bootstrapApp() {
		log.initialize();
		App.main(app, BrowserWindow);
	}

	static bootstrapAppEvents() {
		ElectronEvents.bootstrapElectronEvents();

		// initialize auto updater service
		if (!App.isDevelopmentMode()) {
			// UpdateEvents.initAutoUpdateService();
		}
	}
}

ipcMain.handle(SENDER_ID, () => {
	return environment.senderId;
});

ipcMain.on(NAVIGATE_TO_URL, async (event, path, isSubPath) => {
	if (App.mainWindow) {
		App.mainWindow.webContents.send('navigate-to-path', path);

		if (!App.mainWindow.isVisible()) {
			App.mainWindow.show();
		}
		App.mainWindow.focus();
	}
});

autoUpdater.autoDownload = false;
autoUpdater.logger = log;

autoUpdater.on('checking-for-update', () => {
	// checking for update
});

autoUpdater.on('update-available', (info: UpdateInfo) => {
	const window = App.BrowserWindow.getFocusedWindow();
	dialog
		.showMessageBox(window, {
			icon: 'apps/desktop/src/assets/desktop-taskbar-256x256.ico',
			type: 'info',
			buttons: ['Download', 'Cancel'],
			title: 'Updates available',
			message: `The current version is ${app.getVersion()}. There is a new update for the app ${info.version}. Do you want to download?`
		})
		.then((result) => {
			if (result.response === 0) {
				autoUpdater.downloadUpdate();
			}
		});
});

autoUpdater.on('update-not-available', (info: UpdateInfo) => {
	new Notification({
		icon: 'apps/desktop/src/assets/desktop-taskbar-256x256.ico',
		title: 'No update',
		body: `The current version (${info.version}) is the latest.`
	}).show();
});

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
	const window = App.BrowserWindow.getFocusedWindow();
	dialog
		.showMessageBox(window, {
			type: 'info',
			buttons: ['Install now', 'Cancel'],
			title: 'Mezon install',
			message: `The current version is ${app.getVersion()}. Install ${info.version} now.`
		})
		.then((result) => {
			if (result.response === 0) {
				const windows = App.BrowserWindow.getAllWindows();
				windows.forEach((window) => {
					window.removeAllListeners('close');
					window.close();
				});
				autoUpdater.quitAndInstall();
				setTimeout(() => {
					App.application.quit();
				}, 10000);
			}
		});
});

autoUpdater.on('download-progress', (progressObj) => {
	let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
	log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
	log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
	log.info('downloading...', log_message);
});

autoUpdater.on('error', (error) => {
	dialog.showMessageBox({
		message: `Error: ${error.message} !!`
	});
});

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
