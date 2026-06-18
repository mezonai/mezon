import type { ApiMessageAttachment } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import { FOR_10_MINUTES_SEC } from '../constant';
import type { IMessageSendPayload } from '../types';
import { isMezonCdnUrl } from './urlSanitization';

export const PRESIGN_PENDING_MAX_AGE_SEC = FOR_10_MINUTES_SEC;

export function normalizePresignKey(key: string): string {
	const segment = key.split('?')[0].split('/').filter(Boolean).pop() || key;
	return segment.replace(/\.[^/.]+$/, '');
}

export function getPresignKeyFromAttachmentUrl(url?: string): string | undefined {
	if (!url || url.startsWith('blob:')) return undefined;

	try {
		const pathname = new URL(url).pathname;
		const segment = pathname.split('/').filter(Boolean).pop();
		if (!segment) return undefined;
		return normalizePresignKey(segment);
	} catch {
		const segment = url.split('?')[0].split('/').filter(Boolean).pop();
		return segment ? normalizePresignKey(segment) : undefined;
	}
}

export function parsePresignFinishKeys(content: unknown): string[] | null {
	const parsed = typeof content === 'string' ? safeJSONParse(content) : content;
	if (!parsed || typeof parsed !== 'object') return null;
	if (!('presign_finish' in parsed)) return null;

	const keys = (parsed as { presign_finish?: unknown }).presign_finish;
	if (!Array.isArray(keys)) return null;

	return keys.filter((key): key is string => typeof key === 'string').map(normalizePresignKey);
}

export function countPresignableAttachments(attachments: ApiMessageAttachment[] | undefined): number {
	if (!attachments?.length) return 0;
	return attachments.filter((attachment) => isMezonCdnUrl(attachment.url)).length;
}

export function areAllPresignAttachmentsFinished(
	attachments: ApiMessageAttachment[] | undefined,
	presignFinishKeys: string[] | null
): boolean {
	if (presignFinishKeys === null) return false;
	const presignableCount = countPresignableAttachments(attachments);
	if (presignableCount === 0) return false;
	return presignFinishKeys.length >= presignableCount;
}

export function isPresignAttachmentPending(
	url: string | undefined,
	presignFinishKeys: string[] | null,
	attachments?: ApiMessageAttachment[]
): boolean {
	if (presignFinishKeys === null || !url || !isMezonCdnUrl(url)) return false;
	if (attachments && areAllPresignAttachmentsFinished(attachments, presignFinishKeys)) return false;

	const presignKey = getPresignKeyFromAttachmentUrl(url);
	if (!presignKey) return false;

	const finishedKeys = new Set(presignFinishKeys);
	return !finishedKeys.has(presignKey);
}

export function getPresignFinishFingerprint(content: unknown): string {
	const keys = parsePresignFinishKeys(content);
	return keys ? keys.join('\u0001') : '';
}

export function mergePresignFinishKeys(existingContent: unknown, incomingContent: unknown): string[] | null {
	const incomingKeys = parsePresignFinishKeys(incomingContent);
	if (incomingKeys === null) return null;

	const existingKeys = parsePresignFinishKeys(existingContent);
	return [...new Set([...(existingKeys ?? []), ...incomingKeys])];
}

export function mergePresignFinishContent(existingContent: unknown, incomingContent: unknown): unknown {
	const incomingParsed = typeof incomingContent === 'string' ? safeJSONParse(incomingContent) : incomingContent;
	if (!incomingParsed || typeof incomingParsed !== 'object') {
		return incomingContent;
	}

	const mergedKeys = mergePresignFinishKeys(existingContent, incomingParsed);
	if (mergedKeys === null) {
		return incomingContent;
	}

	const merged = {
		...(incomingParsed as Record<string, unknown>),
		presign_finish: mergedKeys
	};

	return typeof incomingContent === 'string' ? JSON.stringify(merged) : merged;
}

export function isExpiredPresignAttachment(
	url: string | undefined,
	presignFinishKeys: string[] | null,
	messageCreateTimeSeconds?: number,
	nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
	if (!messageCreateTimeSeconds || presignFinishKeys === null) return false;
	if (!isPresignAttachmentPending(url, presignFinishKeys)) return false;
	return nowSeconds - messageCreateTimeSeconds >= PRESIGN_PENDING_MAX_AGE_SEC;
}

export function filterExpiredPresignAttachments(
	attachments: ApiMessageAttachment[],
	content: unknown,
	messageCreateTimeSeconds?: number,
	nowSeconds = Math.floor(Date.now() / 1000)
): ApiMessageAttachment[] {
	const presignFinishKeys = parsePresignFinishKeys(content);
	if (presignFinishKeys === null || !messageCreateTimeSeconds) return attachments;

	return attachments.filter(
		(attachment) => !isExpiredPresignAttachment(attachment.url, presignFinishKeys, messageCreateTimeSeconds, nowSeconds)
	);
}

export function hasActivePresignPendingAttachments(
	attachments: ApiMessageAttachment[] | undefined,
	content: unknown
): boolean {
	const presignFinishKeys = parsePresignFinishKeys(content);
	if (presignFinishKeys === null || !attachments?.length) return false;

	return attachments.some((attachment) => isPresignAttachmentPending(attachment.url, presignFinishKeys));
}

export function getPresignExpiryDelayMs(messageCreateTimeSeconds?: number, nowMs = Date.now()): number | null {
	if (!messageCreateTimeSeconds) return null;

	const expiresAtMs = (messageCreateTimeSeconds + PRESIGN_PENDING_MAX_AGE_SEC) * 1000;
	const delay = expiresAtMs - nowMs;
	return delay <= 0 ? 0 : delay;
}

export function withCreateTimeSecondsInUpdateContent(
	content: IMessageSendPayload,
	messageCreateTimeSeconds: number | undefined
): IMessageSendPayload {
	if (!messageCreateTimeSeconds) {
		return content;
	}

	return { ...content, create_time_seconds: messageCreateTimeSeconds };
}

export function getMessageCreateTimeSeconds(message: {
	create_time_seconds?: number | string;
	create_time?: string;
	update_time_seconds?: number | string;
}): number | undefined {
	if (message.create_time_seconds !== undefined && message.create_time_seconds !== null) {
		const seconds = Number(message.create_time_seconds);
		if (Number.isFinite(seconds) && seconds > 0) return seconds;
	}

	if (message.create_time) {
		const parsed = new Date(message.create_time).getTime();
		if (!isNaN(parsed)) return Math.floor(parsed / 1000);
	}

	if (message.update_time_seconds !== undefined && message.update_time_seconds !== null) {
		const seconds = Number(message.update_time_seconds);
		if (Number.isFinite(seconds) && seconds > 0) return seconds;
	}

	return undefined;
}

export function isAttachmentPresignPendingForMessage(
	url: string | undefined,
	message: { content?: unknown } | null | undefined
): boolean {
	if (!message) return false;
	return isPresignAttachmentPending(url, parsePresignFinishKeys(message.content));
}

export function shouldHidePresignAttachment(
	url: string | undefined,
	message: {
		content?: unknown;
		create_time_seconds?: number | string;
		create_time?: string;
		update_time_seconds?: number | string;
	} | null | undefined,
	nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
	if (!message) return false;
	return isExpiredPresignAttachment(url, parsePresignFinishKeys(message.content), getMessageCreateTimeSeconds(message), nowSeconds);
}
