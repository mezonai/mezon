import { captureSentryError } from '@mezon/logger';
import type { BuzzArgs, IChannel, IMessage, IUserChannel, IUserProfileActivity, LoadingStatus } from '@mezon/utils';
import { ActiveDm } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelMessage, ChannelUpdatedEvent, UserProfileRedis } from 'mezon-js';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiChannelMessageHeader, ApiCreateChannelDescRequest, ApiDeleteChannelDescRequest } from 'mezon-js/types';
import { toast } from 'react-toastify';
import { selectAllAccount } from '../account/account.slice';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import type { StatusUserArgs } from '../channelmembers/channel.members';
import { channelsActions, fetchChannelsCached } from '../channels/channels.slice';
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
	const mapped = { ...channelRes, id: channelRes.channelId || '' };
	if (existingEntity?.channelAvatar && !mapped.channelAvatar) {
		mapped.channelAvatar = existingEntity.channelAvatar;
	} else if (!mapped.channelAvatar) {
		mapped.channelAvatar = 'assets/images/avatar-group.png';
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
			displayNames
		}: { body: ApiCreateChannelDescRequest; displayNames?: string | string[]; username?: string | string[]; avatar?: string | string[] },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const bodyWithTypeName = {
				$typeName: 'mezon.api.CreateChannelDescRequest' as const,
				clanId: body.clanId || '',
				parentId: body.parentId || '',
				channelId: body.channelId || '',
				categoryId: body.categoryId || '',
				channelLabel: body.channelLabel || '',
				channelPrivate: body.channelPrivate ?? 0,
				userIds: body.userIds || [],
				appId: body.appId || '',
				type: body.type || 0
			};
			const response = await mezon.client.createChannelDesc(mezon.session, bodyWithTypeName);
			if (response) {
				thunkAPI.dispatch(
					directActions.upsertOne({
						...response,
						id: response.channelId || '',
						usernames: Array.isArray(username) ? username : username ? [username] : [],
						displayNames: Array.isArray(displayNames) ? displayNames : displayNames ? [displayNames] : [],
						channelLabel:
							response.channelLabel ||
							(Array.isArray(displayNames) ? displayNames.join(',') : Array.isArray(username) ? username.join(',') : ''),
						channelAvatar: response.channelAvatar || 'assets/images/avatar-group.png',
						avatars: Array.isArray(avatar) ? avatar : avatar ? [avatar] : [],
						userIds: body.userIds,
						active: 1,
						lastSeenMessage: undefined,
						lastSentMessage: undefined
					})
				);

				await thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: '0',
						channelId: response.channelId as string,
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
		const bodyWithTypeName = {
			$typeName: 'mezon.api.DeleteChannelDescRequest' as const,
			clanId: body.clanId || '',
			channelId: body.channelId || ''
		};
		const response = await mezon.client.closeDirectMess(mezon.session, bodyWithTypeName);
		if (response) {
			thunkAPI.dispatch(directActions.setDmActiveStatus({ dmId: body.channelId as string, isActive: false }));
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
				await mezon.client.openDirectMess(mezon.session, {
					$typeName: 'mezon.api.DeleteChannelDescRequest' as const,
					clanId: '',
					channelId
				});
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
				const listStatusUnreadDM = response.channeldesc.map((channel: any) => {
					const status = getStatusUnread(
						Number(channel.lastSeenMessage?.timestampSeconds),
						Number(channel.lastSentMessage?.timestampSeconds)
					);
					return { dmId: channel.channelId ?? '', isUnread: status };
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
			const sorted = response.channeldesc.sort((a, b) => {
				if (
					a === undefined ||
					b === undefined ||
					a.lastSentMessage === undefined ||
					a.lastSeenMessage?.id === undefined ||
					b.lastSentMessage === undefined ||
					b.lastSeenMessage?.id === undefined
				) {
					return 0;
				}
				if (a.lastSentMessage.id && b.lastSentMessage.id && a.lastSentMessage.id < b.lastSentMessage.id) {
					return 1;
				}

				return -1;
			});

			response.channeldesc.map((channel) => {
				if (channel.type === ChannelType.CHANNEL_TYPE_DM) {
					listDM.push({
						id: channel.channelId || '',
						channelId: channel.channelId || '',
						avatars: [userProfile?.avatarUrl || '', channel.avatars?.[0] || ''],
						displayNames: [userProfile?.displayName || '', channel.displayNames?.[0] || ''],
						usernames: [userProfile?.username || '', channel.usernames?.[0] || ''],
						onlines: [true, !!channel?.onlines?.[0]],
						userIds: [userProfile?.id || '', channel.userIds?.[0] || '']
					});
				}
			});

			const channels = sorted.map((channelRes: ApiChannelDescription) => {
				const existingEntity = existingEntities.find((entity) => entity.id === channelRes.channelId);
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
	async (body: { channelId: string; channelLabel?: string; channelAvatar?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const state = thunkAPI.getState() as RootState;
			const current = state?.direct?.entities?.[body.channelId];
			const updatePayload: any = {};
			if (typeof body.channelLabel !== 'undefined') {
				updatePayload.channelLabel = body.channelLabel;
			} else if (typeof current?.channelLabel !== 'undefined') {
				updatePayload.channelLabel = current.channelLabel;
			}
			if (typeof body.channelAvatar !== 'undefined') {
				updatePayload.channelAvatar = body.channelAvatar;
			} else if (typeof current?.channelAvatar !== 'undefined') {
				updatePayload.channelAvatar = current.channelAvatar;
			}

			const response = await mezon.client.updateChannelDesc(mezon.session, body.channelId, updatePayload);

			if (response) {
				thunkAPI.dispatch(
					directActions.updateOne({
						channelId: body.channelId,
						...(typeof body.channelLabel !== 'undefined' ? { channelLabel: body.channelLabel } : {}),
						...(typeof body.channelAvatar !== 'undefined' ? { channelAvatar: body.channelAvatar } : {})
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
				id: channel.userIds?.[0] || '',
				avatarUrl: channel.avatars?.[0],
				online: channel.onlines?.[0],
				displayName: channel.displayNames?.[0],
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
	userId?: string;
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
		id: message.channelId,
		clanId: '0',
		parentId: '0',
		channelId: message.channelId,
		categoryId: '0',
		type: message?.mode === ChannelStreamMode.STREAM_MODE_GROUP ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM,
		creatorId: message.senderId,
		channelLabel: message.displayName || message.username,
		channelPrivate: 1,
		channelAvatar: message.avatar,
		avatars: [message.avatar as string],
		userIds: [message.senderId],
		lastSentMessage: {
			id: message.id,
			timestampSeconds: message.createTimeSeconds,
			senderId: message.senderId,
			content: JSON.stringify(message.content),
			attachment: message?.attachments ? JSON.stringify(message?.attachments) : '[]',
			reference: '[]',
			mention: '[]',
			reaction: '[]'
		},
		lastSeenMessage: {
			id: message.id,
			timestampSeconds: message.createTimeSeconds ? message.createTimeSeconds - 1 : undefined
		},
		onlines: [true],
		active: ActiveDm.OPEN_DM,
		usernames: [message.username as string],
		displayNames: [message.displayName as string],
		creatorName: message.username as string,
		createTimeSeconds: message.createTimeSeconds,
		updateTimeSeconds: message.createTimeSeconds
	};
};

export const addDirectByMessageWS = createAsyncThunk('direct/addDirectByMessageWS', async (message: IMessage, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const existingDirect = selectDirectById(state, message.channelId);

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
	channelDesc: ApiChannelDescription;
	users: UserProfileRedis[];
}

export const addGroupUserWS = createAsyncThunk('direct/addGroupUserWS', async (payload: AddGroupUserWSPayload, thunkAPI) => {
	try {
		const { channelDesc, users } = payload;
		const userIds: string[] = [];
		const usernames: string[] = [];
		const avatars: string[] = [];
		const onlines: boolean[] = [];
		const label: string[] = [];

		for (const user of users) {
			userIds.push(user.userId);
			usernames.push(user.username);
			avatars.push(user.avatar);
			onlines.push(user.online);
			label.push(user.displayName || user.username);
		}

		const state = thunkAPI.getState() as RootState;
		const existingEntity = selectAllDirectMessages(state).find((entity) => entity.id === channelDesc.channelId);

		const directEntity: DirectEntity = {
			...channelDesc,
			id: channelDesc.channelId || '',
			userIds,
			usernames,
			displayNames: label,
			channelAvatar: channelDesc.channelAvatar || 'assets/images/avatar-group.png',
			avatars,
			onlines,
			active: 1,
			channelLabel: channelDesc?.channelLabel || existingEntity?.channelLabel || label.toString(),
			topic: channelDesc.topic || existingEntity?.topic,
			memberCount: channelDesc.memberCount
		};
		thunkAPI.dispatch(
			userChannelsActions.update({
				id: channelDesc.channelId || '',
				changes: {
					avatars,
					displayNames: label,
					id: channelDesc.channelId,
					onlines,
					usernames,
					userIds,
					channelId: channelDesc.channelId
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
			const existLabel = entities[action.payload.id]?.channelLabel?.split(',');
			const existingShowPinBadge = entities[action.payload.id]?.showPinBadge;
			const dataUpdate = action.payload;
			if (existLabel && existLabel?.length <= 1) {
				dataUpdate.channelLabel = entities[action.payload.id]?.channelLabel;
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
			if (!action.payload?.channelId) return;
			const { channelId, creatorId: _creator_id, currentUserId: _currentUserId, ...changes } = action.payload;
			directAdapter.updateOne(state, {
				id: channelId,
				changes
			});
		},
		updateE2EE: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
			if (!action.payload?.channelId) return;
			const { creatorId, channelId, e2ee } = action.payload;
			const notCurrentUser = action.payload?.currentUserId !== creatorId;
			const existingDirect = state.entities[channelId];
			const showE2EEToast = existingDirect && existingDirect.e2ee !== e2ee && notCurrentUser;
			if (showE2EEToast) {
				// TODO: This toast needs i18n but it's in Redux slice, need to handle differently
				toast.info(existingDirect.usernames + (e2ee === 1 ? ' enabled E2EE' : ' disabled E2EE'), {
					closeButton: true
				});
			}
			directAdapter.updateOne(state, {
				id: channelId,
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
					memberCount: (currentDirect?.memberCount || 0) > 0 ? (currentDirect?.memberCount || 1) - 1 : 0
				}
			});
		},
		changeE2EE: (state, action: PayloadAction<Partial<ChannelUpdatedEvent>>) => {
			if (!action.payload?.channelId) return;
			directAdapter.updateOne(state, {
				id: action.payload.channelId,
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

					const userIndex = item.userIds?.indexOf(userId);
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
			const dmGroup = state.entities?.[action.payload.channelId as string];
			if (dmGroup) {
				const existingChannelAvatar = dmGroup.channelAvatar;

				dmGroup.userIds = [...(dmGroup.userIds ?? []), ...(action.payload.userIds ?? [])];
				dmGroup.usernames = [...(dmGroup.usernames ?? []), ...(action.payload.usernames ?? [])];
				dmGroup.avatars = [...(dmGroup.avatars ?? []), ...(action.payload.avatars ?? [])];
				dmGroup.channelAvatar = action.payload.channelAvatar ?? '';
				if (existingChannelAvatar && !action.payload.channelAvatar) {
					dmGroup.channelAvatar = existingChannelAvatar;
				}
			}
		},
		updateMemberDMGroup: (
			state,
			action: PayloadAction<{ dmId: string; userId: string; avatar: string; displayName: string; aboutMe?: string }>
		) => {
			const { dmId, userId, avatar, displayName, aboutMe } = action.payload;
			const dmGroup = state.entities?.[dmId];

			if (!dmGroup || !userId) return;

			const index = (dmGroup.userIds ??= []).indexOf(userId);
			if (index === -1) return;

			if (avatar && dmGroup.channelAvatar) dmGroup.channelAvatar = avatar;

			if (displayName && dmGroup.displayNames) {
				if (dmGroup.channelLabel) {
					const labels = dmGroup.channelLabel.split(',');
					if (labels[index] === dmGroup.displayNames[index]) labels[index] = displayName;
					dmGroup.channelLabel = labels.join(',');
				}
				dmGroup.displayNames[index] = displayName;
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
			const currentBadge = state.entities[channelId]?.countMessUnread || 0;
			if (currentBadge !== currentBadge + 1) {
				directAdapter.updateOne(state, {
					id: channelId,
					changes: {
						countMessUnread: currentBadge + 1
					}
				});
			}
		},
		removeBadgeDirect: (state, action: PayloadAction<{ channelId: string }>) => {
			const currentBadge = state.entities[action.payload.channelId]?.countMessUnread || 0;
			if (currentBadge) {
				directAdapter.updateOne(state, {
					id: action.payload.channelId,
					changes: {
						countMessUnread: 0
					}
				});
			}
		},
		updateMoreData: (state, action: PayloadAction<DirectEntity>) => {
			const data = action.payload;
			const channelId = data?.channelId || data.id;
			const currentData = state.entities[channelId];
			if (!currentData) return;

			const changes: Partial<DirectEntity> = {};
			const timestamp = Math.floor(Date.now() / 1000);

			if (data?.lastSentMessage) {
				changes.lastSentMessage = {
					...(currentData?.lastSentMessage ?? {}),
					...data?.lastSentMessage,
					timestampSeconds: timestamp
				};
			}

			if (data?.clanId === '0' && currentData?.active !== ActiveDm.OPEN_DM) {
				changes.active = ActiveDm.OPEN_DM;
			}

			if (data?.updateTimeSeconds) {
				changes.updateTimeSeconds = data?.updateTimeSeconds;
			}

			if (currentData?.type === ChannelType.CHANNEL_TYPE_GROUP) {
				if (data?.displayNames) changes.displayNames = data?.displayNames;
				if (data?.usernames) changes.usernames = data?.usernames;
				if (data?.userIds) changes.userIds = data?.userIds;
			}

			directAdapter.updateOne(state, {
				id: channelId,
				changes
			});
		},
		setCountMessUnread: (state, action: PayloadAction<{ channelId: string; isMention?: boolean; count?: number; isReset?: boolean }>) => {
			const { channelId, isMention = false, count = 1, isReset = false } = action.payload;
			const entity = state.entities[channelId];
			if (entity?.isMute !== true || isMention === true) {
				const newCountMessUnread = isReset ? 0 : (entity?.countMessUnread || 0) + count;
				const finalCount = Math.max(0, newCountMessUnread);
				directAdapter.updateOne(state, {
					id: channelId,
					changes: {
						countMessUnread: finalCount
					}
				});
			}
		},
		setDirectLastSeenTimestamp: (state, action: PayloadAction<{ channelId: string; timestamp: number; messageId?: string }>) => {
			const { channelId, timestamp, messageId } = action.payload;
			const entity = state.entities[channelId];
			const lastSeenMessage: ApiChannelMessageHeader = {
				...((entity?.lastSeenMessage as ApiChannelMessageHeader) || {}),
				timestampSeconds: Math.floor(timestamp)
			};
			if (messageId) {
				lastSeenMessage.id = messageId;
			}

			directAdapter.updateOne(state, {
				id: channelId,
				changes: {
					countMessUnread: 0,
					lastSeenMessage
				}
			});
		},
		updateLastSeenTime: (state, action: PayloadAction<MessagesEntity>) => {
			const payload = action.payload;
			const entity = state.entities[payload.channelId];
			if (entity?.lastSeenMessage?.id === payload.id) {
				return;
			}

			const timestamp = Math.floor(Date.now() / 1000);
			directAdapter.updateOne(state, {
				id: payload.channelId,
				changes: {
					lastSeenMessage: {
						content: payload.content,
						id: payload.id,
						senderId: payload.senderId,
						timestampSeconds: timestamp
					} as ApiChannelMessageHeader,
					countMessUnread: 0
				}
			});
		},
		setDirectMetaEntities: (state, action: PayloadAction<IChannel[]>) => {
			const channels = action.payload;
			if (channels) {
				for (const ch of channels) {
					const entity = state.entities[ch.channelId || ''];
					if (entity) {
						const changes: Partial<DirectEntity> = {};
						if (ch.lastSeenMessage) {
							changes.lastSeenMessage = ch.lastSeenMessage;
						}
						if (ch.lastSentMessage) {
							changes.lastSentMessage = ch.lastSentMessage;
						}
						if (Object.keys(changes).length > 0) {
							directAdapter.updateOne(state, {
								id: ch.channelId || '',
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
					isMute: payload.isMute
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
				const channelId = action.meta.arg.channelId;
				state.updateDmGroupLoading[channelId] = true;
				state.updateDmGroupError[channelId] = null;
			})
			.addCase(updateDmGroup.fulfilled, (state: DirectState, action) => {
				const channelId = action.meta.arg.channelId;
				state.updateDmGroupLoading[channelId] = false;
				state.updateDmGroupError[channelId] = null;
				// TODO: This toast needs i18n but it's in Redux slice, need to handle differently
				toast.success('Group updated successfully!');
			})
			.addCase(updateDmGroup.rejected, (state: DirectState, action) => {
				const channelId = action.meta.arg.channelId;
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

const { selectAll, selectEntities } = directAdapter.getSelectors();

export const getDirectState = (rootState: { [DIRECT_FEATURE_KEY]: DirectState }): DirectState => rootState[DIRECT_FEATURE_KEY];
export const selectDirectMessageEntities = createSelector(getDirectState, selectEntities);

export const selectAllDirectMessages = createSelector(getDirectState, selectAll);
export const selectDmGroupCurrentId = createSelector(getDirectState, (state) => state.currentDirectMessageId);

export const selectCurrentDM = createSelector(getDirectState, (state) => state.entities[state.currentDirectMessageId as string]);

export const selectCurrentDmChannelId = createSelector(
	getDirectState,
	(state) => state.entities[state.currentDirectMessageId as string]?.channelId || ''
);

export const selectDmGroupCurrentType = createSelector(getDirectState, (state) => state.currentDirectMessageType);

export const selectUserIdCurrentDm = createSelector(selectAllDirectMessages, selectDmGroupCurrentId, (directMessages, currentId) => {
	const currentDm = directMessages.find((dm) => dm.id === currentId);
	return currentDm?.userIds || [];
});

export const selectIsLoadDMData = createSelector(getDirectState, (state) => state.loadingStatus !== 'not loaded');

export const selectDmGroupCurrent = (dmId: string) => createSelector(selectDirectMessageEntities, (channelEntities) => channelEntities[dmId]);

export const selectDmChannelLabelById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channelLabel || ''
);
export const selectDmChannelPrivateById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channelPrivate
);
export const selectDmCreatorIdById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.creatorId || ''
);
export const selectDmChannelIdById = createSelector(
	[selectDirectMessageEntities, (_: RootState, dmId: string) => dmId],
	(entities, dmId) => entities[dmId]?.channelId || ''
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
			const timestampA = a.lastSentMessage?.timestampSeconds || a.createTimeSeconds || 0;
			const timestampB = b.lastSentMessage?.timestampSeconds || b.createTimeSeconds || 0;
			return timestampB - timestampA;
		})
		.map((dm) => dm.id);
});

export const selectDirectById = createSelector([selectDirectMessageEntities, (state, id) => id], (clansEntities, id) => clansEntities?.[id]);

export const selectAllUserDM = createSelector(selectAllDirectMessages, (directMessages) => {
	return directMessages.reduce<IUserProfileActivity[]>((acc, dm) => {
		if (dm?.active === 1) {
			dm?.userIds?.forEach((userId: string, index: number) => {
				if (!acc.some((existingUser) => existingUser.id === userId)) {
					const user = {
						avatarUrl: dm?.avatars ? dm?.avatars[index] : '',
						displayName: dm?.displayNames ? dm?.displayNames[index] : '',
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
		return item?.countMessUnread && item?.isMute !== true;
	});
});

export const selectIsUnreadDMById = createSelector([selectDirectMessageEntities, (state, channelId: string) => channelId], (entities, channelId) => {
	const channel = entities?.[channelId];

	if (!channel) {
		return false;
	}

	const lastSeen = Number(channel.lastSeenMessage?.timestampSeconds ?? Number.NaN);
	const lastSent = Number(channel.lastSentMessage?.timestampSeconds ?? Number.NaN);

	if (Number.isNaN(lastSent)) {
		return false;
	}

	if (Number.isNaN(lastSeen)) {
		return lastSent > 0;
	}

	return lastSeen < lastSent;
});

export const selectTotalUnreadDM = createSelector(selectDirectsUnreadlist, (listUnreadDM) => {
	return listUnreadDM.reduce((total, count) => total + (count?.countMessUnread ?? 0), 0);
});

export const selectLastSeenMessageIdDM = createSelector([selectDirectMessageEntities, (state, dmId: string) => dmId], (entities, channelId) => {
	const dm = entities?.[channelId];
	return dm?.lastSeenMessage?.id;
});
