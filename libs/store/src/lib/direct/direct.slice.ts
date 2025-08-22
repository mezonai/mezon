import { captureSentryError } from '@mezon/logger';
import { ActiveDm, BuzzArgs, IChannel, IMessage, IUserItemActivity, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelMessage, ChannelType, ChannelUpdatedEvent, UserProfileRedis, safeJSONParse } from 'mezon-js';
import { ApiChannelDescription, ApiCreateChannelDescRequest, ApiDeleteChannelDescRequest } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { StatusUserArgs, channelMembersActions } from '../channelmembers/channel.members';
import { channelsActions, fetchChannelsCached } from '../channels/channels.slice';
import { hashtagDmActions } from '../channels/hashtagDm.slice';
import { ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { messagesActions } from '../messages/messages.slice';
import { RootState } from '../store';
import { directMembersMetaActions } from './direct.members.meta';
import { DMMetaEntity, directMetaActions, selectEntitiesDirectMeta } from './directmeta.slice';

export const DIRECT_FEATURE_KEY = 'direct';

export interface DirectEntity extends IChannel {
	id: string;
	showPinBadge?: boolean;
}

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

export const mapDmGroupToEntity = (channelRes: ApiChannelDescription) => {
	return { ...channelRes, id: channelRes.channel_id || '' };
};

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
						channel_label: Array.isArray(username) ? username.toString() : username,
						channel_avatar: Array.isArray(avatar) ? avatar : avatar ? [avatar] : [],
						user_id: body.user_ids
					})
				);
				if (response.type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
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
			thunkAPI.dispatch(directMetaActions.setDirectMetaEntities(channels));
			thunkAPI.dispatch(directActions.setAll(channels));
			const users = mapChannelsToUsers(channels);
			thunkAPI.dispatch(directMembersMetaActions.updateBulkMetadata(users));
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

export const updateDmGroup = createAsyncThunk('direct/updateDmGroup', async (body: { channel_id: string; channel_label?: string; topic?: string }, thunkAPI) => {
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
		if (typeof body.topic !== 'undefined') {
			updatePayload.topic = body.topic;
		} else if (typeof current?.topic !== 'undefined') {
			updatePayload.topic = current.topic;
		}

		const response = await mezon.client.updateChannelDesc(mezon.session, body.channel_id, updatePayload);

		if (response) {
			thunkAPI.dispatch(
				directActions.updateOne({
					channel_id: body.channel_id,
					...(typeof body.channel_label !== 'undefined' ? { channel_label: body.channel_label } : {}),
					...(typeof body.topic !== 'undefined' ? { topic: body.topic } : {})
				})
			);

			thunkAPI.dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}

		return response;
	} catch (error) {
		captureSentryError(error, 'direct/updateDmGroup');
		return thunkAPI.rejectWithValue(error);
	}
});

