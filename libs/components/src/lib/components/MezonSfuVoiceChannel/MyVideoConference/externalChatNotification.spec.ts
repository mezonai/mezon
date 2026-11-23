import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { isPageInBackground, notifyExternalChatMessage, requestExternalChatNotificationPermission } from './externalChatNotification';

jest.mock(
	'@mezon/utils',
	() => ({
		createImgproxyUrl: (url: string) => `imgproxy:${url}`
	}),
	{ virtual: true }
);

jest.mock('mezon-js', () => ({
	safeJSONParse: (raw: string) => {
		if (!raw || raw === '[]') {
			return { t: raw };
		}
		try {
			return JSON.parse(raw);
		} catch {
			return { t: raw };
		}
	}
}));

class MockNotification {
	static permission: NotificationPermission = 'granted';
	static requestPermission = jest.fn(async (): Promise<NotificationPermission> => 'granted');
	static instances: MockNotification[] = [];

	title: string;
	options?: NotificationOptions;
	onclick: ((ev: Event) => void) | null = null;
	close = jest.fn();

	constructor(title: string, options?: NotificationOptions) {
		this.title = title;
		this.options = options;
		MockNotification.instances.push(this);
	}
}

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalNotificationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Notification');

function restoreGlobalProperty(key: string, descriptor: PropertyDescriptor | undefined) {
	if (descriptor) {
		Object.defineProperty(globalThis, key, descriptor);
	} else {
		Reflect.deleteProperty(globalThis, key);
	}
}

