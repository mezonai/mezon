import isElectron from 'is-electron';
import { electronBridge } from './electron';

export interface IMessageExtras {
	link: string; // link for navigating
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

	private constructor() {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		if (isElectron()) {
			window.electron.onWindowFocused(() => {
				this.isFocusOnApp = true;
			});
			window.electron.onWindowBlurred(() => {
				this.isFocusOnApp = false;
			});
		}
	}

	public static getInstance() {
		if (!MezonNotificationService.instance) {
			MezonNotificationService.instance = new MezonNotificationService();
		}
		return MezonNotificationService.instance;
	}

	public connect = (token: string) => {
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

		ws.onmessage = (data: MessageEvent<string>) => {
			try {
				if (data.data === 'ping') {
					this.handlePong();
					this.startPingMonitoring(token);
				} else {
					const msg = JSON.parse(data.data) as NotificationData;
					const { title, message, image } = msg ?? {};
					const { link } = msg?.extras ?? {};
					if (msg?.channel_id && msg?.channel_id === this.currentChannelId && this.isFocusOnApp) {
						return;
					}
					electronBridge.pushNotification(title, {
						body: message,
						icon: image ?? '',
						data: {
							link: link ?? ''
						}
					});
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
