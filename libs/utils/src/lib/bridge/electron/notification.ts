import isElectron from 'is-electron';
import { safeJSONParse } from 'mezon-js';
import { MessageCrypt } from '../../e2ee';
import { isBackgroundModeActive } from '../../hooks/useBackgroundMode';
import { EUserStatus } from '../../types';
import { electronBridge } from './electron';
import type { MezonNotificationOptions } from './types';

export const SHOW_NOTIFICATION = 'APP::SHOW_NOTIFICATION';

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
	sender_id?: string;
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

interface UserNotificationConnection {
	userId: string;
	ws: WebSocket | null;
	wsActive: boolean;
	reconnectAttempts: number;
	reconnectInterval: number;
	currentChannelId: string | undefined;
	pingTimeout: NodeJS.Timeout | null;
	previousAppId: number;
	activeNotifications: Map<string, Notification>;
	token: string;
	userStatus?: string;
}

export class MezonNotificationService {
	private maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS;
	private maxReconnectInterval = DEFAULT_MAX_RECONNECT_INTERVAL;

	// Track connections per user ID
	private userConnections: Map<string, UserNotificationConnection> = new Map();

	// Current active user for primary operations
	private currentActiveUserId: string | null = null;

	private userStatuses: Map<string, string> = new Map();

	public static instance: MezonNotificationService;

	public static getInstance() {
		if (!MezonNotificationService.instance) {
			MezonNotificationService.instance = new MezonNotificationService();
		}
		return MezonNotificationService.instance;
	}

	public setCurrentActiveUserId = (userId: string) => {
		this.currentActiveUserId = userId;
	};

	public getCurrentActiveUserId = (): string | null => {
		return this.currentActiveUserId;
	};

	public setUserStatus = (userId: string, status: string) => {
		this.userStatuses.set(userId, status);
		const connection = this.userConnections.get(userId);
		if (connection) {
			connection.userStatus = status;
		}
	};

	public getUserStatus = (userId: string): string | undefined => {
		return this.userStatuses.get(userId);
	};

	private isUserInDNDMode = (userId: string): boolean => {
		const status = this.getUserStatus(userId);
		return status === EUserStatus.DO_NOT_DISTURB;
	};

