import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { selectCurrentUserId } from '../account/account.slice';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import { selectChannelByChannelId } from '../channels/channels.slice';
import { listChannelRenderAction } from '../channels/listChannelRender.slice';
import { ensureSession, getMezonCtx } from '../helpers';
import { rolesClanActions } from '../roleclan/roleclan.slice';
import type { RootState } from '../store';

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
				thunkAPI.dispatch(userChannelsActions.addUserChannel({ channelId, userAdds: userIds }));
			}
			if (channelType === ChannelType.CHANNEL_TYPE_THREAD) {
				const userId = selectCurrentUserId(thunkAPI.getState() as RootState);
				if (userId === userIds[0]) {
					const thread = selectChannelByChannelId(thunkAPI.getState(), channelId);
					thunkAPI.dispatch(
						listChannelRenderAction.addThreadToListRender({
							clanId: thread.clan_id || '',
							channel: {
								...thread,
								active: 1
							}
						})
					);
				}
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

export type banChannelUsersPayload = {
	channelId: string;
	userId: string;
	clanId: string;
};

export const removeChannelUsers = createAsyncThunk(
	'channelUsers/removeChannelUsers',
	async ({ channelId, userId }: removeChannelUsersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const userIds = [userId];
			const response = await mezon.client.removeChannelUsers(mezon.session, channelId, userIds);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
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
	async ({ channelId, roleIds, clanId }: addChannelRolesPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.addRolesChannelDesc(mezon.session, { channel_id: channelId, role_ids: roleIds });
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(
				rolesClanActions.addRoleByChannel({
					channelId,
					roleIds,
					clanId
				})
			);
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
	async ({ channelId, clanId, roleId }: removeChannelRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteRoleChannelDesc(mezon.session, { clan_id: clanId, channel_id: channelId, role_id: roleId });
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(rolesClanActions.removeChannelRole({ clanId, channelId, roleId }));

			return response;
		} catch (error) {
			captureSentryError(error, 'channelUsers/removeChannelRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
export const channelUsersActions = { addChannelUsers, removeChannelUsers, addChannelRoles, removeChannelRole };
