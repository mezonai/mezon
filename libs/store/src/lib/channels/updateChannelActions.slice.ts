import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChannelUpdatedEvent } from 'mezon-js';
import { channelMembersActions } from '../channelmembers/channel.members';
import { selectRolesByClanId } from '../roleclan/roleclan.slice';
import { getStoreAsync } from '../store';
import type { ChannelsEntity } from './channels.slice';
import { channelsActions } from './channels.slice';
import { listChannelRenderAction } from './listChannelRender.slice';

const toBigIntStrings = (channel: ChannelUpdatedEvent) => ({
	channel_id: String(channel.channel_id),
	clan_id: String(channel.clan_id),
	category_id: String(channel.category_id),
	creator_id: String(channel.creator_id),
	parent_id: String(channel.parent_id),
	app_id: String(channel.app_id),
	user_ids: channel.user_ids?.map((id) => String(id)),
	role_ids: channel.role_ids?.map((id) => String(id))
});

export const switchPublicToPrivate = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel, userId }: { channel: ChannelUpdatedEvent; userId: bigint }, thunkAPI) => {
		const clanId = channel.clan_id;
		const store = await getStoreAsync();
		const roleInClan = selectRolesByClanId(store.getState(), String(channel.clan_id));
		const hasRoleAccessPrivate = (channel.role_ids || []).some((key) => String(key) in roleInClan);
		const memberAccessPrivate = (channel.user_ids || []).some((user_id) => user_id === userId);
		if (channel.creator_id === userId || hasRoleAccessPrivate || memberAccessPrivate) {
			const userIdsToAdd: string[] = [
				...(channel.creator_id ? [String(channel.creator_id)] : []),
				...(channel.role_ids || []).flatMap(
					(roleId) =>
						(roleInClan[String(roleId)]?.role_user_list?.role_users || [])
							?.map((user) => String(user.id))
							.filter((id) => id !== undefined) || []
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
					clanId: String(channel.clan_id),
					dataUpdate: { ...channel, ...toBigIntStrings(channel) }
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
				dataUpdate: { ...channel, ...toBigIntStrings(channel) }
			})
		);
	}
);

export const addChannelNotExist = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel }: { channel: ChannelUpdatedEvent }, thunkAPI) => {
		thunkAPI.dispatch(
			channelsActions.add({
				clanId: String(channel.clan_id),
				channel: {
					...channel,
					...toBigIntStrings(channel),
					id: String(channel.channel_id),
					active: 1,
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

export const addThreadNotExist = createAsyncThunk('channels/addThreadNotExist', async ({ thread }: { thread: ChannelUpdatedEvent }, thunkAPI) => {
	thunkAPI.dispatch(
		listChannelRenderAction.addThreadToListRender({
			clanId: String(thread.clan_id),
			channel: { ...thread, ...toBigIntStrings(thread), id: String(thread.channel_id), type: thread.channel_type } as ChannelsEntity
		})
	);
});

export const updateChannelActions = {
	switchPublicToPrivate,
	switchPrivateToPublic,
	addChannelNotExist,
	addThreadNotExist
};
