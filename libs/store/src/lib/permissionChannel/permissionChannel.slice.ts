import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { updateCacheUserChannels } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import { channelMembersActions } from '../channelmembers/channel.members';
import { ensureSession, getMezonCtx } from '../helpers';
import { rolesClanActions } from '../roleclan/roleclan.slice';

type addChannelUsersPayload = {
	channelId: string;
	channelType?: number;
	userIds: string[];
	clanId: string;
};
export const addChannelUsers = createAsyncThunk(
	'channelUsers/addChannelUsers',
	async ({ channelId, channelType, userIds, clanId }: addChannelUsersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.addChannelUsers(mezon.session, channelId, userIds);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (channelId && channelType) {
				await updateCacheUserChannels(mezon, channelId, undefined, userIds);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'channelUsers/addChannelUsers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type removeChannelUsersPayload = {
	channelId: string;
	userId: string;
	clanId?: string;
	channelType?: number;
};

export const removeChannelUsers = createAsyncThunk(
	'channelUsers/removeChannelUsers',
	async ({ channelId, userId, clanId, channelType }: removeChannelUsersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const userIds = [userId];
			const response = await mezon.client.removeChannelUsers(mezon.session, channelId, userIds);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (clanId && channelType) {
				const body = {
					clanId: clanId,
					channelId: channelId,
					noCache: true,
					channelType: channelType ?? 0,
					repace: true
				};
				thunkAPI.dispatch(channelMembersActions.fetchChannelMembers(body));
				await updateCacheUserChannels(mezon, channelId, userId, undefined);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'channelUsers/removeChannelUsers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type addChannelRolesPayload = {
	clanId: string;
	channelId: string;
	channelType?: number;
	roleIds: string[];
};
export const addChannelRoles = createAsyncThunk(
	'channelUsers/addChannelRoles',
	async ({ clanId, channelId, roleIds, channelType }: addChannelRolesPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.addRolesChannelDesc(mezon.session, { channel_id: channelId, role_ids: roleIds });
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			const bodyFetchUsers = {
				clanId: clanId,
				channelId: channelId,
				noCache: true,
				channelType: channelType ?? 0,
				repace: true
			};
			const bodyFetchRoles = {
				clanId: clanId,
				channelId: channelId,
				repace: true,
				noCache: true
			};
			thunkAPI.dispatch(channelMembersActions.fetchChannelMembers(bodyFetchUsers));
			thunkAPI.dispatch(rolesClanActions.fetchRolesClan(bodyFetchRoles));
			return response;
		} catch (error) {
			captureSentryError(error, 'channelUsers/addChannelRoles');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type removeChannelRolePayload = {
	clanId: string;
	channelId: string;
	roleId: string;
	channelType?: number;
};
export const removeChannelRole = createAsyncThunk(
	'channelUsers/removeChannelRole',
	async ({ channelId, clanId, roleId, channelType }: removeChannelRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteRoleChannelDesc(mezon.session, { clan_id: clanId, channel_id: channelId, role_id: roleId });
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			const body = {
				clanId: clanId,
				channelId: channelId,
				noCache: true,
				channelType: channelType ?? 0,
				repace: true
			};
			thunkAPI.dispatch(channelMembersActions.fetchChannelMembers(body));
			const bodyFetchRoles = {
				clanId: clanId,
				channelId: channelId,
				repace: true,
				noCache: true
			};
			thunkAPI.dispatch(rolesClanActions.fetchRolesClan(bodyFetchRoles));
			return response;
		} catch (error) {
			captureSentryError(error, 'channelUsers/removeChannelRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
export const channelUsersActions = { addChannelUsers, removeChannelUsers, addChannelRoles, removeChannelRole };
