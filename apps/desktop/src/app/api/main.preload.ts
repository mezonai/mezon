import { contextBridge, ipcRenderer } from 'electron';
import {
	ACTION_SHOW_IMAGE,
	GET_APP_VERSION,
	GET_DEVICE_ID,
	OPEN_MEET_POPOUT,
	OPEN_NEW_WINDOW,
	REQUEST_PERMISSION_SCREEN,
	SENDER_ID,
	SET_BADGE_COUNT
} from '../events/constants';

contextBridge.exposeInMainWorld('electron', {
	platform: process.platform,
	getAppVersion: () => ipcRenderer.invoke(GET_APP_VERSION),
	on(eventName: string, callback: (...args: any[]) => void) {
		ipcRenderer.on(eventName, callback);
	},
	send(eventName: string, ...params: any[]) {
		return ipcRenderer.send(eventName, ...params);
	},
	removeListener(channel: string, listener: () => void) {
		return ipcRenderer.removeListener(channel, listener);
	},
	getDeviceId: () => ipcRenderer.invoke(GET_DEVICE_ID),
	senderId: (senderId: string) => ipcRenderer.invoke(SENDER_ID, senderId),
	setBadgeCount: (badgeCount: number) => {
		ipcRenderer.send(SET_BADGE_COUNT, badgeCount);
	},
	onWindowBlurred: (callback: () => void) => {
		ipcRenderer.on('window-blurred', callback);
	},
	onWindowFocused: (callback: () => void) => {
		ipcRenderer.on('window-focused', callback);
	},
	invoke: (channel, data) => ipcRenderer.invoke(channel, data),

	openImageWindow: (props: any, options?: Electron.BrowserWindowConstructorOptions, params?: Record<string, string>) => {
		return ipcRenderer.invoke(OPEN_NEW_WINDOW, props, options, params);
	},

	openMeetPopout: (url: string) => {
		return ipcRenderer.invoke(OPEN_MEET_POPOUT, url);
	},

	handleActionShowImage: (action: string, url: any) => {
		return ipcRenderer.invoke(ACTION_SHOW_IMAGE, { payload: { action, fileURL: url } });
	},
	getScreenSources: (source: string) => ipcRenderer.invoke(REQUEST_PERMISSION_SCREEN, source)
});
