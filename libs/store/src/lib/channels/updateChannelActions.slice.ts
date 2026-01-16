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
	async ({ channel, userId }: { channel: ChannelUpdatedEvent; userId: bigint }, thunkAPI) => {
		const clanId = channel.clan_id;
		const store = await getStoreAsync();
		const roleInClan = selectRolesByClanId(store.getState(), String(channel.clan_id));
		const hasRoleAccessPrivate = (channel.role_ids || []).some((key) => String(key) in roleInClan);
		const memberAccessPrivate = (channel.user_ids || []).some((user_id) => user_id === userId);
		if (channel.creator_id === userId || hasRoleAccessPrivate || memberAccessPrivate) {
			const userIdsToAdd = [
				...(channel.creator_id ? [channel.creator_id] : []),
				...(channel.role_ids || []).flatMap(
					(roleId) =>
						(roleInClan[String(roleId)]?.role_user_list?.role_users || [])?.map((user) => user.id).filter((id) => id !== undefined) || []
				)
			];

			if (userIdsToAdd.length > 0) {
				thunkAPI.dispatch(
					channelMembersActions.addNewMember({
						channel_id: String(channel.channel_id),
						user_ids: userIdsToAdd
					})
				);
			}

			thunkAPI.dispatch(
				channelsActions.updateChannelPrivateState({
					clanId: String(clanId),
					channelId: String(channel.channel_id),
					channelPrivate: channel.channel_private
				})
			);
			thunkAPI.dispatch(
				listChannelRenderAction.updateChannelInListRender({
					channelId: String(channel.channel_id),
					clanId: String(clanId),
					dataUpdate: { ...channel }
				})
			);
			return false;
		}
		thunkAPI.dispatch(channelsActions.remove({ clanId: String(clanId), channelId: String(channel.channel_id) }));
		thunkAPI.dispatch(
			listChannelRenderAction.deleteChannelInListRender({
				channelId: String(channel.channel_id),
				clanId: String(clanId)
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
				clanId: String(channel.clan_id),
				channelId: String(channel.channel_id),
				channelPrivate: channel.channel_private
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.updateChannelInListRender({
				channelId: String(channel.channel_id),
				clanId: String(channel.clan_id),
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
				clanId: String(channel.channel_id),
				channel: {
					...channel,
					active: 1,
					id: String(channel.channel_id),
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
	thunkAPI.dispatch(
		listChannelRenderAction.addThreadToListRender({ clanId: String(thread.clan_id), channel: { ...thread, id: String(thread.channel_id) } })
	);
});

export const updateChannelActions = {
	switchPublicToPrivate,
	switchPrivateToPublic,
	addChannelNotExist,
	addThreadNotExist
};
