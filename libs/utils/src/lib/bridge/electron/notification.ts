import isElectron from 'is-electron';
import { safeJSONParse } from 'mezon-js';
import { MessageCrypt } from '../../e2ee';
import { electronBridge } from './electron';
export interface IMessageExtras {
	link: string; // link for navigating
	e2eemess: string;
	topicId: string;
}

export interface NotificationData {
	id: number;
	appid: number;
	channel_id: string;
	message: string;
	title: string;
	priority: number;
	date: string;
	image: string;
	extras?: IMessageExtras;
}

export enum NotificationPermissionStatus {
	DEFAULT = 'default',
	DENIED = 'denied',
	GRANTED = 'granted'
}

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_RECONNECT_INTERVAL = 1000; // 1s
const DEFAULT_MAX_RECONNECT_INTERVAL = 32000; // 32s (after 5 reconnect attempts)
const PING_TIMEOUT = 60000; // 60 seconds

export class MezonNotificationService {
	private wsActive = false;
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS;
	private reconnectInterval = DEFAULT_RECONNECT_INTERVAL;
	private maxReconnectInterval = DEFAULT_MAX_RECONNECT_INTERVAL;

	public static instance: MezonNotificationService;
	private currentChannelId: string | undefined;
	private pingTimeout: NodeJS.Timeout | null = null;
	private isFocusOnApp = false;
	private previousAppId = 0;
	private currentUserId: string | null = null;

	private constructor() {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		if (isElectron()) {
			window.electron.onWindowFocused(() => {
				this.isFocusOnApp = true;
			});
			window.electron.onWindowBlurred(() => {
				this.isFocusOnApp = false;
			});
		} else {
			window.onfocus = () => {
				this.isFocusOnApp = true;
			};
			window.onblur = () => {
				this.isFocusOnApp = false;
			};
		}
	}

	public static getInstance() {
		if (!MezonNotificationService.instance) {
			MezonNotificationService.instance = new MezonNotificationService();
		}
		return MezonNotificationService.instance;
	}
	public setCurrentUserId = async (userId: string) => {
		this.currentUserId = userId;
	};

	public connect = async (token: string) => {
		const hasPermission = await this.checkNotificationPermission();

		if (!hasPermission) {
			return;
		}

		if (!token || this.wsActive) {
			return;
		}

		this.close();

		const wsUrl = process.env.NX_CHAT_APP_NOTIFICATION_WS_URL;
		const ws = new WebSocket(`${wsUrl}/stream?token=${token}`);

		ws.onopen = (_event) => {
			this.wsActive = true;
			this.restReconnectParam();
			this.startPingMonitoring(token);
		};

		ws.onmessage = async (data: MessageEvent<string>) => {
			try {
				const objMsg = safeJSONParse(data.data);
				if (objMsg === 'ping') {
					this.handlePong();
					this.startPingMonitoring(token);
				} else {
					const msg = objMsg as NotificationData;
					const { title, message, image } = msg ?? {};

					const { link, e2eemess } = msg?.extras ?? {};
					if (msg?.channel_id && msg?.channel_id === this.currentChannelId && this.isFocusOnApp) {
						return;
					}
					let msgContent = message;
					if (e2eemess === 'true') {
						msgContent = await MessageCrypt.mapE2EEcontent(message, this.currentUserId as string, true);
					}

					this.pushNotification(title, msgContent, image, link, msg);
					if (isElectron() && msg?.appid && msg.appid !== this.previousAppId) {
						this.previousAppId = msg.appid;
						electronBridge.invoke('APP::CHECK_UPDATE');
					}
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.log(err);
			}
		};

		ws.onerror = (e) => {
			this.wsActive = false;
			this.reconnect(token);
		};

		ws.onclose = () => {
			this.wsActive = false;
		};

		this.ws = ws;
	};

	private async checkNotificationPermission() {
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notification');
			return;
		}

		switch (Notification.permission) {
			case NotificationPermissionStatus.GRANTED:
				return true;
			case NotificationPermissionStatus.DENIED:
				return false;
			case NotificationPermissionStatus.DEFAULT: {
				const permission = await Notification.requestPermission();
				return permission === NotificationPermissionStatus.GRANTED;
			}
			default:
				return false;
		}
	}

	private pushNotification(title: string, message: string, image: string, link: string | undefined, msg?: NotificationData) {
		if (isElectron()) {
			electronBridge.pushNotification(
				title,
				{
					body: message,
					icon: image ?? '',
					data: {
						link: link ?? ''
					}
				},
				msg
			);
		} else {
			this.pushNotificationForWeb(title, message, image, link);
		}
	}

	private pushNotificationForWeb(title: string, message: string, image: string, link: string | undefined) {
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notification');
			return;
		}
		const notification = new Notification(title, {
			body: message,
			icon: image ?? '',
			data: {
				link: link ?? ''
			}
		});
		notification.onclick = (event) => {
			event.preventDefault();
			if (!link) {
				return;
			}
			const existingWindow = window.open('', '_self');
			if (existingWindow) {
				existingWindow.focus();
				window.location.href = link;
			}
		};
	}

	public get isActive() {
		return this.wsActive;
	}

	public close = () => {
		this.ws?.close(1000, 'WebSocketStore#close');
	};

	public setCurrentChannelId = (channelId: string) => {
		this.currentChannelId = channelId;
	};

	private reconnect = (token: string) => {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			setTimeout(() => {
				this.reconnectAttempts++;
				this.connect(token);
			}, this.reconnectInterval);

			// Exponentially increase the interval for the next reconnection attempt
			if (this.reconnectInterval < this.maxReconnectInterval) {
				this.reconnectInterval = this.reconnectInterval * 2;
			}
		}
	};

	private restReconnectParam = () => {
		this.reconnectAttempts = 0;
		this.reconnectInterval = DEFAULT_RECONNECT_INTERVAL;
	};

	public startPingMonitoring = (token: string) => {
		this.pingTimeout && clearTimeout(this.pingTimeout);
		this.pingTimeout = setTimeout(() => {
			this.wsActive = false;
			this.reconnect(token);
		}, PING_TIMEOUT);
	};

	private handlePong = () => {
		this.ws?.send('pong');
	};
}

export const notificationService = MezonNotificationService.getInstance();
