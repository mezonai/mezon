import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChannelUpdatedEvent } from 'mezon-js';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import { channelMembersActions } from '../channelmembers/channel.members';
import { USERS_CLANS_FEATURE_KEY } from '../clanMembers/clan.members';
import { ensureSession, getMezonCtx } from '../helpers';
import { rolesClanActions, selectRolesByClanId } from '../roleclan/roleclan.slice';
import { getStoreAsync } from '../store';
import { selectVoiceInfo, voiceActions } from '../voice/voice.slice';
import { listChannelsByUserActions } from './channelUser.slice';
import { channelMetaActions } from './channelmeta.slice';
import type { ChannelsEntity } from './channels.slice';
import { channelsActions } from './channels.slice';

// ListClanUsers returns only the newest members, so an early joiner of a large clan may be missing from
// the store: ask the server for this user's roles instead. undefined when that request fails.
const fetchOwnRoleIds = async (thunkAPI: Parameters<typeof getMezonCtx>[0], clanId: string) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.GetRoleOfUserInTheClan(mezon.session, clanId);
		return (response?.roles || []).map((role) => role.id).filter((id): id is string => Boolean(id));
	} catch {
		return undefined;
	}
};

export const switchPublicToPrivate = createAsyncThunk(
	'channels/switchPublicToPrivate',
	async ({ channel, userId }: { channel: ChannelUpdatedEvent; userId: string }, thunkAPI) => {
		const clanId = channel.clan_id;
		thunkAPI.dispatch(userChannelsActions.invalidateUserChannel(channel.channel_id));
		const store = await getStoreAsync();
		const roleInClan = selectRolesByClanId(store.getState(), channel.clan_id);
		const memberAccessPrivate = (channel.user_ids || []).some((user_id) => user_id === userId);
		const channelRoleIds = channel.role_ids || [];
		let hasRoleAccessPrivate = false;
		if (channelRoleIds.length && channel.creator_id !== userId && !memberAccessPrivate) {
			// Access comes from holding one of the roles, not from the role existing in the clan.
			const self = store.getState()[USERS_CLANS_FEATURE_KEY].byClans[clanId]?.entities.entities[userId];
			const ownRoleIds = self ? (self.role_id ?? []) : await fetchOwnRoleIds(thunkAPI, clanId);
			hasRoleAccessPrivate =
				ownRoleIds === undefined ||
				channelRoleIds.some(
					(roleId) => ownRoleIds.includes(roleId) || !!roleInClan[roleId]?.role_user_list?.role_users?.some((user) => user.id === userId)
				);
		}
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

			if (channel.role_ids && channel.role_ids.length) {
				thunkAPI.dispatch(
					rolesClanActions.addRoleByChannel({
						roleIds: channel.role_ids,
						channelId: channel.channel_id,
						clanId
					})
				);
			}
			return false;
		}
		const isVoiceJoined = selectVoiceInfo(store.getState());
		if (isVoiceJoined?.channelId === channel.channel_id) {
			//Leave Room If It's been deleted
			thunkAPI.dispatch(voiceActions.resetVoiceControl());
		}
		thunkAPI.dispatch(channelsActions.remove({ clanId, channelId: channel.channel_id }));
		thunkAPI.dispatch(listChannelsByUserActions.remove(channel.channel_id));
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
		thunkAPI.dispatch(channelMembersActions.switchChannelOutPrivate(channel.channel_id));
		thunkAPI.dispatch(userChannelsActions.invalidateUserChannel(channel.channel_id));
		thunkAPI.dispatch(rolesClanActions.removeAllRolesFromChannel({ clanId: channel.clan_id, channelId: channel.channel_id }));
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
	}
);

export const addThreadNotExist = createAsyncThunk('channels/switchPublicToPrivate', async ({ thread }: { thread: ChannelUpdatedEvent }, thunkAPI) => {
	thunkAPI.dispatch(
		channelsActions.upsertOne({
			clanId: thread.clan_id as string,
			channel: { ...thread, id: thread.channel_id, type: thread.channel_type } as ChannelsEntity
		})
	);
	thunkAPI.dispatch(
		channelMetaActions.add({
			id: thread.channel_id || '',
			clanId: thread.clan_id,
			senderId: '0',
			lastSentTimestamp: Date.now() / 1000,
			lastSeenTimestamp: 0,
			isMute: false
		})
	);
});

export const updateChannelActions = {
	switchPublicToPrivate,
	switchPrivateToPublic,
	addChannelNotExist,
	addThreadNotExist
};
