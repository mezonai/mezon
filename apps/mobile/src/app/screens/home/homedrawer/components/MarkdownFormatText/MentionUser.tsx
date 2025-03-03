import { ChannelMembersEntity } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js/client';

type IMentionUser = {
	tagName: string;
	roleId: string;
	tagUserId: string;
	mode: number;
	usersClan: any;
	usersInChannel: any;
};
export const MentionUser = ({ tagName, tagUserId, roleId, mode, usersClan, usersInChannel }: IMentionUser) => {
	if (roleId) {
		return `[${tagName}](@role${roleId})`;
	}

	if (tagName?.includes('here')) {
		return `[@here](@here)`;
	}

	const getUserMention = (mode: number, usersInChannel: ChannelMembersEntity[], usersClan: UsersClanEntity[]) => {
		if (mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP) {
			return usersInChannel?.find((channelUser) => channelUser?.user?.id === tagUserId);
		}

		return usersClan?.find((userClan) => userClan?.user?.id === tagUserId);
	};
	const userMention = getUserMention(mode, usersInChannel, usersClan);
	const { user } = userMention || {};

	if (user) {
		return userMention?.user ? `[${tagName}](@${user?.username})` : `@[${user?.username}](@${user?.username})`;
	}

	return tagName;
};
