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

export interface ParsedRoomComment {
	content: string;
	timestamp: number;
}

export interface LiveCommentClanRosterEntry {
	entities?: {
		entities?: Record<string, LiveCommentClanMember | undefined>;
	};
	rosterCapped?: boolean;
}

export interface LiveCommentSenderGateInput {
	userId: string | undefined | null;
	inClanRoster: boolean;
	rosterLoaded: boolean;
	rosterCapped: boolean;
}

export interface ResolveLiveCommentSenderInput {
	userId: string | undefined | null;
	clanMember: LiveCommentClanMember | null | undefined;
	rosterLoaded: boolean;
	rosterCapped: boolean;
	fallbackMember?: LiveCommentClanMember | null;
	fallbackName?: string | null;
}

export const truncateLiveComment = (text: string): string => {
	const trimmed = text.trim();
	if (!trimmed) return '';
	return Array.from(trimmed).slice(0, MAX_LIVE_COMMENT_LENGTH).join('').trim();
};

export const isClanRosterLoaded = (clanRoster: LiveCommentClanRosterEntry | null | undefined): boolean =>
	typeof clanRoster?.rosterCapped === 'boolean';

export const canAcceptLiveCommentSender = ({ userId, inClanRoster, rosterLoaded, rosterCapped }: LiveCommentSenderGateInput): boolean => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (!normalizedUserId || normalizedUserId === '0') return false;
	if (!inClanRoster && rosterLoaded && !rosterCapped) return false;
	return true;
};

export const findMemberInAnyLoadedClan = (
	byClans: Record<string, LiveCommentClanRosterEntry | undefined> | null | undefined,
	userId: string | undefined | null,
	excludeClanId?: string
): LiveCommentClanMember | null => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (!normalizedUserId || normalizedUserId === '0' || !byClans) return null;
	let fallbackMatch: LiveCommentClanMember | null = null;
	for (const [clanId, clanRoster] of Object.entries(byClans)) {
		if (excludeClanId && clanId === excludeClanId) continue;
		const member = clanRoster?.entities?.entities?.[normalizedUserId];
		if (!member) continue;
		const hasUserName = Boolean(member.user?.display_name?.trim() || member.user?.username?.trim());
		const hasUserAvatar = Boolean(member.user?.avatar_url?.trim());
		if (hasUserName && hasUserAvatar) return member;
		if (!fallbackMatch || (hasUserName && !(fallbackMatch.user?.display_name?.trim() || fallbackMatch.user?.username?.trim()))) {
			fallbackMatch = member;
		}
	}
	return fallbackMatch;
};

export const resolveLiveCommentSender = ({
	userId,
	clanMember,
	rosterLoaded,
	rosterCapped,
	fallbackMember,
	fallbackName
}: ResolveLiveCommentSenderInput): LiveCommentSender | null => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (
		!canAcceptLiveCommentSender({
			userId: normalizedUserId,
			inClanRoster: Boolean(clanMember),
			rosterLoaded,
			rosterCapped
		})
	) {
		return null;
	}

	if (clanMember) {
		const clanNick = clanMember.clan_nick?.trim() || undefined;
		const displayName = clanMember.user?.display_name?.trim() || undefined;
		const username = clanMember.user?.username?.trim() || undefined;
		const clanName = getNameForPrioritize(clanNick, displayName, username);
		const clanAvatar =
			getAvatarForPrioritize(clanMember.clan_avatar?.trim() || undefined, clanMember.user?.avatar_url?.trim() || undefined) || '';
		if (clanName) {
			return {
				userId: normalizedUserId,
				name: clanName,
				avatar: clanAvatar
			};
		}
	}

	const fallbackMemberDisplayName = fallbackMember?.user?.display_name?.trim() || undefined;
	const fallbackMemberUsername = fallbackMember?.user?.username?.trim() || undefined;
	const fallbackMemberName = getNameForPrioritize(undefined, fallbackMemberDisplayName, fallbackMemberUsername);
	const memberAvatar =
		getAvatarForPrioritize(clanMember?.clan_avatar?.trim() || undefined, clanMember?.user?.avatar_url?.trim() || undefined) ||
		fallbackMember?.user?.avatar_url?.trim() ||
		'';
	if (fallbackMemberName) {
		return {
			userId: normalizedUserId,
			name: fallbackMemberName,
			avatar: memberAvatar
		};
	}

	const normalizedFallbackName = typeof fallbackName === 'string' ? fallbackName.trim() : '';
	if (normalizedFallbackName) {
		return {
			userId: normalizedUserId,
			name: normalizedFallbackName,
			avatar: memberAvatar
		};
	}

	return null;
};

export const resolveClanMemberSender = (
	userId: string | undefined | null,
	member: LiveCommentClanMember | null | undefined
): LiveCommentSender | null => {
	const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
	if (!normalizedUserId || normalizedUserId === '0' || !member) return null;
	const clanNick = member.clan_nick?.trim() || undefined;
	const displayName = member.user?.display_name?.trim() || undefined;
	const username = member.user?.username?.trim() || undefined;
	const name = getNameForPrioritize(clanNick, displayName, username) || normalizedUserId;
	const avatar = getAvatarForPrioritize(member.clan_avatar ?? undefined, member.user?.avatar_url ?? undefined) || '';
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
