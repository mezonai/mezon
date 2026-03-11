import type { ChannelsEntity } from '@mezon/store';
import {
	getStore,
	selectChannelById,
	selectClanView,
	selectCurrentChannel,
	selectCurrentDM,
	selectDmGroupCurrentId,
	selectMemberClanByUserId,
	selectMemberDMByUserId,
	selectMemberGroupByUserId,
	useAppSelector
} from '@mezon/store';
import type { ChannelMembersEntity } from '@mezon/utils';

export const useUserById = (userID: string | undefined): ChannelMembersEntity | undefined => {
	return useAppSelector((state) => {
		if (!userID) return undefined;
		const currentDMId = selectDmGroupCurrentId(state);
		const isClanView = selectClanView(state);
		if (!isClanView) {
			return selectMemberGroupByUserId(state, currentDMId as string, userID as string) as unknown as ChannelMembersEntity;
		} else {
			return selectMemberClanByUserId(state, userID ?? '') as unknown as ChannelMembersEntity;
		}
	});
};

export const useUserByUserId = (userID: string | undefined): ChannelMembersEntity | undefined => {
	return useAppSelector((state) => {
		if (!userID) return undefined;
		const isClanView = selectClanView(state);
		return isClanView
			? (selectMemberClanByUserId(state, userID ?? '') as unknown as ChannelMembersEntity)
			: (selectMemberDMByUserId(state, userID ?? '') as unknown as ChannelMembersEntity);
	});
};

export const getTagById = (tagId: string | undefined): ChannelsEntity | undefined => {
	const store = getStore();
	if (!tagId) return undefined;
	return selectChannelById(store.getState(), tagId) || undefined;
};

export const useCurrentInbox = (): ChannelsEntity | null => {
	return useAppSelector((state) => {
		const isClanView = selectClanView(state);
		return isClanView ? selectCurrentChannel(state) : selectCurrentDM(state);
	});
};
