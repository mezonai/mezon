import {
	ChannelsEntity,
	selectChannelById2,
	selectClanMemberMetaUserId,
	selectClanView,
	selectCurrentChannel,
	selectCurrentDM,
	selectDirectMemberMetaUserId,
	selectDmGroupCurrentId,
	selectHashtagDmById,
	selectMembeGroupByUserId,
	selectMemberClanByUserId2,
	selectMemberDMByUserId,
	useAppSelector
} from '@mezon/store';
import { ChannelMembersEntity } from '@mezon/utils';

export const useUserById = (userID: string | undefined): ChannelMembersEntity | undefined => {
	return useAppSelector((state) => {
		if (!userID) return undefined;
		const currentDMId = selectDmGroupCurrentId(state);
		const isClanView = selectClanView(state);
		return isClanView
			? (selectMemberClanByUserId2(state, userID ?? '') as unknown as ChannelMembersEntity)
			: (selectMembeGroupByUserId(state, currentDMId as string, userID as string) as unknown as ChannelMembersEntity);
	});
};

export const useUserMetaById = (userID: string | undefined): any | undefined => {
	return useAppSelector((state) => {
		if (!userID) return undefined;
		const isClanView = selectClanView(state);
		return isClanView
			? (selectClanMemberMetaUserId(state, userID ?? '')?.status as any)
			: (selectDirectMemberMetaUserId(state, userID as string)?.user?.metadata?.user_status as any);
	});
};

export const useUserByUserId = (userID: string | undefined): ChannelMembersEntity | undefined => {
	return useAppSelector((state) => {
		if (!userID) return undefined;
		const isClanView = selectClanView(state);
		return isClanView
			? (selectMemberClanByUserId2(state, userID ?? '') as unknown as ChannelMembersEntity)
			: (selectMemberDMByUserId(state, userID ?? '') as unknown as ChannelMembersEntity);
	});
};

export const useTagById = (tagId: string | undefined): ChannelsEntity | undefined => {
	return useAppSelector((state) => {
		if (!tagId) return undefined;
		const isClanView = selectClanView(state);
		return isClanView
			? (selectChannelById2(state, tagId) as unknown as ChannelsEntity)
			: (selectHashtagDmById(state, tagId) as unknown as ChannelsEntity);
	});
};

export const useCurrentInbox = (): ChannelsEntity | null => {
	return useAppSelector((state) => {
		const isClanView = selectClanView(state);
		return isClanView ? selectCurrentChannel(state) : selectCurrentDM(state);
	});
};
