/** Rows a permission list shows per page. The list reserves this many rows of height, so paging never moves what sits below it. */
export const PERMISSION_LIST_PAGE_SIZE = 8;

/** Same delay as the "Add members or roles" modal: the list filters once typing pauses. */
export const PERMISSION_SEARCH_DEBOUNCE_MS = 300;

export const pageCount = (length: number, perPage = PERMISSION_LIST_PAGE_SIZE) => Math.max(1, Math.ceil(length / Math.max(1, perPage)));

/** Clamped to the last page, so a shrinking list (a removal, a narrower search) never leaves the view pointing past the end. */
export const clampPage = (page: number, length: number, perPage = PERMISSION_LIST_PAGE_SIZE) =>
	Math.min(Math.max(0, page), pageCount(length, perPage) - 1);

export const pageSlice = <T>(items: readonly T[], page: number, perPage = PERMISSION_LIST_PAGE_SIZE): T[] => {
	const size = Math.max(1, perPage);
	const start = clampPage(page, items.length, size) * size;
	return items.slice(start, start + size);
};

/** `990`, or `12/990` while a search narrows the list. */
export const countLabel = (matched: number, total: number) => (matched === total ? `${total}` : `${matched}/${total}`);

/** Lower-cased search text without the `@` the add panel uses to mean "members only". */
export const searchNeedle = (input: string) => {
	const normalized = input.trim().toLowerCase();
	return normalized.startsWith('@') ? normalized.slice(1) : normalized;
};

export const matchesNeedle = (needle: string, fields: ReadonlyArray<string | undefined>) =>
	!needle || fields.some((field) => !!field && field.toLowerCase().includes(needle));

export type ChannelUserProfile = {
	username: string;
	displayName: string;
	avatar: string;
};

type ChannelUserListing = {
	user_ids?: string[];
	usernames?: string[];
	display_names?: string[];
	avatars?: string[];
};

/**
 * Identity ListChannelUsersUC ships beside each id, keyed by user id. The listing sends
 * parallel arrays; an entry the server left short just falls back further at render time.
 */
export const channelUserProfiles = (listing?: ChannelUserListing | null): Record<string, ChannelUserProfile> => {
	const profiles: Record<string, ChannelUserProfile> = {};
	listing?.user_ids?.forEach((userId, index) => {
		const profile = {
			username: listing.usernames?.[index] || '',
			displayName: listing.display_names?.[index] || '',
			avatar: listing.avatars?.[index] || ''
		};
		if (profile.username || profile.displayName || profile.avatar) {
			profiles[userId] = profile;
		}
	});
	return profiles;
};

type RosterMember = {
	clan_nick?: string;
	clan_avatar?: string;
	user?: {
		username?: string;
		display_name?: string;
		avatar_url?: string;
	};
};

export type PermissionMemberRow = {
	id: string;
	name: string;
	username: string;
	avatar: string;
	/** What a search matches against. */
	keywords: string[];
};

/**
 * The clan roster first (nickname and clan avatar included), then the identity the
 * channel listing carries, then the id itself. The roster is capped server-side and drops
 * anyone who left the clan, so without the fallbacks such a member renders as a blank row
 * nobody can search for or tell apart before removing it.
 */
export const permissionMemberRow = (userId: string, rosterMember?: RosterMember | null, profile?: ChannelUserProfile): PermissionMemberRow => {
	const user = rosterMember?.user;
	if (user) {
		const clanAvatar = rosterMember.clan_avatar;
		return {
			id: userId,
			name: rosterMember.clan_nick || user.display_name || user.username || userId,
			username: user.username || '',
			avatar: (clanAvatar && clanAvatar !== user.avatar_url ? clanAvatar : user.avatar_url) || '',
			keywords: [rosterMember.clan_nick, user.display_name, user.username].filter((value): value is string => !!value)
		};
	}
	if (profile) {
		return {
			id: userId,
			name: profile.displayName || profile.username || userId,
			username: profile.username,
			avatar: profile.avatar,
			keywords: [profile.displayName, profile.username].filter(Boolean)
		};
	}
	return { id: userId, name: userId, username: '', avatar: '', keywords: [] };
};
