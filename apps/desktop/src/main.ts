import { BrowserWindow, app, clipboard, dialog, ipcMain, screen, shell } from 'electron';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import App from './app/app';
import {
	ACTION_SHOW_IMAGE,
	CLOSE_APP,
	CLOSE_IMAGE_WINDOW,
	DOWNLOAD_FILE,
	IMAGE_WINDOW_TITLE_BAR_ACTION,
	MAXIMIZE_WINDOW,
	MINIMIZE_WINDOW,
	NAVIGATE_TO_URL,
	OPEN_NEW_WINDOW,
	SENDER_ID,
	TITLE_BAR_ACTION,
	UNMAXIMIZE_WINDOW
} from './app/events/constants';
import ElectronEvents from './app/events/electron.events';
import SquirrelEvents from './app/events/squirrel.events';
import { forceQuit } from './app/utils';
import updateImagePopup from './assets/image-window/update_window_image';
import openImagePopup from './assets/image-window/window_image';
import { environment } from './environments/environment';
export type ImageWindowProps = {
	attachmentData: ApiMessageAttachment & { create_time?: string };
	messageId: string;
	mode: ChannelStreamMode;
	attachmentUrl: string;
	currentClanId: string;
	currentChannelId: string;
	currentDmId: string;
	checkListAttachment: boolean;
};

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

ipcMain.handle(DOWNLOAD_FILE, async (event, { url, defaultFileName }) => {
	let fileExtension = defaultFileName.split('.').pop().toLowerCase();
	if (!fileExtension || !/^[a-z0-9]+$/.test(fileExtension)) {
		const match = url.match(/\.(\w+)(\?.*)?$/);
		fileExtension = match ? match[1].toLowerCase() : '';
	}

	const fileFilter = fileExtension
		? [{ name: `${fileExtension.toUpperCase()} Files`, extensions: [fileExtension] }]
		: [{ name: 'All Files', extensions: ['*'] }];

	const { filePath, canceled } = await dialog.showSaveDialog({
		title: 'Save File',
		defaultPath: defaultFileName,
		buttonLabel: 'Save',
		filters: fileFilter
	});

	if (canceled || !filePath) {
		return null;
	}

	try {
		const response = await fetch(url);
		const buffer = await response.arrayBuffer();
		fs.writeFileSync(filePath, Buffer.from(buffer));

		shell.showItemInFolder(filePath);
		return filePath;
	} catch (error) {
		console.error('Error downloading file:', error);
		throw new Error('Failed to download file');
	}
});

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

const handleWindowAction = async (window: BrowserWindow, action: string) => {
	if (!window || window.isDestroyed()) {
		return;
	}

	switch (action) {
		case MINIMIZE_WINDOW:
			window.minimize();
			break;
		case UNMAXIMIZE_WINDOW:
		case MAXIMIZE_WINDOW:
			if (process.platform === 'darwin') {
				const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
				const windowBounds = window.getBounds();
				const isMaximized = windowBounds.width >= display.workArea.width && windowBounds.height >= display.workArea.height;
				if (isMaximized) {
					const newWidth = Math.floor(display.workArea.width * 0.8);
					const newHeight = Math.floor(display.workArea.height * 0.8);
					const x = Math.floor((display.workArea.width - newWidth) / 2);
					const y = Math.floor((display.workArea.height - newHeight) / 2);
					window.setBounds(
						{
							x,
							y,
							width: newWidth,
							height: newHeight
						},
						false
					);
				} else {
					window.setBounds(
						{
							x: display.workArea.x,
							y: display.workArea.y,
							width: display.workArea.width,
							height: display.workArea.height
						},
						false
					);
				}
			} else {
				if (window.isMaximized()) {
					window.restore();
				} else {
					window.maximize();
				}
			}
			break;
		case CLOSE_APP:
			try {
				const updateCheckResult = await autoUpdater.checkForUpdates();
				if (updateCheckResult?.downloadPromise) {
					await updateCheckResult.downloadPromise;
					forceQuit.enable();
					return autoUpdater.quitAndInstall();
				}
			} catch (error) {
				console.error('Update check failed:', error);
			}
			window.close();
			break;
		case CLOSE_IMAGE_WINDOW:
			window.close();
			break;
	}
};

ipcMain.handle(OPEN_NEW_WINDOW, (event, props: any, _options?: Electron.BrowserWindowConstructorOptions, _params?: Record<string, string>) => {
	// const newWindow = App.openImageWindow(props, options, params);
	if (App.imageViewerWindow) {
		updateImagePopup(props, App.imageViewerWindow);
		return;
	}
	const newWindow = openImagePopup(props, App.mainWindow);
	// Remove the existing listener if it exists
	ipcMain.removeAllListeners(IMAGE_WINDOW_TITLE_BAR_ACTION);

	ipcMain.on(IMAGE_WINDOW_TITLE_BAR_ACTION, (event, action, _data) => {
		handleWindowAction(newWindow, action);
	});
});

ipcMain.on(TITLE_BAR_ACTION, (event, action, _data) => {
	handleWindowAction(App.mainWindow, action);
});

ipcMain.handle(ACTION_SHOW_IMAGE, async (event, action, _data) => {
	const win = BrowserWindow.getFocusedWindow();
	const fileURL = action?.payload?.fileURL;
	const actionImage = action?.payload?.action;

	switch (actionImage) {
		case 'copyLink': {
			clipboard.writeText(fileURL);
			break;
		}
		case 'openLink': {
			shell.openExternal(fileURL);
			break;
		}
		case 'saveImage': {
			win.webContents.downloadURL(fileURL);
			break;
		}
	}
});

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
