import { contextBridge, ipcRenderer } from 'electron';
import {
	ACTION_SHOW_IMAGE,
	AUTO_START_APP,
	CLEAR_SCREEN_SOURCES_CACHE,
	GET_APP_VERSION,
	GET_DEVICE_ID,
	GET_REDUX_STATE,
	LAUNCH_APP_WINDOW,
	LOAD_MORE_SCREEN_SOURCES,
	NOTIFICATION_CLICKED,
	OPEN_NEW_WINDOW,
	REQUEST_PERMISSION_SCREEN,
	SENDER_ID,
	SET_BADGE_COUNT,
	SET_RATIO_WINDOW,
	SYNC_REDUX_STATE,
	TOGGLE_HARDWARE_ACCELERATION
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
	onNotificationClick: (callback: (data: any) => void) => {
		ipcRenderer.on(NOTIFICATION_CLICKED, (_, data) => callback(data));
	},
	invoke: (channel, data) => ipcRenderer.invoke(channel, data),

	openImageWindow: (props: any, options?: Electron.BrowserWindowConstructorOptions, params?: Record<string, string>) => {
		return ipcRenderer.invoke(OPEN_NEW_WINDOW, props, options, params);
	},

	handleActionShowImage: (action: string, url: any) => {
		return ipcRenderer.invoke(ACTION_SHOW_IMAGE, { payload: { action, fileURL: url } });
	},
	getScreenSources: (source: string) => ipcRenderer.invoke(REQUEST_PERMISSION_SCREEN, source),
	loadMoreScreenSources: (source: string, offset: number) => ipcRenderer.invoke(LOAD_MORE_SCREEN_SOURCES, source, offset),
	clearScreenSourcesCache: (source?: string) => ipcRenderer.invoke(CLEAR_SCREEN_SOURCES_CACHE, source),
	setRatioWindow: (ratio: boolean) => ipcRenderer.invoke(SET_RATIO_WINDOW, ratio),
	launchAppWindow: (props: string) => {
		return ipcRenderer.invoke(LAUNCH_APP_WINDOW, props);
	},
	toggleSettingAutoStart: (auto: boolean) => {
		return ipcRenderer.invoke(AUTO_START_APP, auto);
	},
	toggleHardwareAcceleration: (enabled: boolean) => {
		return ipcRenderer.invoke(TOGGLE_HARDWARE_ACCELERATION, enabled);
	},
	syncReduxState: (state: { autoStart?: boolean; hardwareAcceleration?: boolean }) => {
		return ipcRenderer.invoke(SYNC_REDUX_STATE, state);
	},
	getReduxState: () => {
		return ipcRenderer.invoke(GET_REDUX_STATE);
	}
});
