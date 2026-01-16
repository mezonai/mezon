import { captureSentryError } from '@mezon/logger';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
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
	async ({ channelId, channelType, userIds }: addChannelUsersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.addChannelUsers(mezon.session, BigInt(channelId), userIds.map(BigInt));
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (channelId && channelType) {
				thunkAPI.dispatch(userChannelsActions.addUserChannel({ channelId, userAdds: userIds }));
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
			const userIds = [BigInt(userId)];
			const response = await mezon.client.removeChannelUsers(mezon.session, BigInt(channelId), userIds);
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
			const response = await mezon.client.addRolesChannelDesc(mezon.session, {
				channel_id: BigInt(channelId),
				role_ids: roleIds.map(BigInt)
			});
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
			const response = await mezon.client.deleteRoleChannelDesc(mezon.session, {
				clan_id: BigInt(clanId),
				channel_id: BigInt(channelId),
				role_id: BigInt(roleId)
			});
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
