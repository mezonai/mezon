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
		const clanId = channel.clan_id;
		const store = await getStoreAsync();
		const roleInClan = selectRolesByClanId(store.getState(), channel.clan_id);
		const hasRoleAccessPrivate = (channel.role_ids || []).some((key) => key in roleInClan);
		const memberAccessPrivate = (channel.user_ids || []).some((user_id) => user_id === userId);
		if (channel.creator_id === userId || hasRoleAccessPrivate || memberAccessPrivate) {
			const userIdsToAdd = [
				...(channel.creator_id ? [channel.creator_id] : []),
				...(channel.role_ids || []).flatMap(
					(roleId) => roleInClan[roleId]?.role_user_list?.role_users?.map((user) => user.id).filter((id): id is string => Boolean(id)) || []
				)
			];

			if (userIdsToAdd.length > 0) {
				thunkAPI.dispatch(
					channelMembersActions.addNewMember({
						channel_id: channel.channel_id,
						user_ids: [...new Set(userIdsToAdd)]
					})
				);
			}

			thunkAPI.dispatch(
				channelsActions.updateChannelPrivateState({
					clanId,
					channelId: channel.channel_id,
					channelPrivate: channel.channel_private
				})
			);
			thunkAPI.dispatch(
				listChannelRenderAction.updateChannelInListRender({
					channelId: channel.channel_id,
					clanId: channel.clan_id as string,
					dataUpdate: { ...channel }
				})
			);
			return false;
		}
		thunkAPI.dispatch(channelsActions.remove({ clanId, channelId: channel.channel_id }));
		thunkAPI.dispatch(
			listChannelRenderAction.deleteChannelInListRender({
				channelId: channel.channel_id,
				clanId: channel.clan_id as string
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
				clanId: channel.clan_id,
				channelId: channel.channel_id,
				channelPrivate: channel.channel_private
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.updateChannelInListRender({
				channelId: channel.channel_id,
				clanId: channel.clan_id as string,
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
				clanId: channel.clan_id as string,
				channel: {
					...channel,
					active: 1,
					id: channel.channel_id,
					type: channel.channel_type
				} as ChannelsEntity
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.addChannelToListRender({
				...channel,
				type: channel.channel_type,
				clan_name: ''
			})
		);
	}
);

export const addThreadNotExist = createAsyncThunk('channels/switchPublicToPrivate', async ({ thread }: { thread: ChannelUpdatedEvent }, thunkAPI) => {
	thunkAPI.dispatch(listChannelRenderAction.addThreadToListRender({ clanId: thread.clan_id, channel: { ...thread, id: thread.channel_id } }));
});

export const updateChannelActions = {
	switchPublicToPrivate,
	switchPrivateToPublic,
	addChannelNotExist,
	addThreadNotExist
};
