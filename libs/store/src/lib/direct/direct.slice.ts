import { captureSentryError } from '@mezon/logger';
import type { BuzzArgs, IChannel, IMessage, IUserChannel, IUserProfileActivity, LoadingStatus } from '@mezon/utils';
import { ActiveDm } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelMessage, ChannelUpdatedEvent, UserProfileRedis } from 'mezon-js';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiChannelMessageHeader, ApiCreateChannelDescRequest, ApiDeleteChannelDescRequest } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { selectAllAccount } from '../account/account.slice';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import type { StatusUserArgs } from '../channelmembers/channel.members';
import { channelMembersActions } from '../channelmembers/channel.members';
import { channelsActions, fetchChannelsCached } from '../channels/channels.slice';
import { hashtagDmActions } from '../channels/hashtagDm.slice';
import { ensureSession, ensureSocket, getMezonCtx, withRetry } from '../helpers';
import type { MessagesEntity } from '../messages/messages.slice';
import { messagesActions } from '../messages/messages.slice';
import type { RootState } from '../store';
import { statusActions } from './status.slice';

export const DIRECT_FEATURE_KEY = 'direct';

export interface DirectEntity extends IChannel {
	id: string;
	showPinBadge?: boolean;
}

export type DMMetaEntity = DirectEntity;

export interface DirectState extends EntityState<DirectEntity, string> {
	loadingStatus: LoadingStatus;
	socketStatus: LoadingStatus;
	error?: string | null;
	currentDirectMessageId?: string | null;
	currentDirectMessageType?: number;
	statusDMChannelUnread: Record<string, boolean>;
	buzzStateDirect: Record<string, BuzzArgs | null>;
	updateDmGroupLoading: Record<string, boolean>;
	updateDmGroupError: Record<string, string | null>;
}

export interface DirectRootState {
	[DIRECT_FEATURE_KEY]: DirectState;
}

export const directAdapter = createEntityAdapter<DirectEntity>();

export const mapDmGroupToEntity = (channelRes: ApiChannelDescription, existingEntity?: DirectEntity) => {
	const mapped = { ...channelRes, id: channelRes.channel_id || '' };
	if (existingEntity?.channel_avatar && !mapped.channel_avatar) {
		mapped.channel_avatar = existingEntity.channel_avatar;
	} else if (!mapped.channel_avatar) {
		mapped.channel_avatar = 'assets/images/avatar-group.png';
	}

	return mapped;
};

export const fetchDirectDetail = createAsyncThunk('direct/fetchDirectDetail', async ({ directId }: { directId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await withRetry(() => mezon.client.listChannelDetail(mezon.session, directId), {
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'dm-detail'
		});

		return mapDmGroupToEntity(response);
	} catch (error) {
		captureSentryError(error, 'direct/fetchDirectDetail');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createNewDirectMessage = createAsyncThunk(
	'direct/createNewDirectMessage',
	async (
		{
			body,
			username,
			avatar,
			display_names
		}: { body: ApiCreateChannelDescRequest; display_names?: string | string[]; username?: string | string[]; avatar?: string | string[] },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.createChannelDesc(mezon.session, body);
			if (response) {
				thunkAPI.dispatch(
					directActions.upsertOne({
						id: response.channel_id || '',
						...response,
						usernames: Array.isArray(username) ? username : username ? [username] : [],
						display_names: Array.isArray(display_names) ? display_names : display_names ? [display_names] : [],
						channel_label:
							response.channel_label ||
							(Array.isArray(display_names) ? display_names.join(',') : Array.isArray(username) ? username.join(',') : ''),
						channel_avatar: response.channel_avatar || 'assets/images/avatar-group.png',
						avatars: Array.isArray(avatar) ? avatar : avatar ? [avatar] : [],
						user_ids: body.user_ids,
						active: 1,
						last_sent_message: {
							timestamp_seconds: Date.now()
						}
					})
				);

				await thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: '0',
						channelId: response.channel_id as string,
						channelType: response.type as number,
						isPublic: false
					})
				);

				return response;
			} else {
				captureSentryError('no response', 'direct/createNewDirectMessage');
				return thunkAPI.rejectWithValue('no reponse');
			}
		} catch (error) {
			captureSentryError(error, 'direct/createNewDirectMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const closeDirectMessage = createAsyncThunk('direct/closeDirectMessage', async (body: ApiDeleteChannelDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.closeDirectMess(mezon.session, body);
		if (response) {
			thunkAPI.dispatch(directActions.setDmActiveStatus({ dmId: body.channel_id as string, isActive: false }));
			return response;
		} else {
			captureSentryError('no reponse', 'direct/createNewDirectMessage');
			return thunkAPI.rejectWithValue('no reponse');
		}
	} catch (error) {
		captureSentryError(error, 'direct/closeDirectMessage');
		return thunkAPI.rejectWithValue(error);
	}
});

