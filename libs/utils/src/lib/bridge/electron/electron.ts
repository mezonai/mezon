import {
	ACTIVE_WINDOW,
	DOWNLOAD_PROGRESS,
	LOCK_SCREEN,
	SENDER_ID,
	SHOW_NOTIFICATION,
	START_NOTIFICATION_SERVICE,
	TRIGGER_SHORTCUT,
	UNLOCK_SCREEN,
	UPDATE_AVAILABLE,
	UPDATE_ERROR
} from './constants';
import type { NotificationData } from '../../noti/notification';
import type { ElectronBridgeHandler, IElectronBridge, MezonDownloadFile, MezonElectronAPI, MezonNotificationOptions } from './types';

export class ElectronBridge implements IElectronBridge {
	private readonly bridge: MezonElectronAPI = window.electron;

	private static instance: ElectronBridge | undefined = undefined;

	public static getInstance(): ElectronBridge {
		if (!ElectronBridge.instance) {
			ElectronBridge.instance = new ElectronBridge();
		}
		return ElectronBridge.instance;
	}

	private hasListeners = false;
	private handlers?: Record<string, ElectronBridgeHandler>;

	private constructor() {
		// private constructor to prevent instantiation
	}

	public initListeners(handlers: Record<string, ElectronBridgeHandler>) {
		if (this.hasListeners) {
			return;
		}
		this.handlers = handlers;
		this.setupSenderId();
		this.setupShortCut();
		this.setActiveWindow();
		this.setupUpdateAvaiable();
		this.setupDownloadProgress();
		this.setupUpdateError();
		this.setLockScreen();
		this.hasListeners = true;
	}

	public removeAllListeners() {
		this.bridge.removeListener(TRIGGER_SHORTCUT, this.triggerShortcut);
		this.bridge.removeListener(ACTIVE_WINDOW, this.triggerActiveWindow);
		this.bridge.removeListener(UPDATE_AVAILABLE, this.triggerUpdateAvaiable);
		this.bridge.removeListener(DOWNLOAD_PROGRESS, this.triggerDownloadprogress);
		this.bridge.removeListener(UPDATE_ERROR, this.triggerUpdateError);
		this.bridge.removeListener(LOCK_SCREEN, this.triggerLockSceen);
		this.bridge.removeListener(UNLOCK_SCREEN, this.triggerUnlockSceen);
		this.hasListeners = false;
	}

	public setBadgeCount(badgeCount: number | null) {
		this.bridge.setBadgeCount(badgeCount);
	}

	public invoke(channel: string, data?: MezonDownloadFile): Promise<MezonDownloadFile> {
		if (this.bridge.invoke) {
			return this.bridge.invoke(channel, data);
		}
		console.error(`invoke is not supported on this bridge`);
		return Promise.reject(new Error('invoke is not implemented in this bridge'));
	}

	public setActiveWindow() {
		this.bridge.on(ACTIVE_WINDOW, this.listenerHandlers[ACTIVE_WINDOW]);
	}

	public setLockScreen() {
		this.bridge.on(LOCK_SCREEN, this.listenerHandlers[LOCK_SCREEN]);
		this.bridge.on(UNLOCK_SCREEN, this.listenerHandlers[UNLOCK_SCREEN]);
	}

	public pushNotification(title: string, options: MezonNotificationOptions, msg?: NotificationData) {
		if (this.bridge.send) {
			this.bridge.send(SHOW_NOTIFICATION, { title, options, msg });
		}
	}

	private setupSenderId() {
		this.bridge.senderId(SENDER_ID).then((senderId: string) => {
			this.bridge.send(START_NOTIFICATION_SERVICE, senderId);
		});
	}

	private setupShortCut() {
		this.bridge.on(TRIGGER_SHORTCUT, this.listenerHandlers[TRIGGER_SHORTCUT]);
	}

	private triggerShortcut = (_: unknown, name: string) => {
		if (this.handlers?.[TRIGGER_SHORTCUT]) {
			this.handlers?.[TRIGGER_SHORTCUT]();
		}
	};

	private triggerActiveWindow = (_: unknown, name: string) => {
		if (this.handlers?.[ACTIVE_WINDOW]) {
			this.handlers?.[ACTIVE_WINDOW](name);
		}
	};

	private triggerLockSceen = (_: unknown) => {
		if (this.handlers?.[LOCK_SCREEN]) {
			this.handlers?.[LOCK_SCREEN]();
		}
	};

	private triggerUnlockSceen = (_: unknown) => {
		if (this.handlers?.[UNLOCK_SCREEN]) {
			this.handlers?.[UNLOCK_SCREEN]();
		}
	};

	private setupUpdateAvaiable() {
		this.bridge.on(UPDATE_AVAILABLE, this.listenerHandlers[UPDATE_AVAILABLE]);
	}

	private triggerUpdateAvaiable = (_: unknown, name: string) => {
		if (this.handlers?.[UPDATE_AVAILABLE]) {
			this.handlers?.[UPDATE_AVAILABLE]();
		}
	};

	private setupDownloadProgress() {
		this.bridge.on(DOWNLOAD_PROGRESS, this.listenerHandlers[DOWNLOAD_PROGRESS]);
	}

	private triggerDownloadprogress = (_: unknown, response: unknown) => {
		if (this.handlers?.[DOWNLOAD_PROGRESS]) {
			this.handlers?.[DOWNLOAD_PROGRESS](response);
		}
	};

	private setupUpdateError() {
		this.bridge.on(UPDATE_ERROR, this.listenerHandlers[UPDATE_ERROR]);
	}

	private triggerUpdateError = (_: unknown, error: unknown) => {
		if (this.handlers?.[UPDATE_ERROR]) {
			this.handlers?.[UPDATE_ERROR](error);
		}
	};

	private readonly listenerHandlers: Record<string, ElectronBridgeHandler> = {
		[TRIGGER_SHORTCUT]: this.triggerShortcut,
		[ACTIVE_WINDOW]: this.triggerActiveWindow,
		[UPDATE_AVAILABLE]: this.triggerUpdateAvaiable,
		[DOWNLOAD_PROGRESS]: this.triggerDownloadprogress,
		[UPDATE_ERROR]: this.triggerUpdateError,
		[LOCK_SCREEN]: this.triggerLockSceen,
		[UNLOCK_SCREEN]: this.triggerUnlockSceen
	};
}

export const electronBridge = ElectronBridge.getInstance();
