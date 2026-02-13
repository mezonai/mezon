import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { IImageWindowProps } from '../../types';

export type ElectronBridgeHandler = (...args: any[]) => void;
export type MezonElectronAPI = {
	invoke?: (channel: string, data?: MezonDownloadFile) => Promise<MezonDownloadFile>;
	platform: NodeJS.Platform;
	getAppVersion: () => Promise<string>;
	on: (eventName: string, callback: ElectronBridgeHandler) => void;
	send: (eventName: string, ...params: any[]) => void;
	removeListener: (channel: string, listener: ElectronBridgeHandler) => void;
	getDeviceId: () => Promise<string>;
	senderId: (senderId: string) => Promise<string>;
	setBadgeCount: (badgeCount: number | null) => void;
	onWindowBlurred: (callback: () => void) => void;
	onWindowFocused: (callback: () => void) => void;
	openImageWindow: (
		currentImage: ApiMessageAttachment & {
			create_time?: string;
			uploaderData: { name: string; avatar: string };
			realUrl: string;
			channelImagesData: IImageWindowProps;
			isVideo?: boolean;
		}
	) => Promise<void>;
	dowloadImage: (url: string) => Promise<void>;
	getScreenSources: (
		source: string
	) => Promise<{ sources: { id: string; name: string; thumbnail: string; icon: string }[]; total: number; hasMore: boolean }>;
	loadMoreScreenSources: (
		source: string,
		offset: number
	) => Promise<{ sources: { id: string; name: string; thumbnail: string; icon: string }[]; hasMore: boolean }>;
	clearScreenSourcesCache: (source?: string) => Promise<{ success: boolean }>;
	setRatioWindow: (ratio: boolean) => void;
	launchAppWindow: (url: string) => Promise<void>;
	toggleSettingAutoStart: (auto: boolean) => Promise<void>;
	toggleHardwareAcceleration: (enabled: boolean) => Promise<void>;
};
declare global {
	interface Window {
		electron: MezonElectronAPI;
	}
}

export interface IElectronBridge {
	initListeners: (handlers: Record<string, ElectronBridgeHandler>) => void;
	removeAllListeners: () => void;
	setBadgeCount: (badgeCount: number | null) => void;
	invoke: (channel: string, data?: MezonDownloadFile) => Promise<MezonDownloadFile>;
	pushNotification: (title: string, options: MezonNotificationOptions, msg?: any) => void;
}

export interface MezonNotificationOptions extends NotificationOptions {
	data: {
		link: string;
		channelId?: string;
	};
	tag?: string;
}

export interface MezonDownloadFile {
	url: string;
	defaultFileName: string;
}

export interface CloseChannelAppPayload {
	appId: string;
	appClanId: string;
	appChannelId: string;
}
