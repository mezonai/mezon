import { createImgproxyUrl } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';

type ExternalChatMessagePayload = {
	name?: unknown;
	content?: unknown;
	avatar?: unknown;
};

const HIDE_NOTIFICATION_CONTENT_KEY = 'hideNotificationContent';

const shouldHideNotificationContent = (): boolean => {
	try {
		return typeof localStorage !== 'undefined' && localStorage.getItem(HIDE_NOTIFICATION_CONTENT_KEY) === 'true';
	} catch {
		return false;
	}
};

export const isPageInBackground = (doc: Pick<Document, 'visibilityState' | 'hasFocus'>): boolean => {
	return doc.visibilityState !== 'visible' || !doc.hasFocus();
};

export const requestExternalChatNotificationPermission = (): void => {
	if (
		typeof window === 'undefined' ||
		!('Notification' in window) ||
		typeof Notification === 'undefined' ||
		Notification.permission !== 'default'
	) {
		return;
	}
	try {
		void Promise.resolve(Notification.requestPermission()).catch(() => undefined);
	} catch {
		return;
	}
};

export const notifyExternalChatMessage = (raw: string, tag: string, onOpen?: () => void): Notification | null => {
	if (
		typeof window === 'undefined' ||
		!('Notification' in window) ||
		typeof Notification === 'undefined' ||
		Notification.permission !== 'granted' ||
		typeof document === 'undefined' ||
		!isPageInBackground(document)
	) {
		return null;
	}

	const parsed = safeJSONParse(raw) as ExternalChatMessagePayload | null | undefined;
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return null;
	}

	const content = typeof parsed.content === 'string' ? parsed.content.trim() : '';
	if (!content) {
		return null;
	}

	const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
	const avatar = typeof parsed.avatar === 'string' ? parsed.avatar.trim() : '';
	const title = `${name || 'Guest'} · Meeting Room`;
	const body = shouldHideNotificationContent() ? '' : content;
	const icon = avatar ? createImgproxyUrl(avatar, { width: 100, height: 100, resizeType: 'fill-down' }) : '';

	try {
		const notification = new Notification(title, {
			body,
			tag,
			...(icon ? { icon } : {})
		});
		notification.onclick = () => {
			window.focus();
			onOpen?.();
			notification.close();
		};
		return notification;
	} catch {
		return null;
	}
};
