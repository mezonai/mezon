import { app, Menu, MenuItem, MenuItemConstructorOptions, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import App from './app/app';

const assetsDir = join(__dirname, 'assets', 'desktop-taskbar-256x256.ico');

export class TrayIcon {
	private tray?: Tray;
	private images: Record<string, Electron.NativeImage>;
	private status: string;
	private message: string;
	private isQuitting: boolean;

	constructor() {
		this.status = 'normal';
		this.message = app.name;
		this.images = {};
	}

	init = (isQuitting) => {
		App.application.whenReady().then(() => {
			//const trayIcon = nativeImage.createFromPath(assetsDir);
			this.tray = new Tray(assetsDir);

			const template: (MenuItem | MenuItemConstructorOptions)[] = [
				{
					label: 'Check for updates',
					type: 'normal',
					click: () => autoUpdater.checkForUpdates()
				},
				{
					label: 'Show Mezon',
					type: 'normal',
					click: function () {
						if (App.mainWindow) {
							App.mainWindow.show();
						}
					}
				},
				{
					label: 'Quit Mezon',
					type: 'normal',
					click: function () {
						isQuitting = true;
						App.application.quit();
					}
				}
			];
			const contextMenu = Menu.buildFromTemplate(template);

			this.tray.setContextMenu(contextMenu);
			this.tray.setToolTip('Mezon');
			this.tray.on('click', () => {
				if (App.mainWindow) {
					App.mainWindow.show();
				}
			});
		});
	};

	destroy = () => {
		if (process.platform === 'win32') {
			this.tray?.destroy();
		}
	};
}

const tray = new TrayIcon();
export default tray;
