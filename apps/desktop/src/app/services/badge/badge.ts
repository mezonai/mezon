import { ipcMain, IpcMainEvent, nativeImage } from 'electron';
import { SET_BADGE_COUNT } from '../../events/constants';
import { BADGE_DESCRIPTION } from './constants';
import { BadgeIconGenerator } from './icon';
import { IBadge } from './types';
/**
 * Badge class for mac and linux
 */
export class Badge implements IBadge {
	private app: Electron.App;

	constructor(app: Electron.App) {
		this.app = app;
		this.initListeners();
	}

	public setBadgeCount(badgeNumber: number): boolean {
		return this.app.setBadgeCount(badgeNumber);
	}

	public initListeners(): void {
		ipcMain.on(SET_BADGE_COUNT, this.onBadgeCountUpdate);
	}

	public removeAllListeners(): void {
		ipcMain.removeListener(SET_BADGE_COUNT, this.onBadgeCountUpdate);
	}

	private onBadgeCountUpdate = (event: IpcMainEvent, badgeNumber: number) => {
		this.setBadgeCount(badgeNumber);
		event.returnValue = 'success';
	};
}

/**
 * Badge class for windows
 */
export class WindowBadge implements IBadge {
	private mainWindow: Electron.BrowserWindow;
	private generator: BadgeIconGenerator;
	private currentOverlayIcon: { image: Electron.NativeImage; badgeDescription: string } = { image: null, badgeDescription: BADGE_DESCRIPTION };

	constructor(win: Electron.BrowserWindow) {
		this.mainWindow = win;
		this.generator = new BadgeIconGenerator(win);
		this.initListeners();
	}

	public initListeners() {
		ipcMain.on(SET_BADGE_COUNT, this.onBadgeCountUpdate);
		this.mainWindow.on('closed', this.onWindowClosed);
		this.mainWindow.on('show', this.onWindowShow);
	}

	public removeAllListeners() {
		ipcMain.removeListener(SET_BADGE_COUNT, this.onBadgeCountUpdate);
		this.mainWindow.removeListener('closed', this.onWindowClosed);
		this.mainWindow.removeListener('show', this.onWindowShow);
	}

	public setBadgeCount(badgeNumber: number) {
		// eslint-disable-next-line no-console
		console.log('badgeNumber: ', badgeNumber, typeof badgeNumber);
		if (badgeNumber || badgeNumber === null) {
			this.generator.generate(badgeNumber).then((base64) => {
				// eslint-disable-next-line no-console
				console.log('this.currentOverlayIcon.badgeDescription: 1', this.currentOverlayIcon.badgeDescription);
				const image = nativeImage.createFromDataURL(base64);
				this.currentOverlayIcon.image = image;
				this.mainWindow.setOverlayIcon(this.currentOverlayIcon.image, this.currentOverlayIcon.badgeDescription);
			});
		} else {
			// eslint-disable-next-line no-console
			console.log('this.currentOverlayIcon.badgeDescription: 2', this.currentOverlayIcon.badgeDescription);
			this.currentOverlayIcon.image = null;
			this.mainWindow.setOverlayIcon(this.currentOverlayIcon.image, this.currentOverlayIcon.badgeDescription);
		}
	}

	private onBadgeCountUpdate = (event: IpcMainEvent, badgeNumber: number) => {
		if (this.mainWindow) {
			this.setBadgeCount(badgeNumber);
		}
		event.returnValue = 'success';
	};

	private onWindowClosed = () => {
		this.mainWindow = null;
	};

	private onWindowShow = () => {
		this.mainWindow.setOverlayIcon(this.currentOverlayIcon.image, this.currentOverlayIcon.badgeDescription);
	};
}

/**
 * get badge instance based on platform
 * @param app
 * @param mainWindow
 * @param opts use for window only
 * @returns badge instance
 */
export const initBadge = (app: Electron.App, mainWindow: Electron.BrowserWindow): IBadge | null => {
	const platform = process.platform;
	switch (platform) {
		case 'win32':
			return new WindowBadge(mainWindow);
		case 'darwin':
		case 'linux':
			return new Badge(app);
		default:
			return null;
	}
};
