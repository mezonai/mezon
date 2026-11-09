import type { ApiMessageAttachment } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import { FOR_10_MINUTES_SEC, FOR_24_HOURS_SEC } from '../constant';
import type { IMessageSendPayload } from '../types';
import { isMezonCdnUrl } from './urlSanitization';

export const PRESIGN_PENDING_MAX_AGE_SEC = FOR_10_MINUTES_SEC;
export const PRESIGN_INGEST_PENDING_MAX_AGE_SEC = FOR_24_HOURS_SEC;

type PresignKeyField = 'presign_finish' | 'presign_ingest';

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

		return normalizePresignKey(segment.split('.')[0]);
	} catch {
		const segment = url.split('?')[0].split('/').filter(Boolean).pop();
		return segment ? normalizePresignKey(segment.split('.')[0]) : undefined;
	}
}

function parsePresignKeys(content: unknown, field: PresignKeyField): string[] | null {
	const parsed = typeof content === 'string' ? safeJSONParse(content) : content;
	if (!parsed || typeof parsed !== 'object') return null;
	if (!(field in parsed)) return null;

	const keys = (parsed as Partial<Record<PresignKeyField, unknown>>)[field];
	if (!Array.isArray(keys)) return null;

	return keys.filter((key): key is string => typeof key === 'string').map(normalizePresignKey);
}

export function parsePresignFinishKeys(content: unknown): string[] | null {
	return parsePresignKeys(content, 'presign_finish');
}

export function parsePresignIngestKeys(content: unknown): string[] {
	return parsePresignKeys(content, 'presign_ingest') ?? [];
}

export function isPresignIngestAttachment(url: string | undefined, presignIngestKeys: string[]): boolean {
	const presignKey = getPresignKeyFromAttachmentUrl(url);
	return presignKey !== undefined && presignIngestKeys.includes(presignKey);
}

export function getPresignPendingMaxAgeSec(url: string | undefined, presignIngestKeys: string[]): number {
	return isPresignIngestAttachment(url, presignIngestKeys) ? PRESIGN_INGEST_PENDING_MAX_AGE_SEC : PRESIGN_PENDING_MAX_AGE_SEC;
}

export function countPresignableAttachments(attachments: ApiMessageAttachment[] | undefined): number {
	if (!attachments?.length) return 0;
	return attachments.filter((attachment) => isMezonCdnUrl(attachment.url)).length;
}

export function areAllPresignAttachmentsFinished(attachments: ApiMessageAttachment[] | undefined, presignFinishKeys: string[] | null): boolean {
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
	if (presignFinishKeys === null || !url) return false;
	if (attachments && areAllPresignAttachmentsFinished(attachments, presignFinishKeys)) return false;

	const presignKey = getPresignKeyFromAttachmentUrl(url);
	if (!presignKey) return false;

	const getUploadSnowflake = (key: string): string | null => {
		const separator = key.indexOf('_');
		if (separator <= 0) return null;

		const id = key.slice(0, separator);
		return /^\d+$/.test(id) ? id : null;
	};

	const attachmentSnowflake = getUploadSnowflake(presignKey);

	const isFinished = presignFinishKeys.some((finishedKey) => {
		if (finishedKey === presignKey) return true;

		return attachmentSnowflake !== null && getUploadSnowflake(finishedKey) === attachmentSnowflake;
	});

	return !isFinished;
}

export function getPresignFinishFingerprint(content: unknown): string {
	const keys = parsePresignFinishKeys(content);
	return keys ? keys.join('\u0001') : '';
}

function mergePresignKeys(existingContent: unknown, incomingContent: unknown, field: PresignKeyField): string[] | null {
	const incomingKeys = parsePresignKeys(incomingContent, field);
	const existingKeys = parsePresignKeys(existingContent, field);
	// The update carries no keys of its own (a plain edit, for
	// instance). Dropping the keys we already collected would turn the gate
	// off and let every still-uploading attachment hit imgproxy, so carry
	// them over untouched.
	if (incomingKeys === null) return existingKeys;
	return [...new Set([...(existingKeys ?? []), ...incomingKeys])];
}