describe('externalChatNotification', () => {
	let visibilityState: DocumentVisibilityState;
	let focused: boolean;
	let storageValues: Record<string, string>;
	let windowFocusMock: jest.Mock;

	beforeEach(() => {
		visibilityState = 'hidden';
		focused = false;
		storageValues = {};
		windowFocusMock = jest.fn();
		MockNotification.permission = 'granted';
		MockNotification.requestPermission = jest.fn(async (): Promise<NotificationPermission> => 'granted');
		MockNotification.instances = [];

		Object.defineProperty(globalThis, 'Notification', {
			configurable: true,
			value: MockNotification
		});
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: {
				Notification: MockNotification,
				focus: windowFocusMock
			}
		});
		Object.defineProperty(globalThis, 'document', {
			configurable: true,
			value: {
				get visibilityState() {
					return visibilityState;
				},
				hasFocus: () => focused
			}
		});
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			value: {
				getItem: (key: string) => (key in storageValues ? storageValues[key] : null)
			}
		});
	});

	afterEach(() => {
		restoreGlobalProperty('window', originalWindowDescriptor);
		restoreGlobalProperty('document', originalDocumentDescriptor);
		restoreGlobalProperty('localStorage', originalLocalStorageDescriptor);
		restoreGlobalProperty('Notification', originalNotificationDescriptor);
	});

	it('detects foreground vs background state via isPageInBackground', () => {
		expect(isPageInBackground({ visibilityState: 'visible', hasFocus: () => true })).toBe(false);
		expect(isPageInBackground({ visibilityState: 'hidden', hasFocus: () => true })).toBe(true);
		expect(isPageInBackground({ visibilityState: 'visible', hasFocus: () => false })).toBe(true);
	});

	it('returns null without creating a Notification when visible and focused', () => {
		visibilityState = 'visible';
		focused = true;

		const result = notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'hello' }), 'external-meeting-chat-room1');

		expect(result).toBeNull();
		expect(MockNotification.instances).toHaveLength(0);
	});

	it('creates a Notification with title, body, tag, and proxied icon when visibilityState is hidden', () => {
		visibilityState = 'hidden';
		focused = true;

		const result = notifyExternalChatMessage(
			JSON.stringify({ name: 'Alice', content: 'hello world', avatar: 'https://cdn/a.png' }),
			'external-meeting-chat-room1'
		);

		expect(result).toBeInstanceOf(MockNotification);
		expect(MockNotification.instances).toHaveLength(1);
		expect(MockNotification.instances[0].title).toBe('Alice · Meeting Room');
		expect(MockNotification.instances[0].options).toEqual({
			body: 'hello world',
			tag: 'external-meeting-chat-room1',
			icon: 'imgproxy:https://cdn/a.png'
		});
	});

	it('falls back to Guest title and omits icon when sender name and avatar are empty', () => {
		visibilityState = 'hidden';

		notifyExternalChatMessage(JSON.stringify({ name: '  ', content: 'hi there', avatar: '' }), 'external-meeting-chat-room1');

		expect(MockNotification.instances).toHaveLength(1);
		expect(MockNotification.instances[0].title).toBe('Guest · Meeting Room');
		expect(MockNotification.instances[0].options).toEqual({
			body: 'hi there',
			tag: 'external-meeting-chat-room1'
		});
	});

	it('creates a Notification when visible but document hasFocus returns false', () => {
		visibilityState = 'visible';
		focused = false;

		const result = notifyExternalChatMessage(JSON.stringify({ name: 'Bob', content: 'ping' }), 'external-meeting-chat-room2');

		expect(result).toBeInstanceOf(MockNotification);
		expect(MockNotification.instances).toHaveLength(1);
		expect(MockNotification.instances[0].title).toBe('Bob · Meeting Room');
		expect(MockNotification.instances[0].options).toEqual({
			body: 'ping',
			tag: 'external-meeting-chat-room2'
		});
	});

	it('returns null when content is empty, whitespace, missing, or malformed', () => {
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: '' }), 'tag')).toBeNull();
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: '   ' }), 'tag')).toBeNull();
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice' }), 'tag')).toBeNull();
		expect(notifyExternalChatMessage('{invalid', 'tag')).toBeNull();
		expect(MockNotification.instances).toHaveLength(0);
	});

	it('returns null when Notification permission is denied or Notification is missing', () => {
		MockNotification.permission = 'denied';
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'hello' }), 'tag')).toBeNull();

		MockNotification.permission = 'default';
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'hello' }), 'tag')).toBeNull();

		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: { focus: windowFocusMock }
		});
		expect(notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'hello' }), 'tag')).toBeNull();
		expect(MockNotification.instances).toHaveLength(0);
	});

	it('uses an empty body when hideNotificationContent is true in localStorage', () => {
		storageValues.hideNotificationContent = 'true';

		notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'secret message' }), 'external-meeting-chat-room1');

		expect(MockNotification.instances).toHaveLength(1);
		expect(MockNotification.instances[0].title).toBe('Alice · Meeting Room');
		expect(MockNotification.instances[0].options).toEqual({
			body: '',
			tag: 'external-meeting-chat-room1'
		});
	});

	it('focuses window, calls onOpen, and closes the notification on onclick', () => {
		const onOpen = jest.fn();
		const notification = notifyExternalChatMessage(JSON.stringify({ name: 'Alice', content: 'open me' }), 'external-meeting-chat-room1', onOpen);

		expect(notification).not.toBeNull();
		notification?.onclick?.({} as Event);

		expect(windowFocusMock).toHaveBeenCalledTimes(1);
		expect(onOpen).toHaveBeenCalledTimes(1);
		expect(MockNotification.instances[0].close).toHaveBeenCalledTimes(1);
	});

	it('requests notification permission only when permission is default', async () => {
		MockNotification.permission = 'granted';
		requestExternalChatNotificationPermission();
		expect(MockNotification.requestPermission).not.toHaveBeenCalled();

		MockNotification.permission = 'denied';
		requestExternalChatNotificationPermission();
		expect(MockNotification.requestPermission).not.toHaveBeenCalled();

		MockNotification.permission = 'default';
		MockNotification.requestPermission.mockRejectedValueOnce(new Error('ignored'));
		requestExternalChatNotificationPermission();
		expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);

		await Promise.resolve();

		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: { focus: windowFocusMock }
		});
		requestExternalChatNotificationPermission();
		expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
	});
});
