import { captureSentryError } from '@mezon/logger';
import { ActiveDm, BuzzArgs, IChannel, IUserItemActivity, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType, ChannelUpdatedEvent, safeJSONParse } from 'mezon-js';
import { ApiChannelDescription, ApiCreateChannelDescRequest, ApiDeleteChannelDescRequest } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { selectAllAccount } from '../account/account.slice';
import { StatusUserArgs, channelMembersActions } from '../channelmembers/channel.members';
import { channelsActions, fetchChannelsCached } from '../channels/channels.slice';
import { hashtagDmActions } from '../channels/hashtagDm.slice';
import { e2eeActions } from '../e2ee/e2ee.slice';
import { ensureSession, getMezonCtx } from '../helpers';
import { messagesActions } from '../messages/messages.slice';
import { pinMessageActions } from '../pinMessages/pinMessage.slice';
import { RootState } from '../store';
import { directMetaActions, selectEntitiesDirectMeta } from './directmeta.slice';

export const DIRECT_FEATURE_KEY = 'direct';

export interface DirectEntity extends IChannel {
	id: string;
}

export interface DirectState extends EntityState<DirectEntity, string> {
	loadingStatus: LoadingStatus;
	socketStatus: LoadingStatus;
	error?: string | null;
	currentDirectMessageId?: string | null;
	currentDirectMessageType?: number;
	statusDMChannelUnread: Record<string, boolean>;
	buzzStateDirect: Record<string, BuzzArgs | null>;
}

export interface DirectRootState {
	[DIRECT_FEATURE_KEY]: DirectState;
}

export const directAdapter = createEntityAdapter<DirectEntity>();

export const mapDmGroupToEntity = (channelRes: ApiChannelDescription) => {
	return { ...channelRes, id: channelRes.channel_id || '' };
};

export const createNewDirectMessage = createAsyncThunk('direct/createNewDirectMessage', async (body: ApiCreateChannelDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.createChannelDesc(mezon.session, body);
		if (response) {
			thunkAPI.dispatch(directActions.setDmGroupCurrentId(response.channel_id ?? ''));
			thunkAPI.dispatch(directActions.setDmGroupCurrentType(response.type ?? 0));
			await thunkAPI.dispatch(directActions.fetchDirectMessage({ noCache: true }));
			if (response.type !== ChannelType.CHANNEL_TYPE_VOICE) {
				await thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: '0',
						channelId: response.channel_id as string,
						channelType: response.type as number,
						isPublic: false
					})
				);
			}
			return response;
		} else {
			captureSentryError('no response', 'direct/createNewDirectMessage');
			return thunkAPI.rejectWithValue('no reponse');
		}
	} catch (error) {
		captureSentryError(error, 'direct/createNewDirectMessage');
		return thunkAPI.rejectWithValue(error);
	}
});