export const openDirectMessage = createAsyncThunk(
	'direct/openDirectMessage',
	async ({ channelId, clanId }: { channelId: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const dmChannel = selectDirectById(state, channelId) || {};
			if (dmChannel?.active !== ActiveDm.OPEN_DM && clanId === '0') {
				await mezon.client.openDirectMess(mezon.session, { channel_id: channelId });
			}
		} catch (error) {
			captureSentryError(error, 'direct/openDirectMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type fetchDmGroupArgs = {
	cursor?: string;
	limit?: number;
	forward?: number;
	channelType?: number;
	noCache?: boolean;
};

export const fetchDirectMessage = createAsyncThunk(
	'direct/fetchDirectMessage',
	async ({ channelType = ChannelType.CHANNEL_TYPE_GROUP, noCache }: fetchDmGroupArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchChannelsCached(thunkAPI.getState as () => RootState, mezon, 500, 1, '', channelType, noCache);
			if (!response.channeldesc) {
				thunkAPI.dispatch(directActions.setAll([]));
				return [];
			}
			if (Date.now() - response.time < 100) {
				const listStatusUnreadDM = response.channeldesc.map((channel) => {
					const status = getStatusUnread(
						Number(channel.last_seen_message?.timestamp_seconds),
						Number(channel.last_sent_message?.timestamp_seconds)
					);
					return { dmId: channel.channel_id ?? '', isUnread: status };
				});
				thunkAPI.dispatch(directActions.setAllStatusDMUnread(listStatusUnreadDM));
			}

			if (response.fromCache) {
				return [];
			}
			const state = thunkAPI.getState() as RootState;
			const existingEntities = selectAllDirectMessages(state);
			const userProfile = selectAllAccount(state)?.user;
			const listDM: IUserChannel[] = [];
			const sorted = response.channeldesc.sort((a: ApiChannelDescription, b: ApiChannelDescription) => {
				if (
					a === undefined ||
					b === undefined ||
					a.last_sent_message === undefined ||
					a.last_seen_message?.id === undefined ||
					b.last_sent_message === undefined ||
					b.last_seen_message?.id === undefined
				) {
					return 0;
				}
				if (a.last_sent_message.id && b.last_sent_message.id && a.last_sent_message.id < b.last_sent_message.id) {
					return 1;
				}

				return -1;
			});

			response.channeldesc.map((channel: ApiChannelDescription) => {
				if (channel.type === ChannelType.CHANNEL_TYPE_DM) {
					listDM.push({
						id: channel.channel_id || '',
						channel_id: channel.channel_id || '',
						avatars: [userProfile?.avatar_url || '', channel.avatars?.[0] || ''],
						display_names: [userProfile?.display_name || '', channel.display_names?.[0] || ''],
						usernames: [userProfile?.username || '', channel.usernames?.[0] || ''],
						onlines: [true, !!channel?.onlines?.[0]],
						user_ids: [userProfile?.id || '', channel.user_ids?.[0] || '']
					});
				}
			});

			const channels = sorted.map((channelRes) => {
				const existingEntity = existingEntities.find((entity) => entity.id === channelRes.channel_id);
				return mapDmGroupToEntity(channelRes, existingEntity);
			});
			thunkAPI.dispatch(directActions.setDirectMetaEntities(channels));
			thunkAPI.dispatch(directActions.setAll(channels));
			thunkAPI.dispatch(userChannelsActions.upsertMany(listDM));
			const users = mapChannelsToUsers(sorted);
			thunkAPI.dispatch(statusActions.updateBulkStatus(users));
			return channels;
		} catch (error) {
			captureSentryError(error, 'direct/fetchDirectMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const getDmEntityByChannelId = createAsyncThunk('channels/getChannelEntityById', async ({ channelId }: { channelId: string }, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const channelEntity = state?.direct?.entities?.[channelId];
		return channelEntity ?? null;
	} catch (error) {
		captureSentryError(error, 'channels/getChannelEntityById');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateDmGroup = createAsyncThunk(
	'direct/updateDmGroup',
	async (body: { channel_id: string; channel_label?: string; channel_avatar?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const state = thunkAPI.getState() as RootState;
			const current = state?.direct?.entities?.[body.channel_id];
			const updatePayload: any = {};
			if (typeof body.channel_label !== 'undefined') {
				updatePayload.channel_label = body.channel_label;
			} else if (typeof current?.channel_label !== 'undefined') {
				updatePayload.channel_label = current.channel_label;
			}
			if (typeof body.channel_avatar !== 'undefined') {
				updatePayload.channel_avatar = body.channel_avatar;
			} else if (typeof current?.channel_avatar !== 'undefined') {
				updatePayload.channel_avatar = current.channel_avatar;
			}

			const response = await mezon.client.updateChannelDesc(mezon.session, body.channel_id, updatePayload);

			if (response) {
				thunkAPI.dispatch(
					directActions.updateOne({
						channel_id: body.channel_id,
						...(typeof body.channel_label !== 'undefined' ? { channel_label: body.channel_label } : {}),
						...(typeof body.channel_avatar !== 'undefined' ? { channel_avatar: body.channel_avatar } : {})
					})
				);
			}

			return response;
		} catch (error) {
			captureSentryError(error, 'direct/updateDmGroup');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

function mapChannelsToUsers(channels: ApiChannelDescription[]): IUserProfileActivity[] {
	const userList: IUserProfileActivity[] = [];
	channels.map((channel) => {
		if (channel.type === ChannelType.CHANNEL_TYPE_DM) {
			userList.push({
				id: channel.user_ids?.[0] || '',
				avatar_url: channel.avatars?.[0],
				online: channel.onlines?.[0],
				display_name: channel.display_names?.[0],
				username: channel.usernames?.[0]
			});
		}
	});
	return userList;
}

interface JoinDirectMessagePayload {
	directMessageId: string;
	channelName?: string;
	type?: number;
	noCache?: boolean;
	isFetchingLatestMessages?: boolean;
	isClearMessage?: boolean;
}
interface members {
	user_id?: string;
}

export type StatusDMUnreadArgs = {
	dmId: string;
	isUnread: boolean;
};

export const joinDirectMessage = createAsyncThunk<void, JoinDirectMessagePayload>(
	'direct/joinDirectMessage',
	async ({ directMessageId, type, noCache = false, isFetchingLatestMessages = false, isClearMessage = false }, thunkAPI) => {
		try {
			if (directMessageId !== '') {
				thunkAPI.dispatch(directActions.setDmGroupCurrentId(directMessageId));
				thunkAPI.dispatch(directActions.setDmGroupCurrentType(type ?? ChannelType.CHANNEL_TYPE_DM));
				thunkAPI.dispatch(
					messagesActions.fetchMessages({
						clanId: '0',
						channelId: directMessageId,
						isFetchingLatestMessages,
						isClearMessage
					})
				);

				// TODO: update e2ee later gg
				thunkAPI
					.dispatch(
						channelMembersActions.fetchChannelMembers({
							clanId: '',
							channelId: directMessageId,
							channelType: ChannelType.CHANNEL_TYPE_CHANNEL,
							noCache
						})
					)
					.then((data) => {
						const members = (data.payload as any)?.channel_users as members[];
						if (type === ChannelType.CHANNEL_TYPE_DM && members?.length > 0) {
							const userIds = members.map((member) => member?.user_id as string);
							thunkAPI.dispatch(hashtagDmActions.fetchHashtagDm({ userIds, directId: directMessageId }));
						}
					});
			}
			thunkAPI.dispatch(
				channelsActions.joinChat({
					clanId: '0',
					channelId: directMessageId,
					channelType: type ?? 0,
					isPublic: false
				})
			);
		} catch (error) {
			captureSentryError(error, 'direct/joinDirectMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const mapMessageToConversation = (message: ChannelMessage): DirectEntity => {
	return {
		id: message.channel_id,
		clan_id: '0',
		parent_id: '0',
		channel_id: message.channel_id,
		category_id: '0',
		type: message?.mode === ChannelStreamMode.STREAM_MODE_GROUP ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM,
		creator_id: message.sender_id,
		channel_label: message.display_name || message.username,
		channel_private: 1,
		channel_avatar: message.avatar,
		avatars: [message.avatar as string],
		user_ids: [message.sender_id],
		last_sent_message: {
			id: message.id,
			timestamp_seconds: message.create_time_seconds,
			sender_id: message.sender_id,
			content: JSON.stringify(message.content),
			attachment: message?.attachments ? JSON.stringify(message?.attachments) : '[]',
			reference: '[]',
			mention: '[]',
			reaction: '[]'
		},
		last_seen_message: {
			id: message.id,
			timestamp_seconds: message.create_time_seconds ? message.create_time_seconds - 1 : undefined
		},
		onlines: [true],
		active: ActiveDm.OPEN_DM,
		usernames: [message.username as string],
		display_names: [message.display_name as string],
		creator_name: message.username as string,
		create_time_seconds: message.create_time_seconds,
		update_time_seconds: message.create_time_seconds
	};
};

export const addDirectByMessageWS = createAsyncThunk('direct/addDirectByMessageWS', async (message: IMessage, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const existingDirect = selectDirectById(state, message.channel_id);

		const directEntity = mapMessageToConversation(message);
		if (!existingDirect) {
			thunkAPI.dispatch(directActions.upsertOne({ ...directEntity, active: 1 }));
			return directEntity;
		} else {
			thunkAPI.dispatch(directActions.updateMoreData({ ...directEntity, active: 1 }));
		}

		return null;
	} catch (error) {
		captureSentryError(error, 'direct/addDirectByMessageWS');
		return thunkAPI.rejectWithValue(error);
	}
});

interface AddGroupUserWSPayload {
	channel_desc: ApiChannelDescription;
	users: UserProfileRedis[];
}

export const addGroupUserWS = createAsyncThunk('direct/addGroupUserWS', async (payload: AddGroupUserWSPayload, thunkAPI) => {
	try {
		const { channel_desc, users } = payload;
		const userIds: string[] = [];
		const usernames: string[] = [];
		const avatars: string[] = [];
		const onlines: boolean[] = [];
		const label: string[] = [];

		for (const user of users) {
			userIds.push(user.user_id);
			usernames.push(user.username);
			avatars.push(user.avatar);
			onlines.push(user.online);
			label.push(user.display_name);
		}

		const state = thunkAPI.getState() as RootState;
		const existingEntity = selectAllDirectMessages(state).find((entity) => entity.id === channel_desc.channel_id);

		const directEntity: DirectEntity = {
			...channel_desc,
			id: channel_desc.channel_id || '',
			user_ids: userIds,
			usernames,
			display_names: label,
			channel_avatar: channel_desc.channel_avatar || 'assets/images/avatar-group.png',
			avatars,
			onlines,
			active: 1,
			channel_label: existingEntity?.channel_label || label.toString(),
			topic: channel_desc.topic || existingEntity?.topic,
			member_count: channel_desc.member_count
		};
		thunkAPI.dispatch(
			userChannelsActions.update({
				id: channel_desc.channel_id || '',
				changes: {
					avatars,
					display_names: label,
					id: channel_desc.channel_id,
					onlines,
					usernames,
					user_ids: userIds,
					channel_id: channel_desc.channel_id
				}
			})
		);
		thunkAPI.dispatch(directActions.upsertOne(directEntity));

		return directEntity;
	} catch (error) {
		captureSentryError(error, 'direct/addGroupUserWS');
		return thunkAPI.rejectWithValue(error);
	}
});

export const follower = createAsyncThunk('direct/follower', async (_, thunkAPI) => {
	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		await mezon.socketRef.current?.follower();
	} catch (error) {
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialDirectState: DirectState = directAdapter.getInitialState({
	loadingStatus: 'not loaded',
	socketStatus: 'not loaded',
	error: null,
	statusDMChannelUnread: {},
	buzzStateDirect: {},
	updateDmGroupLoading: {},
	updateDmGroupError: {}
});

export const directSlice = createSlice({
	name: DIRECT_FEATURE_KEY,
	initialState: initialDirectState,
	reducers: {
		remove: directAdapter.removeOne,
		upsertOne: (state, action: PayloadAction<DirectEntity>) => {
			const { entities } = state;
			const existLabel = entities[action.payload.id]?.channel_label?.split(',');
			const existingShowPinBadge = entities[action.payload.id]?.showPinBadge;
			const dataUpdate = action.payload;
			if (existLabel && existLabel?.length <= 1) {
				dataUpdate.channel_label = entities[action.payload.id]?.channel_label;
			}

			if (existingShowPinBadge !== undefined) {
				dataUpdate.showPinBadge = existingShowPinBadge;
			}
			directAdapter.upsertOne(state, dataUpdate);
		},
		update: directAdapter.updateOne,
		setAll: (state, action) => {
			const entitiesWithPreservedBadges = action.payload.map((newEntity: DirectEntity) => {
				const existingEntity = state.entities[newEntity.id];
				return {
					...newEntity,
					showPinBadge: existingEntity?.showPinBadge || newEntity.showPinBadge
				};
			});
			directAdapter.setAll(state, entitiesWithPreservedBadges);
		},
		updateOne: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
			if (!action.payload?.channel_id) return;
			const { channel_id, creator_id: _creator_id, currentUserId: _currentUserId, ...changes } = action.payload;
			directAdapter.updateOne(state, {
				id: channel_id,
				changes
			});
		},
		updateE2EE: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
			if (!action.payload?.channel_id) return;
			const { creator_id, channel_id, e2ee } = action.payload;
			const notCurrentUser = action.payload?.currentUserId !== creator_id;
			const existingDirect = state.entities[channel_id];
			const showE2EEToast = existingDirect && existingDirect.e2ee !== e2ee && notCurrentUser;
			if (showE2EEToast) {
				// TODO: This toast needs i18n but it's in Redux slice, need to handle differently
				toast.info(existingDirect.usernames + (e2ee === 1 ? ' enabled E2EE' : ' disabled E2EE'), {
					closeButton: true
				});
			}
			directAdapter.updateOne(state, {
				id: channel_id,
				changes: {
					e2ee
				}
			});
		},
		removeGroupMember: (state, action: PayloadAction<{ userId: string; currentUserId: string; channelId: string }>) => {
			const currentDirect = state.entities[action.payload.channelId];
			directAdapter.updateOne(state, {
				id: action.payload.channelId,
				changes: {
					member_count: (currentDirect.member_count || 0) > 0 ? (currentDirect.member_count || 1) - 1 : 0
				}
			});
		},
		changeE2EE: (state, action: PayloadAction<Partial<ChannelUpdatedEvent>>) => {
			if (!action.payload?.channel_id) return;
			directAdapter.updateOne(state, {
				id: action.payload.channel_id,
				changes: {
					...action.payload
				}
			});
		},
		setDmGroupCurrentId: (state, action: PayloadAction<string>) => {
			state.currentDirectMessageId = action.payload;
		},
		setDmGroupCurrentType: (state, action: PayloadAction<number>) => {
			state.currentDirectMessageType = action.payload;
		},
		setAllStatusDMUnread: (state, action: PayloadAction<StatusDMUnreadArgs[]>) => {
			for (const i of action.payload) {
				state.statusDMChannelUnread[i.dmId] = i.isUnread;
			}
		},
		removeByDirectID: (state, action: PayloadAction<string>) => {
			directAdapter.removeOne(state, action.payload);
		},
		setActiveDirect: (state, action: PayloadAction<{ directId: string }>) => {
			const existingDirect = state.entities[action.payload.directId];
			if (existingDirect && existingDirect.active !== 1) {
				directAdapter.updateOne(state, {
					id: action.payload.directId,
					changes: {
						active: 1
					}
				});
			}
		},

		updateStatusByUserId: (state, action: PayloadAction<StatusUserArgs[]>) => {
			const { ids, entities } = state;
			const statusUpdates = action.payload;

			for (const { userId, online } of statusUpdates) {
				for (let index = 0; index < ids?.length; index++) {
					const item = entities?.[ids[index]];
					if (!item) continue;

					const userIndex = item.user_ids?.indexOf(userId);
					if (userIndex === -1 || userIndex === undefined) continue;

					const currentStatusOnlines = item.onlines || [];
					const updatedStatusOnlines = [...currentStatusOnlines];
					updatedStatusOnlines[userIndex] = online;

					directAdapter.updateOne(state, {
						id: item.id,
						changes: {
							onlines: updatedStatusOnlines
						}
					});
				}
			}
		},
		setBuzzStateDirect: (state, action: PayloadAction<{ channelId: string; buzzState: BuzzArgs | null }>) => {
			state.buzzStateDirect[action.payload.channelId] = action.payload.buzzState;
		},
		setShowPinBadgeOfDM: (state, action: PayloadAction<{ dmId: string; isShow: boolean }>) => {
			const { dmId, isShow } = action.payload;
			if (!state.entities?.[dmId]) return;
			state.entities[dmId].showPinBadge = isShow;
		},
		addMemberDmGroup: (state, action: PayloadAction<DirectEntity>) => {
			const dmGroup = state.entities?.[action.payload.channel_id as string];
			if (dmGroup) {
				const existingChannelAvatar = dmGroup.channel_avatar;

				dmGroup.user_ids = [...(dmGroup.user_ids ?? []), ...(action.payload.user_ids ?? [])];
				dmGroup.usernames = [...(dmGroup.usernames ?? []), ...(action.payload.usernames ?? [])];
				dmGroup.avatars = [...(dmGroup.avatars ?? []), ...(action.payload.avatars ?? [])];
				dmGroup.channel_avatar = action.payload.channel_avatar ?? '';
				if (existingChannelAvatar && !action.payload.channel_avatar) {
					dmGroup.channel_avatar = existingChannelAvatar;
				}
			}
		},
		updateMemberDMGroup: (
			state,
			action: PayloadAction<{ dmId: string; user_id: string; avatar: string; display_name: string; about_me?: string }>
		) => {
			const { dmId, user_id, avatar, display_name, about_me } = action.payload;
			const dmGroup = state.entities?.[dmId];

			if (!dmGroup || !user_id) return;

			const index = (dmGroup.user_ids ??= []).indexOf(user_id);
			if (index === -1) return;

			if (avatar && dmGroup.channel_avatar) dmGroup.channel_avatar = avatar;

			if (display_name && dmGroup.display_names) {
				if (dmGroup.channel_label) {
					const labels = dmGroup.channel_label.split(',');
					if (labels[index] === dmGroup.display_names[index]) labels[index] = display_name;
					dmGroup.channel_label = labels.join(',');
				}
				dmGroup.display_names[index] = display_name;
			}
		},
		setDmActiveStatus: (state, action: PayloadAction<{ dmId: string; isActive: boolean }>) => {
			const { dmId, isActive } = action.payload;
			const dmGroup = state.entities?.[dmId];
			if (!dmGroup) return;
			state.entities[dmId].active = isActive ? 1 : 0;
		},
		addBadgeDirect: (state, action: PayloadAction<{ channelId: string }>) => {
			const channelId = action.payload.channelId;
			const currentBadge = state.entities[channelId]?.count_mess_unread || 0;
			if (currentBadge !== currentBadge + 1) {
				directAdapter.updateOne(state, {
					id: channelId,
					changes: {
						count_mess_unread: currentBadge + 1
					}
				});
			}
		},
		removeBadgeDirect: (state, action: PayloadAction<{ channelId: string }>) => {
			const currentBadge = state.entities[action.payload.channelId]?.count_mess_unread || 0;
			if (currentBadge) {
				directAdapter.updateOne(state, {
					id: action.payload.channelId,
					changes: {
						count_mess_unread: 0
					}
				});
			}
		},
		updateMoreData: (state, action: PayloadAction<DirectEntity>) => {
			const data = action.payload;
			const channelId = data?.channel_id || data.id;
			const currentData = state.entities[channelId];
			if (!currentData) return;

			const changes: Partial<DirectEntity> = {};
			const timestamp = Math.floor(Date.now() / 1000);

			if (data?.last_sent_message) {
				changes.last_sent_message = {
					...(currentData?.last_sent_message ?? {}),
					...data?.last_sent_message,
					timestamp_seconds: timestamp
				};
			}

			if (data?.clan_id === '0' && currentData?.active !== ActiveDm.OPEN_DM) {
				changes.active = ActiveDm.OPEN_DM;
			}

			if (data?.update_time_seconds) {
				changes.update_time_seconds = data?.update_time_seconds;
			}

			if (currentData?.type === ChannelType.CHANNEL_TYPE_GROUP) {
				if (data?.display_names) changes.display_names = data?.display_names;
				if (data?.usernames) changes.usernames = data?.usernames;
				if (data?.user_ids) changes.user_ids = data?.user_ids;
			}

			directAdapter.updateOne(state, {
				id: channelId,
				changes
			});
		},
		setCountMessUnread: (state, action: PayloadAction<{ channelId: string; isMention?: boolean; count?: number; isReset?: boolean }>) => {
			const { channelId, isMention = false, count = 1, isReset = false } = action.payload;
			const entity = state.entities[channelId];
			if (entity?.is_mute !== true || isMention === true) {
				const newCountMessUnread = isReset ? 0 : (entity?.count_mess_unread || 0) + count;
				const finalCount = Math.max(0, newCountMessUnread);
				directAdapter.updateOne(state, {
					id: channelId,
					changes: {
						count_mess_unread: finalCount
					}
				});
			}
		},
		setDirectLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; messageId?: string }>) => {
			const { channelId, timestamp, messageId } = action.payload;
			const entity = state.entities[channelId];
			const lastSeenMessage: ApiChannelMessageHeader = {
				...((entity?.last_seen_message as ApiChannelMessageHeader) || {}),
				timestamp_seconds: Math.floor(timestamp)
			};
			if (messageId) {
				lastSeenMessage.id = messageId;
			}

			directAdapter.updateOne(state, {
				id: channelId,
				changes: {
					count_mess_unread: 0,
					last_seen_message: lastSeenMessage
				}
			});
		},
		updateLastSeenTime: (state, action: PayloadAction<MessagesEntity>) => {
			const payload = action.payload;
			const entity = state.entities[payload.channel_id];
			if (entity?.last_seen_message?.id === payload.id) {
				return;
			}

			const timestamp = Math.floor(Date.now() / 1000);
			directAdapter.updateOne(state, {
				id: payload.channel_id,
				changes: {
					last_seen_message: {
						content: payload.content,
						id: payload.id,
						sender_id: payload.sender_id,
						timestamp_seconds: timestamp
					} as ApiChannelMessageHeader,
					count_mess_unread: 0
				}
			});
		},
		setDirectMetaEntities: (state, action: PayloadAction<IChannel[]>) => {
			const channels = action.payload;
			if (channels) {
				for (const ch of channels) {
					const entity = state.entities[ch.channel_id || ''];
					if (entity) {
						const changes: Partial<DirectEntity> = {};
						if (ch.last_seen_message) {
							changes.last_seen_message = ch.last_seen_message;
						}
						if (ch.last_sent_message) {
							changes.last_sent_message = ch.last_sent_message;
						}
						if (Object.keys(changes).length > 0) {
							directAdapter.updateOne(state, {
								id: ch.channel_id || '',
								changes
							});
						}
					}
				}
			}
		},
		updateMuteDM: (state, action: PayloadAction<{ channelId: string; isMute: boolean }>) => {
			const payload = action.payload;
			directAdapter.updateOne(state, {
				id: payload.channelId,
				changes: {
					is_mute: payload.isMute
				}
			});
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDirectMessage.pending, (state: DirectState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchDirectMessage.fulfilled, (state: DirectState, action: PayloadAction<IChannel[]>) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchDirectMessage.rejected, (state: DirectState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(updateDmGroup.pending, (state: DirectState, action) => {
				const channelId = action.meta.arg.channel_id;
				state.updateDmGroupLoading[channelId] = true;
				state.updateDmGroupError[channelId] = null;
			})
			.addCase(updateDmGroup.fulfilled, (state: DirectState, action) => {
				const channelId = action.meta.arg.channel_id;
				state.updateDmGroupLoading[channelId] = false;
				state.updateDmGroupError[channelId] = null;
				// TODO: This toast needs i18n but it's in Redux slice, need to handle differently
				toast.success('Group updated successfully!');
			})
			.addCase(updateDmGroup.rejected, (state: DirectState, action) => {
				const channelId = action.meta.arg.channel_id;
				state.updateDmGroupLoading[channelId] = false;
				state.updateDmGroupError[channelId] = action.error.message || 'Failed to update group';
				// TODO: This toast needs i18n but it's in Redux slice, need to handle differently
				toast.error(action.error.message || 'Failed to update group');
			})
			.addCase(fetchDirectDetail.fulfilled, (state: DirectState, action) => {
				directAdapter.upsertOne(state, action.payload);
			});
	}
});

export const directReducer = directSlice.reducer;

export const directActions = {
	...directSlice.actions,
	fetchDirectMessage,
	updateDmGroup,
	createNewDirectMessage,
	joinDirectMessage,
	closeDirectMessage,
	openDirectMessage,
	addGroupUserWS,
	addDirectByMessageWS,
	follower,
	fetchDirectDetail
};

export const directMetaActions = directActions;

const getStatusUnread = (lastSeenStamp: number, lastSentStamp: number) => {
	if (lastSeenStamp && lastSentStamp) {
		return Number(lastSeenStamp) < Number(lastSentStamp);
	}
	return true;
};

const { selectAll, selectEntities, selectIds } = directAdapter.getSelectors();

export const getDirectState = (rootState: { [DIRECT_FEATURE_KEY]: DirectState }): DirectState => rootState[DIRECT_FEATURE_KEY];
export const selectDirectMessageEntities = createSelector(getDirectState, selectEntities);

export const selectAllDirectMessages = createSelector(getDirectState, selectAll);
export const selectDmGroupCurrentId = createSelector(getDirectState, (state) => state.currentDirectMessageId);

export const selectCurrentDM = createSelector(getDirectState, (state) => state.entities[state.currentDirectMessageId as string]);

export const selectCurrentDmType = createSelector(getDirectState, (state) => state.entities[state.currentDirectMessageId as string]?.type);
export const selectCurrentDmUserIds = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.user_ids || []
);
export const selectCurrentDmUsernames = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.usernames || []
);
export const selectCurrentDmDisplayNames = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.display_names || []
);
export const selectCurrentDmAvatars = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.avatars || []
);
export const selectCurrentDmChannelAvatar = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.channel_avatar
);
export const selectCurrentDmChannelLabel = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.channel_label || ''
);
export const selectCurrentDmChannelPrivate = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.channel_private
);
export const selectCurrentDmCreatorId = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.creator_id || ''
);
export const selectCurrentDmChannelId = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.channel_id || ''
);
export const selectCurrentDmId = createSelector(getDirectState, (state) => state.entities[state.currentDirectMessageId as string]?.id || '');
export const selectCurrentDmMeetingCode = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.meeting_code
);
export const selectCurrentDmClanId = createSelector(getDirectState, (state) => state.entities[state.currentDirectMessageId as string]?.clan_id || '');

export const selectDmGroupCurrentType = createSelector(getDirectState, (state) => state.currentDirectMessageType);

export const selectUserIdCurrentDm = createSelector(selectAllDirectMessages, selectDmGroupCurrentId, (directMessages, currentId) => {
	const currentDm = directMessages.find((dm) => dm.id === currentId);
	return currentDm?.user_ids || [];
});

export const selectIsLoadDMData = createSelector(getDirectState, (state) => state.loadingStatus !== 'not loaded');

export const selectDmGroupCurrent = (dmId: string) => createSelector(selectDirectMessageEntities, (channelEntities) => channelEntities[dmId]);

// Fine-grained selectors for DM/group properties
export const selectDmTypeById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.type
);
export const selectDmUserIdsById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.user_ids || []
);
export const selectDmUsernamesById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.usernames || []
);
export const selectDmDisplayNamesById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.display_names || []
);
export const selectDmAvatarsById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.avatars || []
);
export const selectDmChannelAvatarById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channel_avatar
);
export const selectDmChannelLabelById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channel_label || ''
);
export const selectDmChannelPrivateById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channel_private
);
export const selectDmCreatorIdById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.creator_id || ''
);
export const selectDmChannelIdById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channel_id || ''
);

