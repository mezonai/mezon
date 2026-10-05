import type { ChannelsEntity } from '@mezon/store';
import { searchMentionUsers, useAppDispatch } from '@mezon/store';
import { getNameForPrioritize, sleep } from '@mezon/utils';
import type { ApiMentionUser } from 'mezon-js';
import { useCallback, useMemo, useState } from 'react';
import type { MentionData } from '../Mention';

// SearchMentionUsers takes 2-64 characters and answers at most SERVER_PAGE_SIZE members.
const MIN_QUERY_CHARS = 2;
const MAX_QUERY_CHARS = 64;
const SERVER_PAGE_SIZE = 50;
const DEBOUNCE_MS = 200;
// How long the picker keeps its rows for a pending search before it shows the local matches alone.
const HOLD_MS = 1000;
// One letter cannot be searched and its local matches are a sliver of the clan: the rows on screen stay this long for the
// next letter, so the list does not shrink to a few rows and grow back once that letter is searched.
const ONE_LETTER_HOLD_MS = 400;
// A socket server without SearchMentionUsers answers 404 to every query: stop asking for a while.
const UNSUPPORTED_RETRY_MS = 10 * 60 * 1000;
const MAX_CACHED_ANSWERS = 32;

let unsupportedUntil = 0;

// null: the search failed.
type Answer = { users: ApiMentionUser[] } | null;

// Failures that asking again cannot fix (bad text, no such channel, no access) stand for the session; others (timeout,
// overload, rate limit, a dropped socket) only for a short while.
const FINAL_ERROR_CODES = new Set([3, 5, 7]);
const RETRY_FAILED_MS = 15 * 1000;

interface SearchSession {
	scope: string;
	answers: Map<string, Answer>;
	pending: Map<string, Promise<Answer | undefined>>;
	// Searches run one at a time; the next one waits for this.
	queue: Promise<unknown>;
	latest: string;
	// The query whose search outlasted HOLD_MS and is still running.
	slow: string | null;
	inFlight: number;
	// Every member the server listed for this channel, kept past the answer cache for the thread add-member check.
	members: Set<string>;
	// When a query that failed for a passing reason may be asked again.
	retryAt: Map<string, number>;
}

// NFC: decomposed input (Unikey's combining mode, text pasted from macOS) must match the composed names the server holds.
const searchText = (query: string) => query.trim().normalize('NFC');
const searchKey = (query: string) => searchText(query).toLowerCase();

const matchesQuery = (user: ApiMentionUser, key: string) =>
	[user.username, user.display_name, user.clan_nick].some((field) => field?.toLowerCase().includes(key));

const lookup = (session: SearchSession, key: string): Answer | undefined => {
	if (session.answers.has(key)) {
		const retryAt = session.retryAt.get(key);
		if (retryAt === undefined || Date.now() < retryAt) {
			return session.answers.get(key);
		}
		session.answers.delete(key);
		session.retryAt.delete(key);
	}
	// An answer shorter than a page holds every member matching its query, so it also answers longer queries starting with it.
	for (const [prefix, answer] of session.answers) {
		if (answer && answer.users.length < SERVER_PAGE_SIZE && key.startsWith(prefix)) {
			return { users: answer.users.filter((user) => matchesQuery(user, key)) };
		}
	}
	return undefined;
};

// The channel whose members a picker in `channel` lists: a thread lists its parent's.
export const mentionScopeChannelId = (channel?: Pick<ChannelsEntity, 'id' | 'parent_id'> | null) =>
	channel?.parent_id && channel.parent_id !== '0' ? channel.parent_id : (channel?.id ?? '0');

// The server matches after the local ones, minus members the local list already shows.
export const appendRemoteMembers = (local: MentionData[], users: ApiMentionUser[], skipUserId?: string): MentionData[] => {
	if (!users.length) return local;
	const listed = new Set(local.map((mention) => mention.id));
	const remote: MentionData[] = [];
	for (const user of users) {
		if (!user.id || listed.has(user.id) || user.id === skipUserId) continue;
		listed.add(user.id);
		remote.push({
			id: user.id,
			display: getNameForPrioritize(user.clan_nick, user.display_name, user.username) ?? '',
			avatarUrl: user.clan_avatar || user.avatar_url || '',
			username: user.username,
			isRemote: true
		});
	}
	return [...local, ...remote];
};

interface UseRemoteMentionSearchOptions {
	clanId: string;
	// The channel whose members the picker lists: a private one narrows the search to its members.
	channelId: string;
	enabled: boolean;
}