function mapChannelsToUsers(channels: any[]): IUserItemActivity[] {
	return channels.reduce<IUserItemActivity[]>((acc, dm) => {
		if (dm?.active === 1) {
			dm?.user_id?.forEach((userId: string, index: number) => {
				if (!acc.some((existingUser) => existingUser.id === userId)) {
					const user = {
						avatar_url: dm?.channel_avatar ? dm?.channel_avatar[index] : '',
						display_name: dm?.usernames ? dm?.usernames[index] : '',

						id: userId,
						username: dm?.usernames ? dm?.usernames[index] : '',

						online: dm?.is_online ? dm?.is_online[index] : false,
						metadata: (() => {
							if (!dm?.metadata) {
								return {};
							}
							try {
								return JSON.parse(dm?.metadata[index]);
							} catch (e) {
								const unescapedJSON = dm?.metadata[index]?.replace(/\\./g, (match: string) => {
									switch (match) {
										case '\\"':
											return '"';
										default:
											return match[1]; // Bỏ ký tự escape
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
							thunkAPI.dispatch(hashtagDmActions.fetchHashtagDm({ userIds: userIds, directId: directMessageId }));
						}
					});
				// const userIds = members?.filter((m) => m.user_id && m.user_id !== currentUserId).map((m) => m.user_id) as string[];
				// if (userIds?.length) {
				// 	await thunkAPI.dispatch(e2eeActions.getPubKeys({ userIds }));
				// }
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
		type: ChannelType.CHANNEL_TYPE_DM,
		creator_id: message.sender_id,
		channel_label: message.display_name || message.username,
		channel_private: 1,
		channel_avatar: [message.avatar as string],
		user_id: [message.sender_id],
		last_sent_message: {
			id: message.id,
			timestamp_seconds: message.create_time_seconds,
			sender_id: message.sender_id,
			content: JSON.stringify(message.content),
			attachment: '[]',
			reference: '[]',
			mention: '[]',
			reaction: '[]'
		},
		last_seen_message: {
			id: message.id,
			timestamp_seconds: message.create_time_seconds ? message.create_time_seconds - 1 : undefined
		},
		is_online: [true],
		active: ActiveDm.OPEN_DM,
		usernames: [message.username as string],
		creator_name: message.username as string,
		create_time_seconds: message.create_time_seconds,
		update_time_seconds: message.create_time_seconds,
		metadata: ['{}'],
		about_me: ['']
	};
};

export const addDirectByMessageWS = createAsyncThunk('direct/addDirectByMessageWS', async (message: IMessage, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const existingDirect = selectDirectById(state, message.channel_id);

		const directEntity = mapMessageToConversation(message);
		if (!existingDirect) {
			if (message.isMe) {
				return directEntity;
			}
			thunkAPI.dispatch(directActions.upsertOne(directEntity));
			thunkAPI.dispatch(
				directMetaActions.upsertOne({
					...directEntity,
					lastSeenTimestamp: directEntity.last_seen_message?.timestamp_seconds,
					lastSentTimestamp: directEntity.last_sent_message?.timestamp_seconds
				} as DMMetaEntity)
			);
			return directEntity;
		} else {
			thunkAPI.dispatch(directActions.updateMoreData(directEntity));
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
		const isOnline: boolean[] = [];
		const metadata: string[] = [];
		const aboutMe: string[] = [];
		const label: string[] = [];

		for (const user of users) {
			userIds.push(user.user_id);
			usernames.push(user.username);
			avatars.push(user.avatar);
			isOnline.push(user.online);
			metadata.push(JSON.stringify({ status: (user as { metadata?: Array<string> }).metadata || '' }));
			aboutMe.push(user.about_me);
			label.push(user.display_name);
		}

		const directEntity: DirectEntity = {
			...channel_desc,
			id: channel_desc.channel_id || '',
			user_id: userIds,
			usernames: usernames,
			channel_avatar: avatars,
			is_online: isOnline,
			metadata,
			about_me: aboutMe,
			active: 1,
			channel_label: label.toString()
		};

		thunkAPI.dispatch(directActions.upsertOne(directEntity));
		thunkAPI.dispatch(directMetaActions.upsertOne(directEntity as DMMetaEntity));
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
			const dataUpdate = action.payload;
			if (existLabel && existLabel?.length <= 1) {
				dataUpdate.channel_label = entities[action.payload.id]?.channel_label;
			}
			directAdapter.upsertOne(state, dataUpdate);
		},
		update: directAdapter.updateOne,
		setAll: directAdapter.setAll,
		updateOne: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
			if (!action.payload?.channel_id) return;
			const { channel_id, creator_id, currentUserId, ...changes } = action.payload;
			directAdapter.updateOne(state, {
				id: channel_id,
				changes: changes
			});
		},
		updateE2EE: (state, action: PayloadAction<Partial<ChannelUpdatedEvent & { currentUserId: string }>>) => {
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
					e2ee: e2ee
				}
			});
		},
		removeByUserId: (state, action: PayloadAction<{ userId: string; currentUserId: string; channelId: string }>) => {
			const { userId, currentUserId, channelId } = action.payload;
			const { ids, entities } = state;

			const item = entities[channelId];
			if (!item || !item.user_id) return;

			const userIndex = item.user_id.indexOf(userId);

			if (userIndex !== -1) {
				const newUserIds = item.user_id.filter((_, index) => index !== userIndex);

				if (newUserIds.length === 1 && newUserIds.includes(currentUserId)) {
					directAdapter.removeOne(state, channelId);
				} else {
					const newUsernames = item.usernames?.filter((_, index) => index !== userIndex);
					const newChannelAvatars = item.channel_avatar?.filter((_, index) => index !== userIndex);
					const newIsOnline = item.is_online?.filter((_, index) => index !== userIndex);
					const newMetadata = item.metadata?.filter((_, index) => index !== userIndex);
					const newAboutMe = item.about_me?.filter((_, index) => index !== userIndex);
					directAdapter.updateOne(state, {
						id: channelId,
						changes: {
							user_id: newUserIds,
							usernames: newUsernames,
							channel_avatar: newChannelAvatars,
							is_online: newIsOnline,
							metadata: newMetadata,
							about_me: newAboutMe
						}
					});
				}
			}
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
		},
		setShowPinBadgeOfDM: (state, action: PayloadAction<{ dmId: string; isShow: boolean }>) => {
			const { dmId, isShow } = action.payload;
			if (!state.entities?.[dmId]) return;
			state.entities[dmId].showPinBadge = isShow;
		},
		addMemberDmGroup: (state, action: PayloadAction<DirectEntity>) => {
			const dmGroup = state.entities?.[action.payload.channel_id as string];
			if (dmGroup) {
				dmGroup.user_id = [...(dmGroup.user_id ?? []), ...(action.payload.user_id ?? [])];

				// dmGroup.usernames = dmGroup.usernames + ',' + action.payload.usernames;
				dmGroup.usernames = [...(dmGroup.usernames ?? []), ...(action.payload.usernames ?? [])];
				dmGroup.channel_avatar = [...(dmGroup.channel_avatar ?? []), ...(action.payload.channel_avatar ?? [])];
			}
		},
		updateMenberDMGroup: (state, action: PayloadAction<{ dmId: string; user_id: string; avatar: string; display_name: string }>) => {
			const { dmId, user_id, avatar, display_name } = action.payload;
			const dmGroup = state.entities?.[dmId];

			if (!dmGroup || !user_id) return;

			const index = (dmGroup.user_id ??= []).indexOf(user_id);
			if (index === -1) return;

			if (avatar && dmGroup.channel_avatar) dmGroup.channel_avatar[index] = avatar;

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
			const currentData = state.entities[data.channel_id || ''];
			if (currentData) {
				let changes;
				if (data?.update_time_seconds && data?.last_sent_message) {
					changes = {
						...currentData,
						last_sent_message: data?.last_sent_message,
						update_time_seconds: data?.update_time_seconds
					};
				} else {
					changes = {
						...data,
						...currentData
					};
				}

				directAdapter.updateOne(state, {
					id: data.channel_id || '',
					changes
				});
			}
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
				toast.success('Group updated successfully!');
			})
			.addCase(updateDmGroup.rejected, (state: DirectState, action) => {
				const channelId = action.meta.arg.channel_id;
				state.updateDmGroupLoading[channelId] = false;
				state.updateDmGroupError[channelId] = action.error.message || 'Failed to update group';
				toast.error(action.error.message || 'Failed to update group');
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
	follower
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

export const selectUpdateDmGroupLoading = (channelId: string) => createSelector(getDirectState, (state) => state.updateDmGroupLoading[channelId] || false);

export const selectUpdateDmGroupError = (channelId: string) => createSelector(getDirectState, (state) => state.updateDmGroupError[channelId] || null);

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
						// display_name: dm?.usernames ? dm?.usernames.split(',')[index] : '',
						display_name: dm?.usernames ? dm?.usernames[index] : '',

						id: userId,
						// username: dm?.usernames ? dm?.usernames.split(',')[index] : '',
						username: dm?.usernames ? dm?.usernames[index] : '',

						online: dm?.is_online ? dm?.is_online[index] : false,
						metadata: (() => {
							if (!dm?.metadata) {
								return {};
							}
							try {
								return JSON.parse(dm?.metadata[index]);
							} catch (e) {
								const unescapedJSON = dm?.metadata[index]?.replace(/\\./g, (match) => {
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

export const selectIsShowPinBadgeByDmId = createSelector(
	[getDirectState, (state, dmId: string) => dmId],
	(state, dmId) => state?.entities[dmId]?.showPinBadge
);