export const selectUpdateDmGroupLoading = (channelId: string) =>
	createSelector(getDirectState, (state) => state.updateDmGroupLoading[channelId] || false);

export const selectUpdateDmGroupError = (channelId: string) => createSelector(getDirectState, (state) => state.updateDmGroupError[channelId] || null);

export const selectDirectsOpenlist = createSelector(selectAllDirectMessages, (directMessages) => {
	return directMessages.filter((dm) => {
		return dm?.active === 1;
	});
});

export const selectDirectsOpenlistOrder = createSelector(selectDirectsOpenlist, (data) => {
	return data
		.sort((a, b) => {
			const timestampA = a.last_sent_message?.timestamp_seconds || a.create_time_seconds || 0;
			const timestampB = b.last_sent_message?.timestamp_seconds || b.create_time_seconds || 0;
			return timestampB - timestampA;
		})
		.map((dm) => dm.id);
});

export const selectDirectById = createSelector([selectDirectMessageEntities, (state, id) => id], (clansEntities, id) => clansEntities?.[id]);

export const selectAllUserDM = createSelector(selectAllDirectMessages, (directMessages) => {
	return directMessages.reduce<IUserProfileActivity[]>((acc, dm) => {
		if (dm?.active === 1) {
			dm?.user_ids?.forEach((userId: string, index: number) => {
				if (!acc.some((existingUser) => existingUser.id === userId)) {
					const user = {
						avatar_url: dm?.avatars ? dm?.avatars[index] : '',
						display_name: dm?.display_names ? dm?.display_names[index] : '',
						id: userId,
						username: dm?.usernames ? dm?.usernames[index] : '',
						online: dm?.onlines ? dm?.onlines[index] : false
					};

					acc.push({
						...user
					});
				}
			});
		}
		return acc;
	}, []);
});