export const closeDirectMessage = createAsyncThunk('direct/closeDirectMessage', async (body: ApiDeleteChannelDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.closeDirectMess(mezon.session, body);
		if (response) {
			thunkAPI.dispatch(directActions.fetchDirectMessage({ noCache: true }));
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

			if (noCache) {
				fetchChannelsCached.clear(mezon, 500, 1, '', channelType);
			}
			const response = await fetchChannelsCached(mezon, 500, 1, '', channelType);
			if (!response.channeldesc) {
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
			const channels = sorted.map(mapDmGroupToEntity);
			//
			thunkAPI.dispatch(directMetaActions.setDirectMetaEntities(channels));
			return channels;
		} catch (error) {
			captureSentryError(error, 'direct/fetchDirectMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

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
					messagesActions.fetchMessages({ clanId: '0', channelId: directMessageId, noCache, isFetchingLatestMessages, isClearMessage })
				);
				const fetchChannelMembersResult = await thunkAPI.dispatch(
					channelMembersActions.fetchChannelMembers({
						clanId: '',
						channelId: directMessageId,
						channelType: ChannelType.CHANNEL_TYPE_TEXT,
						noCache
					})
				);
				const members = fetchChannelMembersResult.payload as members[];
				const state = thunkAPI.getState() as RootState;
				const currentUserId = selectAllAccount(state)?.user?.id;
				const userIds = members?.filter((m) => m.user_id && m.user_id !== currentUserId).map((m) => m.user_id) as string[];
				if (userIds?.length) {
					await thunkAPI.dispatch(e2eeActions.getPubKeys({ userIds }));
				}

				if (type === ChannelType.CHANNEL_TYPE_DM && members && members.length > 0) {
					const userIds = members.map((member) => member?.user_id as string);
					thunkAPI.dispatch(hashtagDmActions.fetchHashtagDm({ userIds: userIds, directId: directMessageId }));
				}
				thunkAPI.dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: directMessageId }));
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

export const initialDirectState: DirectState = directAdapter.getInitialState({
	loadingStatus: 'not loaded',
	socketStatus: 'not loaded',
	error: null,
	statusDMChannelUnread: {},
	buzzStateDirect: {}
});

export const directSlice = createSlice({
	name: DIRECT_FEATURE_KEY,
	initialState: initialDirectState,
	reducers: {
		add: directAdapter.addOne,
		remove: directAdapter.removeOne,
		updateOne: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
			if (!action.payload?.channel_id) return;
			const { creator_id, channel_id, e2ee } = action.payload;
			const notCurrentUser = action.payload?.currentUserId !== creator_id;
			const existingDirect = state.entities[channel_id];
			const showE2EEToast = existingDirect && existingDirect.e2ee !== e2ee && notCurrentUser;
			if (showE2EEToast) {
				toast.info(existingDirect.usernames + (e2ee === 1 ? ' enabled E2EE' : ' disabled E2EE'), {
					closeButton: true
				});
			}
			directAdapter.updateOne(state, {
				id: channel_id,
				changes: {
					...action.payload
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
			directAdapter.updateOne(state, {
				id: action.payload.directId,
				changes: {
					active: 1
				}
			});
		},

		updateStatusByUserId: (state, action: PayloadAction<StatusUserArgs[]>) => {
			const { ids, entities } = state;
			const statusUpdates = action.payload;

			for (const { userId, online } of statusUpdates) {
				for (let index = 0; index < ids?.length; index++) {
					const item = entities?.[ids[index]];
					if (!item) continue;

					const userIndex = item.user_id?.indexOf(userId);
					if (userIndex === -1 || userIndex === undefined) continue;

					const currentStatusOnlines = item.is_online || [];
					const updatedStatusOnlines = [...currentStatusOnlines];
					updatedStatusOnlines[userIndex] = online;

					directAdapter.updateOne(state, {
						id: item.id,
						changes: {
							is_online: updatedStatusOnlines
						}
					});
				}
			}
		},
		setBuzzStateDirect: (state, action: PayloadAction<{ channelId: string; buzzState: BuzzArgs | null }>) => {
			state.buzzStateDirect[action.payload.channelId] = action.payload.buzzState;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDirectMessage.pending, (state: DirectState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchDirectMessage.fulfilled, (state: DirectState, action: PayloadAction<IChannel[]>) => {
				directAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchDirectMessage.rejected, (state: DirectState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const directReducer = directSlice.reducer;

export const directActions = {
	...directSlice.actions,
	fetchDirectMessage,
	createNewDirectMessage,
	joinDirectMessage,
	closeDirectMessage,
	openDirectMessage
};

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

export const selectDmGroupCurrentType = createSelector(getDirectState, (state) => state.currentDirectMessageType);

export const selectUserIdCurrentDm = createSelector(selectAllDirectMessages, selectDmGroupCurrentId, (directMessages, currentId) => {
	const currentDm = directMessages.find((dm) => dm.id === currentId);
	return currentDm?.user_id || [];
});

export const selectIsLoadDMData = createSelector(getDirectState, (state) => state.loadingStatus !== 'not loaded');

export const selectDmGroupCurrent = (dmId: string) => createSelector(selectDirectMessageEntities, (channelEntities) => channelEntities[dmId]);

export const selectListDMUnread = createSelector(selectAllDirectMessages, getDirectState, (directMessages, state) => {
	return directMessages.filter((dm) => {
		return state.statusDMChannelUnread[dm.channel_id ?? ''] && dm?.count_mess_unread && dm?.count_mess_unread > 0;
	});
});
export const selectListStatusDM = createSelector(getDirectState, (state) => state.statusDMChannelUnread);

export const selectDirectsOpenlist = createSelector(selectAllDirectMessages, selectEntitiesDirectMeta, (directMessages, directMetaEntities) => {
	return directMessages
		.filter((dm) => {
			return dm?.active === 1;
		})
		.map((dm) => {
			if (!dm?.channel_id) return dm;
			const found = directMetaEntities?.[dm.channel_id];
			if (!found) return dm;
			return {
				...dm,
				last_sent_message: { ...dm.last_sent_message, ...found.last_sent_message },
				last_seen_message: { ...dm.last_seen_message, ...found.last_seen_message }
			};
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
	return directMessages.reduce<IUserItemActivity[]>((acc, dm) => {
		if (dm?.active === 1) {
			dm?.user_id?.forEach((userId: string, index: number) => {
				if (!acc.some((existingUser) => existingUser.id === userId)) {
					const user = {
						avatar_url: dm?.channel_avatar ? dm?.channel_avatar[index] : '',
						display_name: dm?.usernames ? dm?.usernames.split(',')[index] : '',
						id: userId,
						username: dm?.usernames ? dm?.usernames.split(',')[index] : '',
						online: dm?.is_online ? dm?.is_online[index] : false,
						metadata: (() => {
							if (!dm?.metadata) {
								return {};
							}
							try {
								return JSON.parse(dm?.metadata[index]);
							} catch (e) {
								const unescapedJSON = dm?.metadata[index].replace(/\\./g, (match) => {
									switch (match) {
										case '\\"':
											return '"';
										// Add more escape sequences as needed
										default:
											return match[1]; // Remove the backslash
									}
								});
								return safeJSONParse(unescapedJSON);
							}
						})()
					};

					acc.push({
						user,
						id: userId
					});
				}
			});
		}
		return acc;
	}, []);
});

export const selectMemberDMByUserId = createSelector([selectAllUserDM, (state, userId: string) => userId], (entities, userId) => {
	return entities.find((item) => item?.user?.id === userId);
});

export const selectBuzzStateByDirectId = createSelector(
	[getDirectState, (state, channelId: string) => channelId],
	(state, channelId) => state.buzzStateDirect?.[channelId]
);
