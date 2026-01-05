/* eslint-disable @nx/enforce-module-boundaries */
import { useChannelMembers } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { selectAllRolesClan, selectChannelById, selectRolesByChannelId, useAppSelector } from '@mezon/store';
import type { MentionDataProps } from '@mezon/utils';
import { ID_MENTION_HERE, TITLE_MENTION_HERE, getNameForPrioritize } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiRole } from 'mezon-js/types';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

interface UserMentionListProps {
	channelID: string;
	channelMode?: number;
}

export function UserMentionList({ channelID, channelMode }: UserMentionListProps): MentionDataProps[] {
	const { membersOfParent } = useChannelMembers({ channelId: channelID, mode: channelMode ?? 0 });
	const channel = useAppSelector((state) => selectChannelById(state, channelID)) || {};
	const channelparent = useAppSelector((state) => selectChannelById(state, channel?.parent_id || '')) || {};
	const rolesChannel = useSelector(selectRolesByChannelId(channel?.parent_id));
	const rolesInClan = useSelector(selectAllRolesClan);
	const rolesToUse = useMemo(() => {
		if (channel?.parent_id !== '0' && channelparent?.channel_private === 1) {
			return rolesChannel;
		} else {
			return rolesInClan;
		}
	}, [channel?.parent_id, channelparent?.channel_private, rolesChannel, rolesInClan]);

	const newUserMentionList = useMemo(() => {
		if (!membersOfParent || membersOfParent.length === 0) {
			return [];
		}

		const userMentionRaw = membersOfParent;
		const mentionList =
			userMentionRaw?.map((item: ChannelMembersEntity) => ({
				id: item?.id ?? '',
				display: getNameForPrioritize(item?.clanNick ?? '', item?.user?.displayName ?? '', item?.user?.username ?? ''),
				avatarUrl: item?.clanAvatar ? item?.clanAvatar : (item?.user?.avatarUrl ?? ''),
				username: item?.user?.username
			})) ?? [];
		const hardcodedUser: MentionDataProps = {
			id: ID_MENTION_HERE,
			display: TITLE_MENTION_HERE,
			avatarUrl: '',
			username: TITLE_MENTION_HERE
		};
		const sortedMentionList = [...mentionList].sort((a, b) => {
			const displayA = a.display?.toLowerCase() || '';
			const displayB = b.display?.toLowerCase() || '';

			if (displayA < displayB) return -1;
			if (displayA > displayB) return 1;
			return 0;
		});
		const roleMentions =
			rolesToUse?.map((item: ApiRole) => ({
				id: item.id ?? '',
				display: item.title,
				avatarUrl: item.roleIcon || '',
				clanNick: item.title,
				color: item.color,
				isRole: true
			})) ?? [];

		if (channelMode === ChannelStreamMode.STREAM_MODE_CHANNEL || channelMode === ChannelStreamMode.STREAM_MODE_THREAD) {
			return [...sortedMentionList, ...roleMentions, hardcodedUser];
		} else {
			return [...sortedMentionList, hardcodedUser];
		}
	}, [channelMode, membersOfParent, rolesToUse]);

	return newUserMentionList;
}