export const selectMemberDMByUserId = createSelector([selectAllUserDM, (state, userId: string) => userId], (entities, userId) => {
	return entities.find((item) => item?.id === userId);
});

export const selectBuzzStateByDirectId = createSelector(
	[getDirectState, (state, channelId: string) => channelId],
	(state, channelId) => state.buzzStateDirect?.[channelId]
);

export const selectIsShowPinBadgeByDmId = createSelector([getDirectState, (state, dmId: string) => dmId], (state, dmId) => {
	const result = state?.entities[dmId]?.showPinBadge;
	return result;
});

export const selectDirectsUnreadlist = createSelector(selectAllDirectMessages, (state) => {
	return state.filter((item) => {
		return item?.count_mess_unread && item?.is_mute !== true;
	});
});

export const selectIsUnreadDMById = createSelector([selectDirectMessageEntities, (state, channelId: string) => channelId], (entities, channelId) => {
	const channel = entities?.[channelId];

	if (!channel) {
		return false;
	}

	const lastSeen = Number(channel.last_seen_message?.timestamp_seconds ?? Number.NaN);
	const lastSent = Number(channel.last_sent_message?.timestamp_seconds ?? Number.NaN);

	if (Number.isNaN(lastSent)) {
		return false;
	}

	if (Number.isNaN(lastSeen)) {
		return lastSent > 0;
	}

	return lastSeen < lastSent;
});

export const selectTotalUnreadDM = createSelector(selectDirectsUnreadlist, (listUnreadDM) => {
	return listUnreadDM.reduce((total, count) => total + (count?.count_mess_unread ?? 0), 0);
});

export const selectLastSeenMessageIdDM = createSelector([selectDirectMessageEntities, (state, dmId: string) => dmId], (entities, channelId) => {
	const dm = entities?.[channelId];
	return dm?.last_seen_message?.id;
});

export const selectEntitiesDirectMeta = selectDirectMessageEntities;