	public connect = async (token: string, userId: string) => {
		const hasPermission = await this.checkNotificationPermission();

		if (!hasPermission) {
			return;
		}

		if (!token || !userId) {
			return;
		}

		// Check if user already has an active connection
		const existingConnection = this.userConnections.get(userId);
		if (existingConnection && existingConnection.wsActive) {
			return;
		}

		// Close existing connection if it exists but not active
		if (existingConnection) {
			this.closeUserConnection(userId);
		}

		const wsUrl = process.env.NX_CHAT_APP_NOTIFICATION_WS_URL;
		const ws = new WebSocket(`${wsUrl}/stream?token=${token}`);

		// Create new connection object
		const connection: UserNotificationConnection = {
			userId,
			ws,
			wsActive: false,
			reconnectAttempts: 0,
			reconnectInterval: DEFAULT_RECONNECT_INTERVAL,
			currentChannelId: undefined,
			pingTimeout: null,
			previousAppId: 0,
			activeNotifications: new Map(),
			token
		};

		ws.onopen = (_event) => {
			connection.wsActive = true;
			this.restReconnectParam(connection);
			this.startPingMonitoring(connection);
		};

		ws.onmessage = async (data: MessageEvent<string>) => {
			try {
				const objMsg = safeJSONParse(data.data);
				if (objMsg === 'ping') {
					this.handlePong(connection);
					this.startPingMonitoring(connection);
				} else {
					if (this.isUserInDNDMode(userId)) {
						return;
					}

					const isFocus = !isBackgroundModeActive();
					const msg = objMsg as NotificationData;
					const { title, message, image } = msg ?? {};

					const { link, e2eemess } = msg?.extras ?? {};

					if (
						(msg?.channel_id && msg?.channel_id === connection.currentChannelId && isFocus) ||
						msg?.sender_id === this.currentActiveUserId
					) {
						return;
					}
					let msgContent = message;
					if (e2eemess === 'true') {
						msgContent = await MessageCrypt.mapE2EEcontent(message, userId, true);
					}
					this.pushNotification(title, msgContent, image, link, msg, connection);
					if (isElectron() && msg?.appid && msg.appid !== connection.previousAppId) {
						connection.previousAppId = msg.appid;
						electronBridge.invoke('APP::CHECK_UPDATE');
					}
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.log(err);
			}
		};

		ws.onerror = () => {
			connection.wsActive = false;
			this.reconnect(connection);
		};

		ws.onclose = () => {
			connection.wsActive = false;
		};

		// Store the connection
		this.userConnections.set(userId, connection);
	};

	public disconnect = (userId: string) => {
		this.closeUserConnection(userId);
		this.userConnections.delete(userId);
	};

	public disconnectAll = () => {
		for (const [userId] of this.userConnections) {
			this.closeUserConnection(userId);
		}
		this.userConnections.clear();
		this.currentActiveUserId = null;
	};

	public getActiveConnections = (): string[] => {
		const activeUsers: string[] = [];
		for (const [userId, connection] of this.userConnections) {
			if (connection.wsActive) {
				activeUsers.push(userId);
			}
		}
		return activeUsers;
	};

	public isUserConnected = (userId: string): boolean => {
		const connection = this.userConnections.get(userId);
		return connection?.wsActive || false;
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

	public pushNotification(
		title: string,
		message: string,
		image: string,
		link: string | undefined,
		msg?: NotificationData,
		connection?: UserNotificationConnection
	) {
		if (connection?.userId && this.isUserInDNDMode(connection.userId)) {
			return;
		}

		const hideContent = localStorage.getItem('hideNotificationContent') === 'true';
		const notificationBody = hideContent ? '' : message;

		if (isElectron()) {
			const options: MezonNotificationOptions = {
				body: notificationBody,
				icon: image ?? '',
				data: {
					link: link ?? '',
					channelId: msg?.channel_id
				},
				tag: msg?.channel_id
			};

			electronBridge.pushNotification(title, options, msg);
			return;
		}

		// Web notification handling
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notification');
			return;
		}

		const channelId = msg?.channel_id;
		const activeNotifications = connection?.activeNotifications || new Map();

		if (channelId && activeNotifications.has(channelId)) {
			const previousNotification = activeNotifications.get(channelId);
			previousNotification?.close();
		}

		const notification = new Notification(title, {
			body: notificationBody,
			icon: image ?? '',
			data: {
				link: link ?? '',
				userId: connection?.userId
			},
			tag: channelId
		});

		if (channelId && connection) {
			connection.activeNotifications.set(channelId, notification);
		}

		notification.onclick = (event) => {
			event.preventDefault();
			if (!link) {
				return;
			}

			const existingWindow = window.open('', '_self');

			if (existingWindow) {
				try {
					existingWindow.focus();
					const notificationUrl = new URL(link);
					const path = notificationUrl.pathname;
					const fromTopic = msg?.extras?.topicId && msg?.extras?.topicId !== '0';

					// Switch to the user who received the notification if needed
					if (connection?.userId && this.currentActiveUserId !== connection.userId) {
						this.setCurrentActiveUserId(connection.userId);
					}

					window.dispatchEvent(
						new CustomEvent('mezon:navigate', {
							detail: { url: path, msg: fromTopic ? msg : null, userId: connection?.userId }
						})
					);
				} catch (error) {
					console.error('Error navigating to link:', error);
				}
			} else {
				window.location.href = link;
			}
		};
	}

	public get isActive() {
		// Return true if any connection is active
		for (const [, connection] of this.userConnections) {
			if (connection.wsActive) {
				return true;
			}
		}
		return false;
	}

	public isActiveForUser = (userId: string): boolean => {
		const connection = this.userConnections.get(userId);
		return connection?.wsActive || false;
	};

	private closeUserConnection = (userId: string) => {
		const connection = this.userConnections.get(userId);
		if (!connection) return;

		connection.ws?.close(1000, 'WebSocketStore#close');
		if (connection.pingTimeout) {
			clearTimeout(connection.pingTimeout);
			connection.pingTimeout = null;
		}

		// Close all active notifications for this user
		connection.activeNotifications.forEach((notification) => notification.close());
		connection.activeNotifications.clear();
	};

	public setCurrentChannelId = (channelId: string, userId?: string) => {
		const targetUserId = userId || this.currentActiveUserId;
		if (!targetUserId) return;

		const connection = this.userConnections.get(targetUserId);
		if (connection) {
			connection.currentChannelId = channelId;
		}
	};

	private reconnect = (connection: UserNotificationConnection) => {
		if (connection.reconnectAttempts < this.maxReconnectAttempts) {
			setTimeout(() => {
				connection.reconnectAttempts++;
				this.connect(connection.token, connection.userId);
			}, connection.reconnectInterval);

			// Exponentially increase the interval for the next reconnection attempt
			if (connection.reconnectInterval < this.maxReconnectInterval) {
				connection.reconnectInterval = connection.reconnectInterval * 2;
			}
		}
	};

	private restReconnectParam = (connection: UserNotificationConnection) => {
		connection.reconnectAttempts = 0;
		connection.reconnectInterval = DEFAULT_RECONNECT_INTERVAL;
	};

	public startPingMonitoring = (connection: UserNotificationConnection) => {
		if (connection.pingTimeout) {
			clearTimeout(connection.pingTimeout);
		}
		connection.pingTimeout = setTimeout(() => {
			connection.wsActive = false;
			this.reconnect(connection);
		}, PING_TIMEOUT);
	};

	private handlePong = (connection: UserNotificationConnection) => {
		connection.ws?.send('pong');
	};
}

export const notificationService = MezonNotificationService.getInstance();
