import type { MenuItem, MenuItemConstructorOptions } from 'electron';
import { Menu, Notification, Tray, app, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import App from './app/app';

const assetsDir = join(__dirname, 'assets', 'desktop-taskbar.ico');
const assetsDirLinux = join(__dirname, 'assets', 'trayicon-linux.png');

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
			if (process.platform == 'linux') {
				this.tray = new Tray(assetsDirLinux);
			} else {
				this.tray = new Tray(assetsDir);
			}
			const template: (MenuItem | MenuItemConstructorOptions)[] = [
				{
					label: 'Check for updates',
					type: 'normal',
					click: () => {
						if (process.platform === 'win32') {
							shell.openExternal('ms-windows-store://pdp/?ProductId=9pf25lf1fj17');
							return;
						}
						if (process.platform === 'darwin') {
							//shell.openExternal('macappstore://itunes.apple.com/mezon.desktop');
							//return;
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
				{
					label: 'Show Mezon',
					type: 'normal',
					click() {
						if (App.mainWindow) {
							App.mainWindow.show();
						}
					}
				},
				{
					label: 'Quit Mezon',
					type: 'normal',
					click() {
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
