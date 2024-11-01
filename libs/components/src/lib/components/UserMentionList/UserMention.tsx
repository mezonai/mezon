/* eslint-disable @nx/enforce-module-boundaries */
import { useChannelMembers } from '@mezon/core';
import { ChannelMembersEntity, selectAllRolesClan, selectChannelById, selectRolesByChannelId, useAppSelector } from '@mezon/store';
import { EVERYONE_ROLE_ID, ID_MENTION_HERE, MentionDataProps, getNameForPrioritize } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiRole } from 'mezon-js/api.gen';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

interface UserMentionListProps {
	channelID: string;
	channelMode?: number;
}

export function UserMentionList({ channelID, channelMode }: UserMentionListProps): MentionDataProps[] {
	const { membersOfParent } = useChannelMembers({ channelId: channelID, mode: channelMode ?? 0 });
	const channel = useAppSelector((state) => selectChannelById(state, channelID)) || {};
	const channelparrent = useAppSelector((state) => selectChannelById(state, channel?.parrent_id || '')) || {};
	const rolesChannel = useSelector(selectRolesByChannelId(channel?.parrent_id));
	const rolesInClan = useSelector(selectAllRolesClan);
	const rolesToUse = useMemo(() => {
		if (channel?.parrent_id !== '0' && channelparrent?.channel_private === 1) {
			return rolesChannel;
		} else {
			return rolesInClan;
		}
	}, [channel?.parrent_id, channelparrent?.channel_private, rolesChannel, rolesInClan]);

	const filteredRoles = useMemo(() => {
		return rolesToUse.filter((role) => role.id !== EVERYONE_ROLE_ID);
	}, [rolesToUse]);
	const newUserMentionList = useMemo(() => {
		if (!membersOfParent || membersOfParent.length === 0) {
			return [];
		}

		const userMentionRaw = membersOfParent;
		const mentionList =
			userMentionRaw?.map((item: ChannelMembersEntity) => ({
				id: item?.id ?? '',
				display: getNameForPrioritize(item.clan_nick ?? '', item.user?.display_name ?? '', item.user?.username ?? ''),
				avatarUrl: item.clan_avatar ? item.clan_avatar : (item?.user?.avatar_url ?? ''),
				username: item.user?.username
			})) ?? [];
		const hardcodedUser: MentionDataProps = {
			id: ID_MENTION_HERE,
			display: '@here',
			avatarUrl: '',
			username: '@here'
		};
		const sortedMentionList = [...mentionList].sort((a, b) => {
			const displayA = a.display?.toLowerCase() || '';
			const displayB = b.display?.toLowerCase() || '';

			if (displayA < displayB) return -1;
			if (displayA > displayB) return 1;
			return 0;
		});
		const roleMentions =
			filteredRoles?.map((item: ApiRole) => ({
				id: item.id ?? '',
				display: item.title,
				avatarUrl: '',
				clanNick: item.title
			})) ?? [];

		if (channelMode === ChannelStreamMode.STREAM_MODE_CHANNEL) {
			return [...sortedMentionList, ...roleMentions, hardcodedUser];
		} else {
			return [...sortedMentionList];
		}
	}, [channelMode, membersOfParent, rolesToUse]);

	return newUserMentionList;
}