export function mergePresignFinishContent(existingContent: unknown, incomingContent: unknown): unknown {
	const incomingParsed = typeof incomingContent === 'string' ? safeJSONParse(incomingContent) : incomingContent;
	if (!incomingParsed || typeof incomingParsed !== 'object') {
		return incomingContent;
	}

	const presignFinish = mergePresignKeys(existingContent, incomingParsed, 'presign_finish');
	const presignIngest = mergePresignKeys(existingContent, incomingParsed, 'presign_ingest');
	if (presignFinish === null && presignIngest === null) {
		return incomingContent;
	}

	const merged = {
		...(incomingParsed as Record<string, unknown>),
		...(presignFinish && { presign_finish: presignFinish }),
		...(presignIngest && { presign_ingest: presignIngest })
	};

	return typeof incomingContent === 'string' ? JSON.stringify(merged) : merged;
}

export function withoutPresignMarkers<T extends object>(content: T): Omit<T, PresignKeyField> {
	const { presign_finish: _presignFinish, presign_ingest: _presignIngest, ...forwarded } = content as T & Partial<Record<PresignKeyField, unknown>>;
	return forwarded;
}

export function isExpiredPresignAttachment(
	url: string | undefined,
	presignFinishKeys: string[] | null,
	messageCreateTimeSeconds?: number,
	nowSeconds = Math.floor(Date.now() / 1000),
	presignIngestKeys: string[] = []
): boolean {
	if (!messageCreateTimeSeconds || presignFinishKeys === null) return false;
	if (!isPresignAttachmentPending(url, presignFinishKeys)) return false;
	return nowSeconds - messageCreateTimeSeconds >= getPresignPendingMaxAgeSec(url, presignIngestKeys);
}

export function filterExpiredPresignAttachments(
	attachments: ApiMessageAttachment[],
	content: unknown,
	messageCreateTimeSeconds?: number,
	nowSeconds = Math.floor(Date.now() / 1000)
): ApiMessageAttachment[] {
	const presignFinishKeys = parsePresignFinishKeys(content);
	if (presignFinishKeys === null || !messageCreateTimeSeconds) return attachments;
	const presignIngestKeys = parsePresignIngestKeys(content);

	return attachments.filter(
		(attachment) => !isExpiredPresignAttachment(attachment.url, presignFinishKeys, messageCreateTimeSeconds, nowSeconds, presignIngestKeys)
	);
}

export function hasActivePresignPendingAttachments(attachments: ApiMessageAttachment[] | undefined, content: unknown): boolean {
	const presignFinishKeys = parsePresignFinishKeys(content);
	if (presignFinishKeys === null || !attachments?.length) return false;

	// Pass the attachments so the count short-circuit applies: a message whose keys
	// all arrived is finished even when a key does not match its url by name. Without
	// this the answer disagrees with what the row actually renders, and anything
	// driven off it (the expiry tick, the refetch) never stops.
	return attachments.some((attachment) => isPresignAttachmentPending(attachment.url, presignFinishKeys, attachments));
}

export function getPresignExpiryDelayMs(
	messageCreateTimeSeconds?: number,
	nowMs = Date.now(),
	maxAgeSec = PRESIGN_PENDING_MAX_AGE_SEC
): number | null {
	if (!messageCreateTimeSeconds) return null;

	const expiresAtMs = (messageCreateTimeSeconds + maxAgeSec) * 1000;
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

export function isAttachmentPresignPendingForMessage(url: string | undefined, message: { content?: unknown } | null | undefined): boolean {
	if (!message) return false;
	return isPresignAttachmentPending(url, parsePresignFinishKeys(message.content));
}

export function shouldHidePresignAttachment(
	url: string | undefined,
	message:
		| {
				content?: unknown;
				create_time_seconds?: number | string;
				create_time?: string;
				update_time_seconds?: number | string;
		  }
		| null
		| undefined,
	nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
	if (!message) return false;
	return isExpiredPresignAttachment(
		url,
		parsePresignFinishKeys(message.content),
		getMessageCreateTimeSeconds(message),
		nowSeconds,
		parsePresignIngestKeys(message.content)
	);
}
