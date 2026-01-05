import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChannelUpdatedEvent } from 'mezon-js';
import { channelMembersActions } from '../channelmembers/channel.members';
import { selectRolesByClanId } from '../roleclan/roleclan.slice';
import { getStoreAsync } from '../store';
import type { ChannelsEntity } from './channels.slice';
import { channelsActions } from './channels.slice';
import { listChannelRenderAction } from './listChannelRender.slice';

export const switchPublicToPrivate = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel, userId }: { channel: ChannelUpdatedEvent; userId: string }, thunkAPI) => {
		const clanId = channel.clanId;
		const store = await getStoreAsync();
		const roleInClan = selectRolesByClanId(store.getState(), channel.clanId);
		const hasRoleAccessPrivate = (channel.role_ids || []).some((key) => key in roleInClan);
		const memberAccessPrivate = (channel.userIds || []).some((userId) => userId === userId);
		if (channel.creatorId === userId || hasRoleAccessPrivate || memberAccessPrivate) {
			const userIdsToAdd = [
				...(channel.creatorId ? [channel.creatorId] : []),
				...(channel.role_ids || []).flatMap(
					(roleId) => roleInClan[roleId]?.role_user_list?.role_users?.map((user) => user.id).filter((id): id is string => Boolean(id)) || []
				)
			];

			if (userIdsToAdd.length > 0) {
				thunkAPI.dispatch(
					channelMembersActions.addNewMember({
						channelId: channel.channelId,
						userIds: [...new Set(userIdsToAdd)]
					})
				);
			}

			thunkAPI.dispatch(
				channelsActions.updateChannelPrivateState({
					clanId,
					channelId: channel.channelId,
					channelPrivate: channel.channel_private
				})
			);
			thunkAPI.dispatch(
				listChannelRenderAction.updateChannelInListRender({
					channelId: channel.channelId,
					clanId: channel.clanId as string,
					dataUpdate: { ...channel }
				})
			);
			return false;
		}
		thunkAPI.dispatch(channelsActions.remove({ clanId, channelId: channel.channelId }));
		thunkAPI.dispatch(
			listChannelRenderAction.deleteChannelInListRender({
				channelId: channel.channelId,
				clanId: channel.clanId as string
			})
		);
		return true;
	}
);

export const switchPrivateToPublic = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel }: { channel: ChannelUpdatedEvent }, thunkAPI) => {
		thunkAPI.dispatch(
			channelsActions.updateChannelPrivateState({
				clanId: channel.clanId,
				channelId: channel.channelId,
				channelPrivate: channel.channel_private
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.updateChannelInListRender({
				channelId: channel.channelId,
				clanId: channel.clanId as string,
				dataUpdate: { ...channel }
			})
		);
	}
);

export const addChannelNotExist = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel }: { channel: ChannelUpdatedEvent }, thunkAPI) => {
		thunkAPI.dispatch(
			channelsActions.add({
				clanId: channel.clanId as string,
				channel: {
					...channel,
					active: 1,
					id: channel.channelId,
					type: channel.channelType
				} as ChannelsEntity
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.addChannelToListRender({
				...channel,
				type: channel.channelType,
				clan_name: ''
			})
		);
	}
);

export const addThreadNotExist = createAsyncThunk('channels/switchPublicToPrivate', async ({ thread }: { thread: ChannelUpdatedEvent }, thunkAPI) => {
	thunkAPI.dispatch(listChannelRenderAction.addThreadToListRender({ clanId: thread.clanId, channel: { ...thread, id: thread.channelId } }));
});

export const updateChannelActions = {
	switchPublicToPrivate,
	switchPrivateToPublic,
	addChannelNotExist,
	addThreadNotExist
};
