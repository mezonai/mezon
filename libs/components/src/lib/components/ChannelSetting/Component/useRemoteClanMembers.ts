import type { AddedChannelUserProfile } from '@mezon/store';
import { selectClanRosterCapped, selectCurrentClanId, useAppSelector } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import type { ApiMentionUser } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRemoteMentionSearch } from '../../MessageBox/ReactionMentionInput/hooks/useRemoteMentionSearch';
import type { ServerAnswer } from './PermissionsChannel/permissionMemberList';
import { searchNeedle, serverRowsFor } from './PermissionsChannel/permissionMemberList';

const MIN_QUERY_CHARS = 2;

const NO_ANSWER: ServerAnswer<ApiMentionUser> = { needle: '', users: [] };

// The whole clan, as a public or welcome channel would list it: anyone in the clan can be added to a channel.
const CLAN_SCOPE = '0';

export const clanUserFromMentionUser = (user: ApiMentionUser): UsersClanEntity => ({
	id: user.id ?? '',
	clan_nick: user.clan_nick,
	clan_avatar: user.clan_avatar,
	user: {
		id: user.id,
		username: user.username,
		display_name: user.display_name,
		avatar_url: user.avatar_url
	}
});

// What a picker ranks a member's match by, as the roster and the server name them.
export const memberNames = (member: UsersClanEntity) => [member.clan_nick, member.user?.display_name, member.user?.username];

// The identity the channel listing returns for a member: its own columns carry no clan nickname or clan avatar.
export const listingProfileOf = (user: ApiMentionUser): AddedChannelUserProfile => ({
	username: user.username ?? '',
	display_name: user.display_name ?? '',
	avatar: user.avatar_url ?? ''
});

/**
 * Members the server finds for `query` in a clan larger than the roster ListClanUsers returns (it stops at 1000), so a
 * channel picker can offer someone who joined before the newest 1000. Clans the roster holds whole send no request.
 */
export const useRemoteClanMembers = (query: string) => {
	const clanId = useSelector(selectCurrentClanId) ?? '';
	const rosterCapped = useAppSelector((state) => selectClanRosterCapped(state, clanId));
	const enabled = rosterCapped && clanId !== '' && clanId !== '0';
	const { searchMembers, isSearching, lateAnswers } = useRemoteMentionSearch({ clanId, channelId: CLAN_SCOPE, enabled });
	const [answer, setAnswer] = useState<ServerAnswer<ApiMentionUser>>(NO_ANSWER);
	const [pending, setPending] = useState(false);
	// Everyone the server listed while the picker is open: a member picked under one query keeps their identity after the
	// query changes.
	const known = useRef(new Map<string, ApiMentionUser>());
	const needle = searchNeedle(query);

	useEffect(() => {
		if (!enabled || Array.from(needle).length < MIN_QUERY_CHARS) {
			setAnswer(NO_ANSWER);
			setPending(false);
			return;
		}
		let cancelled = false;
		setPending(true);
		searchMembers(needle).then((found) => {
			if (cancelled) return;
			for (const user of found) {
				if (user.id) known.current.set(user.id, user);
			}
			setAnswer({ needle, users: found });
			setPending(isSearching(needle));
		});
		return () => {
			cancelled = true;
		};
	}, [enabled, needle, lateAnswers, searchMembers, isSearching]);

	const users = useMemo(() => serverRowsFor(answer, needle), [answer, needle]);

	const profilesOf = useCallback((userIds: string[]) => {
		const profiles: Record<string, AddedChannelUserProfile> = {};
		for (const userId of userIds) {
			const user = known.current.get(userId);
			if (user) profiles[userId] = listingProfileOf(user);
		}
		return profiles;
	}, []);

	return { users, pending, profilesOf };
};
