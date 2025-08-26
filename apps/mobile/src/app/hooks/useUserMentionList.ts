/* eslint-disable @nx/enforce-module-boundaries */
import {
	channelMembersActions,
	ChannelMembersEntity,
	ChannelsEntity,
	getStore,
	selectAllChannelMembers,
	selectAllRolesClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { getNameForPrioritize, ID_MENTION_HERE, MentionDataProps } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiRole } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

interface UserMentionListProps {
	channelDetail: ChannelsEntity;
	channelID: string;
	channelMode?: number;
}

const sortMentionList = (mentionList: MentionDataProps[]): MentionDataProps[] => {
	if (!Array.isArray(mentionList) || mentionList?.length === 0) {
		return [];
	}

	return [...mentionList].sort((a, b) => {
		const displayA = a?.display?.toLowerCase() ?? '';
		const displayB = b?.display?.toLowerCase() ?? '';

		if (displayA < displayB) return -1;
		if (displayA > displayB) return 1;
		return 0;
	});
};

const transformMemberToMention = (item: ChannelMembersEntity): MentionDataProps | null => {
	if (!item?.id) {
		return null;
	}

	return {
		id: item.id,
		display: getNameForPrioritize(item?.clan_nick ?? '', item?.user?.display_name ?? '', item?.user?.username ?? ''),
		avatarUrl: item?.clan_avatar || item?.user?.avatar_url || '',
		username: item?.user?.username || ''
	};
};

// Memoized role transformation function
const transformRoleToMention = (item: ApiRole): MentionDataProps | null => {
	if (!item?.id || !item?.title) {
		return null;
	}

	return {
		id: item.id,
		display: item.title,
		avatarUrl: '',
		clanNick: item.title,
		isRoleUser: true,
		color: item.color
	};
};

function UseMentionList({ channelDetail, channelID, channelMode }: UserMentionListProps): MentionDataProps[] {
	const membersOfParent = useAppSelector((state) => selectAllChannelMembers(state, channelID || ''));
	const rolesInClan = useSelector(selectAllRolesClan);
	const dispatch = useAppDispatch();

	const channelId = channelDetail?.id;
	const parentId = channelDetail?.parent_id;
	const clanId = channelDetail?.clan_id;

	const filteredRoles = useMemo(() => {
		if (!Array.isArray(rolesInClan)) {
			return [];
		}
		return rolesInClan.filter((role) => role?.id && role?.slug !== `everyone-${role?.clan_id}`);
	}, [rolesInClan]);

	const getMembersChannel = useCallback((): ChannelMembersEntity[] => {
		// Early return if we have members for parent
		if (Array.isArray(membersOfParent) && membersOfParent.length > 0) {
			return membersOfParent;
		}

		// Safety check for required props
		if (!channelId || !clanId) {
			return [];
		}

		const store = getStore();
		const state = store.getState();

		const membersCurrentChannel = selectAllChannelMembers(state, channelId);
		if (Array.isArray(membersCurrentChannel) && membersCurrentChannel.length > 0) {
			return membersCurrentChannel;
		}

		if (parentId && parentId !== '0') {
			const membersCurrentChildChannel = selectAllChannelMembers(state, parentId);
			if (Array.isArray(membersCurrentChildChannel) && membersCurrentChildChannel.length > 0) {
				return membersCurrentChildChannel;
			}
		}

		const targetChannelId = parentId && parentId !== '0' ? parentId : channelId;
		dispatch(
			channelMembersActions.fetchChannelMembers({
				clanId,
				channelId: targetChannelId,
				channelType: ChannelType.CHANNEL_TYPE_CHANNEL,
				noCache: true
			})
		);

		return [];
	}, [membersOfParent, channelId, clanId, parentId, dispatch]);

	const processedMentionData = useMemo(() => {
		const userMentionRaw = getMembersChannel();

		const mentionList = userMentionRaw.map(transformMemberToMention).filter((item): item is MentionDataProps => item !== null);

		const roleMentions = filteredRoles.map(transformRoleToMention).filter((item): item is MentionDataProps => item !== null);

		const sortedMentionList = sortMentionList(mentionList);

		return {
			sortedMentionList,
			roleMentions
		};
	}, [getMembersChannel, filteredRoles]);

	return useMemo(() => {
		const { sortedMentionList, roleMentions } = processedMentionData;

		const hardcodedUser: MentionDataProps = {
			id: ID_MENTION_HERE,
			display: 'here',
			avatarUrl: '',
			username: 'here'
		};

		const mode = channelMode ?? ChannelStreamMode.STREAM_MODE_DM;

		if (mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD) {
			return [...sortedMentionList, ...roleMentions, hardcodedUser];
		} else if (mode === ChannelStreamMode.STREAM_MODE_GROUP) {
			return [...sortedMentionList, hardcodedUser];
		} else {
			return sortedMentionList;
		}
	}, [processedMentionData, channelMode]);
}

export default UseMentionList;
