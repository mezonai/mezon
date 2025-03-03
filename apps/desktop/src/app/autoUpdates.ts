import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron';
import type { UpdateInfo } from 'electron-updater';
import { autoUpdater, DOWNLOAD_PROGRESS } from 'electron-updater';

import log from 'electron-log/main';
import { CHECK_UPDATE, INSTALL_UPDATE, UPDATE_AVAILABLE, UPDATE_ERROR } from './events/constants';
import { forceQuit } from './utils';

let isUpdateCheckStarted = false;

export default function setupAutoUpdates() {
	if (isUpdateCheckStarted) {
		return;
	}
	isUpdateCheckStarted = true;
	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;

	ipcMain.handle(INSTALL_UPDATE, () => {
		new Notification({
			icon: 'apps/desktop/src/assets/desktop-taskbar.ico',
			title: 'Mezon Installation',
			body: `Please wait while Mezon is installing. The app will open automatically.`
		}).show();
		forceQuit.enable();
		return autoUpdater.quitAndInstall();
	});

	ipcMain.handle(CHECK_UPDATE, () => {
		autoUpdater.checkForUpdates();
	});

	autoUpdater.on('error', (error: Error) => {
		dialog.showMessageBox({
			message: `Error: ${error.message} !!`
		});

		BrowserWindow.getAllWindows().forEach((window) => {
			window.webContents.send(UPDATE_ERROR, error);
		});
	});

	autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
		BrowserWindow.getAllWindows().forEach((window) => {
			window.webContents.send(UPDATE_AVAILABLE, info);
		});
	});

	autoUpdater.on('download-progress', (progressObj) => {
		BrowserWindow.getAllWindows().forEach((window) => {
			window.webContents.send(DOWNLOAD_PROGRESS, progressObj);
		});
	});
}

autoUpdater.on('update-available', (info: UpdateInfo) => {
	log.info(`The current version is ${app.getVersion()}. There is a new update for the app ${info.version}`);
	autoUpdater.downloadUpdate();
});