// Asks the server for members the store does not hold, in clans larger than the roster ListClanUsers returns.
export const useRemoteMentionSearch = ({ clanId, channelId, enabled }: UseRemoteMentionSearchOptions) => {
	const dispatch = useAppDispatch();
	// Answers belong to one channel: switching starts over.
	const scope = enabled ? `${clanId}:${channelId}` : '';
	const session = useMemo<SearchSession>(
		() => ({
			scope,
			answers: new Map(),
			pending: new Map(),
			queue: Promise.resolve(),
			latest: '',
			slow: null,
			inFlight: 0,
			members: new Set(),
			retryAt: new Map()
		}),
		[scope]
	);
	// Bumped when a search the picker stopped waiting for ends, so the picker asks again and reads the answer from the cache.
	const [lateAnswers, setLateAnswers] = useState(0);

	const send = useCallback(
		(key: string, text: string) => {
			const request = session.queue.then(async (): Promise<Answer | undefined> => {
				// Typed on while queued: the newer query searches instead.
				if (session.latest !== key) return undefined;
				const known = lookup(session, key);
				if (known !== undefined) return known;
				session.inFlight++;
				const action = await dispatch(searchMentionUsers({ clanId, channelId, text })).finally(() => {
					session.inFlight--;
				});
				const result = searchMentionUsers.fulfilled.match(action) ? action.payload : {};
				if ('errorCode' in result && result.errorCode === 404) {
					unsupportedUntil = Date.now() + UNSUPPORTED_RETRY_MS;
				}
				const answer: Answer = 'users' in result ? { users: result.users } : null;
				if (answer) {
					for (const user of answer.users) {
						if (user.id) session.members.add(user.id);
					}
				}
				session.answers.set(key, answer);
				const errorCode = 'errorCode' in result ? result.errorCode : undefined;
				if (!answer && !(errorCode !== undefined && FINAL_ERROR_CODES.has(errorCode))) {
					session.retryAt.set(key, Date.now() + RETRY_FAILED_MS);
				}
				if (session.answers.size > MAX_CACHED_ANSWERS) {
					const oldest = session.answers.keys().next().value as string;
					session.answers.delete(oldest);
					session.retryAt.delete(oldest);
				}
				return answer;
			});
			session.queue = request;
			session.pending.set(key, request);
			request.finally(() => session.pending.delete(key));
			return request;
		},
		[session, dispatch, clanId, channelId]
	);

	// Server matches for `query`, or [] when the server is not asked, fails, or is slower than HOLD_MS.
	const searchMembers = useCallback(
		async (query: string): Promise<ApiMentionUser[]> => {
			const text = searchText(query);
			const key = searchKey(query);
			session.latest = key;
			const length = Array.from(text).length;
			if (session.scope && length > 0 && length < MIN_QUERY_CHARS && Date.now() >= unsupportedUntil) {
				await sleep(ONE_LETTER_HOLD_MS);
				return [];
			}
			if (!session.scope || length < MIN_QUERY_CHARS || length > MAX_QUERY_CHARS || Date.now() < unsupportedUntil) {
				return [];
			}

			const known = lookup(session, key);
			if (known !== undefined) return known?.users ?? [];

			// The first searchable query (two characters) goes out at once: the rows on screen then are the short one-letter
			// local list, and its answer should fill the list while the user is still typing rather than after they stop.
			// Longer queries wait for the debounce; a query already being searched just waits for that search.
			const leading = length === MIN_QUERY_CHARS && session.inFlight === 0;
			if (!leading && !session.pending.has(key)) {
				await sleep(DEBOUNCE_MS);
				if (session.latest !== key) return [];
			}

			const request = session.pending.get(key) ?? send(key, text);
			const answer = await Promise.race([request, sleep(HOLD_MS).then(() => undefined)]);
			if (answer !== undefined) return answer?.users ?? [];

			session.slow = key;
			request.then(() => {
				if (session.slow === key) session.slow = null;
				if (session.latest === key) {
					setLateAnswers((count) => count + 1);
				}
			});
			return [];
		},
		[session, send]
	);

	// Whether the server is still searching `query` after the picker stopped waiting for it.
	const isSearching = useCallback((query: string) => session.slow !== null && session.slow === searchKey(query), [session]);

	// Whether the server listed this user for the current channel, i.e. as a member the store may lack.
	const isRemoteMember = useCallback((userId: string) => session.members.has(userId), [session]);

	return { searchMembers, isRemoteMember, isSearching, lateAnswers };
};
