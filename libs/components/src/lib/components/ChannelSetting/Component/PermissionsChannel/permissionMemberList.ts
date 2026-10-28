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

// As `normalizeSearchString` in @mezon/utils, plus đ: case and accents dropped, `-`, `_` and `+` read as spaces.
const foldName = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[đĐ]/g, 'D')
		.toUpperCase()
		.replace(/[-_+]/g, ' ');

const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * 0 when a name starts with the search, 1 when a word in it does (after any character that is not a letter or digit, as in
 * giang.tran), 2 when it only contains it, 3 when none does (the server also matches text it folds its own way).
 */
const matchRank = (folded: string, fields: ReadonlyArray<string | undefined>) => {
	let rank = 3;
	for (const field of fields) {
		const name = foldName(field ?? '');
		for (let at = name.indexOf(folded); at !== -1; at = name.indexOf(folded, at + 1)) {
			if (at === 0) return 0;
			rank = Math.min(rank, WORD_CHAR.test(name[at - 1]) ? 2 : 1);
		}
	}
	return rank;
};

const nameOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Best matches first, whether the roster or the server found them, so a member whose name starts with the search never
 * sits under one who merely contains it; equal matches by the name shown, the first of `namesOf` that is set, as the
 * mention picker sorts. Without a search the rows keep their order.
 */
export const rankByMatch = <T>(rows: readonly T[], needle: string, namesOf: (row: T) => ReadonlyArray<string | undefined>): T[] => {
	const folded = foldName(needle.trim());
	if (!folded) return [...rows];
	return rows
		.map((row) => {
			const names = namesOf(row);
			return { row, rank: matchRank(folded, names), name: names.find(Boolean) ?? '' };
		})
		.sort((a, b) => a.rank - b.rank || nameOrder.compare(a.name, b.name))
		.map((entry) => entry.row);
};

type NamedUser = { clan_nick?: string; display_name?: string; username?: string };

/** Members the server found for `needle`, a search needle as `searchNeedle` makes it. */
export type ServerAnswer<T extends NamedUser> = { needle: string; users: T[] };

/**
 * The server rows a picker lists while `needle` is typed. Until the server answers it, the previous answer stays listed
 * only where it still matches: a row for the old query must not sit under the new one, where a click would pick someone
 * the search no longer finds. Matched folded, as the server matches, so "Nguyễn" stays under "nguye". The answer itself
 * comes back when nothing is dropped, so a memoized list does not render again on every keystroke.
 */
export const serverRowsFor = <T extends NamedUser>(answer: ServerAnswer<T>, needle: string): T[] => {
	if (answer.needle === needle || answer.users.length === 0) return answer.users;
	const typed = foldName(needle.trim());
	const narrowed = answer.users.filter((user) =>
		[user.clan_nick, user.display_name, user.username].some((name) => !!name && foldName(name).includes(typed))
	);
	return narrowed.length === answer.users.length ? answer.users : narrowed;
};

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
 * nobody can search for or tell apart before removing it. A roster entry without any name
 * yields too: the socket event for an added member carries only its id when the server
 * has no cached profile, and the roster takes that entry as is.
 */
export const permissionMemberRow = (userId: string, rosterMember?: RosterMember | null, profile?: ChannelUserProfile): PermissionMemberRow => {
	const user = rosterMember?.user;
	if (user && (rosterMember.clan_nick || user.display_name || user.username)) {
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
