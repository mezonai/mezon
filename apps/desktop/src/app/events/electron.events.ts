/**
 * This module is responsible on handling all the inter process communications
 * between the frontend to the electron backend.
 */

import { Notification, app, ipcMain } from 'electron';
import { environment } from '../../environments/environment';
import App from '../app';
import { GET_APP_VERSION, NOTIFICATION_CLICKED, SHOW_NOTIFICATION } from './constants';

export default class ElectronEvents {
	private static activeNotifications = new Map<string, Notification>();

	static bootstrapElectronEvents(): Electron.IpcMain {
		ipcMain.on(SHOW_NOTIFICATION, (_, { title, options, msg }) => {
			try {
				const channelId = options.data?.channelId;

				if (channelId && this.activeNotifications.has(channelId)) {
					this.activeNotifications.get(channelId)?.close();
					this.activeNotifications.delete(channelId);
				}

				const notification = new Notification({
					title,
					body: options.body,
					icon: options.icon,
					silent: options.silent || false,
					urgency: process.platform === 'linux' ? 'normal' : undefined
				});

				if (channelId) {
					this.activeNotifications.set(channelId, notification);
				}

				notification.on('click', () => {
					if (App.mainWindow && !App.mainWindow.isDestroyed()) {
						if (App.mainWindow.isMinimized()) {
							App.mainWindow.restore();
						}
						App.mainWindow.focus();
						if (options.data?.link) {
							App.mainWindow.webContents.send(NOTIFICATION_CLICKED, {
								link: options.data.link,
								channelId: options.data.channelId,
								msg
							});
						}
					}
				});

				notification.on('close', () => {
					if (channelId) {
						this.activeNotifications.delete(channelId);
					}
				});

				notification.show();
			} catch (error) {
				console.error('Error showing notification:', error);
			}
		});

		return ipcMain;
	}
}

ipcMain.handle(GET_APP_VERSION, (event) => {
	return environment.version;
});

ipcMain.on('quit', (event, code) => {
	app.exit(code);
});
