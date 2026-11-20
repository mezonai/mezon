import { getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';

export const STREAM_COMMENT_PREFIX = 'comment:';
export const MAX_LIVE_COMMENT_LENGTH = 500;

export interface LiveCommentItem {
	id: string;
	senderId: string;
	name: string;
	avatar: string;
	content: string;
	timestamp: number;
}

export interface LiveCommentSender {
	userId: string;
	name: string;
	avatar: string;
}

export interface LiveCommentClanMember {
	clan_nick?: string | null;
	clan_avatar?: string | null;
	user?: {
		display_name?: string | null;
		username?: string | null;
		avatar_url?: string | null;
	} | null;
}

export interface LiveCommentParticipant {
	userId?: string;
	username?: string;
	avatar?: string;
}

export interface ParsedRoomComment {
	content: string;
	timestamp: number;
}

export const truncateLiveComment = (text: string): string => {
	const trimmed = text.trim();
	if (!trimmed) return '';
	return Array.from(trimmed).slice(0, MAX_LIVE_COMMENT_LENGTH).join('').trim();
};

export const resolveClanMemberSender = (
	userId: string | undefined | null,
	member: LiveCommentClanMember | null | undefined
): LiveCommentSender | null => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (!normalizedUserId || normalizedUserId === '0' || !member) return null;
	const name =
		getNameForPrioritize(member.clan_nick ?? undefined, member.user?.display_name ?? undefined, member.user?.username ?? undefined)?.trim() ||
		normalizedUserId;
	const avatar = getAvatarForPrioritize(member.clan_avatar ?? undefined, member.user?.avatar_url ?? undefined) || '';
	return {
		userId: normalizedUserId,
		name,
		avatar
	};
};

export const resolveRoomCommentSender = (
	userId: string | undefined | null,
	clanMembers: Record<string, LiveCommentClanMember | undefined>,
	participants: readonly LiveCommentParticipant[] = []
): LiveCommentSender | null => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (!normalizedUserId || normalizedUserId === '0') return null;
	const member = clanMembers[normalizedUserId];
	const participant = participants.find((item) => item.userId === normalizedUserId);
	if (!member && !participant) return null;
	const name =
		getNameForPrioritize(member?.clan_nick ?? undefined, member?.user?.display_name ?? undefined, member?.user?.username ?? undefined)?.trim() ||
		participant?.username?.trim() ||
		normalizedUserId;
	const avatar = getAvatarForPrioritize(member?.clan_avatar ?? undefined, member?.user?.avatar_url ?? undefined) || participant?.avatar || '';
	return {
		userId: normalizedUserId,
		name,
		avatar
	};
};

export const parseRoomComment = (message: string | undefined | null): ParsedRoomComment | null => {
	if (typeof message !== 'string' || !message.trim()) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(message);
	} catch {
		return null;
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
	const record = parsed as Record<string, unknown>;
	if (typeof record.content !== 'string') return null;
	const content = truncateLiveComment(record.content);
	if (!content) return null;
	const timestamp = typeof record.timestamp === 'number' && Number.isFinite(record.timestamp) ? record.timestamp : Date.now();
	return {
		content,
		timestamp
	};
};

export const isStreamCommentToken = (token: string | undefined | null): boolean =>
	typeof token === 'string' && token.startsWith(STREAM_COMMENT_PREFIX);

export const parseStreamCommentToken = (token: string | undefined | null): string | null => {
	if (!isStreamCommentToken(token)) return null;
	const content = truncateLiveComment((token as string).slice(STREAM_COMMENT_PREFIX.length));
	return content || null;
};

export const formatStreamCommentToken = (text: string): string | null => {
	const content = truncateLiveComment(text);
	return content ? `${STREAM_COMMENT_PREFIX}${content}` : null;
};
