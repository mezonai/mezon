import { captureSentryError } from '@mezon/logger';
import type { ICategoryChannel, IChannel } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiChannelDescription, ApiUpdateCategoryDescRequest } from 'mezon-js/api.gen';
import type { CategoriesEntity } from '../categories/categories.slice';
import { clansActions } from '../clans/clans.slice';
import type { RootState } from '../store';
import type { ChannelsEntity, IUpdateChannelRequest } from './channels.slice';

export const CHANNEL_LIST_RENDER = 'CHANNEL_LIST_RENDER';

export interface ChannelOrderList {
	indexStart: number;
	indexEnd: number;
}
export interface ChannelListRenderState {
	listChannelRender: Record<string, Array<IChannel | ICategoryChannel>>;
	listOrderChannelByCate: Record<string, ChannelOrderList[]>;
}

export const initialListChannelRenderState: ChannelListRenderState = {
	listChannelRender: {},
	listOrderChannelByCate: {}
};

export const updateClanBadgeRender = createAsyncThunk(
	'listRender/updateClanBadge',
	async ({ channelId, clanId }: { channelId: string; clanId: string }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const listChannelRender = state.CHANNEL_LIST_RENDER.listChannelRender[clanId];
			const channelDelete = listChannelRender.filter((channel) => channelId === channel.id);
			thunkAPI.dispatch(clansActions.updateClanBadgeCount({ clanId, count: ((channelDelete[0] as IChannel)?.count_mess_unread || 0) * -1 }));
		} catch (error) {
			captureSentryError(error, 'listRender/updateClanBadge');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const bulkUpdateClanBadgeRender = createAsyncThunk(
	'listRender/bulkUpdateClanBadge',
	async ({ channelIds, clanId }: { channelIds: string[]; clanId: string }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const listChannelRender = state.CHANNEL_LIST_RENDER.listChannelRender[clanId];
			const totalBadgeCount = channelIds.reduce((total, channelId) => {
				const channel = listChannelRender.find((channel) => channelId === channel.id) as IChannel;
				return total + (channel?.count_mess_unread || 0);
			}, 0);
			if (totalBadgeCount > 0) {
				thunkAPI.dispatch(clansActions.updateClanBadgeCount({ clanId, count: totalBadgeCount * -1 }));
			}
		} catch (error) {
			captureSentryError(error, 'listRender/bulkUpdateClanBadge');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export interface DataChannelAndCate {
	listChannel: IChannel[];
	listCategory: CategoriesEntity[];
	clanId: string;
	listChannelFavor: string[];
	isMobile?: boolean;
}

export const FAVORITE_CATEGORY_ID = 'favorCate';

export const listChannelRenderSlice = createSlice({
	name: CHANNEL_LIST_RENDER,
	initialState: initialListChannelRenderState,
	reducers: {
		mapListChannelRender: (state, action: PayloadAction<DataChannelAndCate>) => {
			const { listChannel, listCategory, clanId, listChannelFavor, isMobile } = action.payload;
			// Prioritize moving channel forward thread
			const listChannelPriority = prioritizeChannel(listChannel);
			const listChannelRender: (ICategoryChannel | IChannel)[] = [];
			const listFavorChannel: IChannel[] = [];
			listCategory.map((category) => {
				const categoryChannels = sortChannels(listChannelPriority, category.id);
				const listChannelIds = categoryChannels.map((channel) => channel.id);
				const categoryWithChannels: ICategoryChannel = {
					...category,
					channels: listChannelIds
				};

				listChannelRender.push(categoryWithChannels);
				categoryChannels.forEach((channel) => {
					if (listChannelFavor.includes(channel.id)) {
						listFavorChannel.push({
							...channel,
							isFavor: true,
							category_id: FAVORITE_CATEGORY_ID
						});
					}
					listChannelRender.push(channel);
				});
			});

			const favorCate: ICategoryChannel = {
				channels: listChannelFavor,
				id: FAVORITE_CATEGORY_ID,
				category_id: FAVORITE_CATEGORY_ID,
				category_name: 'Favorite Channel',
				clan_id: clanId,
				creator_id: '0',
				category_order: 1,
				isFavor: true
			};

			state.listChannelRender[clanId] = [favorCate, ...listFavorChannel, ...listChannelRender];
		},

		addChannelToListRender: (state, action: PayloadAction<ApiChannelDescription>) => {
			const channelData: IChannel = {
				...(action.payload as IChannel),
				id: action.payload.channel_id || ''
			};
			const clanId = channelData.clan_id;

			if (clanId && state.listChannelRender[clanId]) {
				const isExistChannel = state.listChannelRender[clanId]?.findIndex((channel) => (channel as IChannel)?.channel_id === channelData.id);
				if (isExistChannel !== -1) {
					return;
				}

				const indexInsert = state.listChannelRender[clanId].findIndex((channel) => channel.id === channelData.category_id);
				if (indexInsert === -1) {
					return;
				}
				state.listChannelRender[clanId].splice(indexInsert + 1, 0, channelData);

				const category = state.listChannelRender[clanId][indexInsert] as ICategoryChannel;
				if (category.channels) {
					category.channels = [...(category.channels as string[]), channelData.id];
				}

				state.listChannelRender[clanId].join();
			}
		},
		deleteChannelInListRender: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			if (!state.listChannelRender[clanId]) {
				return;
			}

			const channelToDelete = state.listChannelRender[clanId].find((channel) => channel.id === channelId) as IChannel;

			state.listChannelRender[clanId] = state.listChannelRender[clanId].filter(
				(channel) => channel.id !== channelId && (channel as IChannel).parent_id !== channelId
			);

			if (channelToDelete?.category_id) {
				const indexInsert = state.listChannelRender[clanId].findIndex((item) => item.id === channelToDelete.category_id);
				if (indexInsert !== -1) {
					const category = state.listChannelRender[clanId][indexInsert] as ICategoryChannel;
					if (category.channels) {
						category.channels = (category.channels as string[]).filter((id) => id !== channelId);
					}
				}
			}
		},
		updateChannelInListRender: (state, action: PayloadAction<{ channelId: string; clanId: string; dataUpdate: IUpdateChannelRequest }>) => {
			const { channelId, clanId, dataUpdate } = action.payload;
			if (state.listChannelRender[clanId]) {
				const indexUpdate = state.listChannelRender[clanId].findIndex((channel) => channel.id === channelId);

				if (indexUpdate === -1) {
					return;
				}
				state.listChannelRender[clanId][indexUpdate] = {
					...state.listChannelRender[clanId][indexUpdate],
					channel_label: dataUpdate.channel_label || (state.listChannelRender[clanId][indexUpdate] as IChannel).channel_label,
					e2ee: dataUpdate.e2ee || (state.listChannelRender[clanId][indexUpdate] as IChannel).e2ee,
					topic: dataUpdate.topic || (state.listChannelRender[clanId][indexUpdate] as IChannel).topic,
					age_restricted: dataUpdate.age_restricted,
					channel_private: dataUpdate.channel_private
						? dataUpdate.channel_private || (state.listChannelRender[clanId][indexUpdate] as IChannel).channel_private
						: 0
				};
				const existing = state.listChannelRender[clanId][indexUpdate] as IChannel;
				if (state.listChannelRender?.[clanId]?.[indexUpdate]) {
					const safeAvatar =
						typeof dataUpdate?.channel_avatar === 'string' && dataUpdate?.channel_avatar?.trim() !== ''
							? dataUpdate?.channel_avatar
							: (existing?.channel_avatar ?? '');

					(state.listChannelRender[clanId][indexUpdate] as IChannel).channel_avatar = safeAvatar;
				}
				if (state.listChannelRender[clanId][indexUpdate].category_id === FAVORITE_CATEGORY_ID) {
					const indexNextUpdate = state.listChannelRender[clanId].findIndex(
						(channel) => channel.id === channelId && channel.category_id !== FAVORITE_CATEGORY_ID
					);
					state.listChannelRender[clanId][indexNextUpdate] = {
						...state.listChannelRender[clanId][indexNextUpdate],
						channel_label: dataUpdate.channel_label || (state.listChannelRender[clanId][indexNextUpdate] as IChannel).channel_label,
						e2ee: dataUpdate.e2ee || (state.listChannelRender[clanId][indexNextUpdate] as IChannel).e2ee,
						topic: dataUpdate.topic || (state.listChannelRender[clanId][indexNextUpdate] as IChannel).topic,
						age_restricted: dataUpdate.age_restricted,
						channel_private: dataUpdate.channel_private
							? dataUpdate.channel_private || (state.listChannelRender[clanId][indexNextUpdate] as IChannel).channel_private
							: 0
					};
					const existingNext = state.listChannelRender[clanId][indexNextUpdate] as IChannel;
					const avatarNext =
						typeof dataUpdate?.channel_avatar === 'string' && dataUpdate?.channel_avatar?.trim() !== ''
							? dataUpdate?.channel_avatar
							: (existingNext?.channel_avatar ?? '');

					(state.listChannelRender[clanId][indexNextUpdate] as IChannel).channel_avatar = avatarNext;
				}
			}
		},
		updateChannelPositionInRenderedList: (state, action: PayloadAction<{ channelId: string; clanId: string; categoryId: string }>) => {
			const { channelId, clanId, categoryId } = action.payload;
			if (!state.listChannelRender[clanId]) {
				return;
			}
			const oldIndexOfChannel = state.listChannelRender[clanId].findIndex(
				(channel) => channel.id === channelId && channel?.category_id !== FAVORITE_CATEGORY_ID
			);
			const indexOfNewCategory = state.listChannelRender[clanId].findIndex((channel) => channel.id === categoryId);
			if (oldIndexOfChannel === -1 || indexOfNewCategory === -1) {
				return;
			}

			const newChannelWithThreads = state.listChannelRender[clanId].filter((item) => {
				if (
					((item as IChannel).id === channelId || (item as IChannel).parent_id === channelId) &&
					(item as IChannel)?.category_id !== FAVORITE_CATEGORY_ID
				) {
					return {
						...item,
						category_id: categoryId
					};
				}
			});

			state.listChannelRender[clanId].splice(oldIndexOfChannel, newChannelWithThreads.length);

			if (indexOfNewCategory > oldIndexOfChannel) {
				state.listChannelRender[clanId].splice(indexOfNewCategory - newChannelWithThreads.length + 1, 0, ...newChannelWithThreads);
			} else {
				state.listChannelRender[clanId].splice(indexOfNewCategory + 1, 0, ...newChannelWithThreads);
			}
		},
		addCategoryToListRender: (state, action: PayloadAction<{ clanId: string; cate: ICategoryChannel }>) => {
			const { clanId, cate } = action.payload;
			if (state.listChannelRender[clanId]) {
				state.listChannelRender[clanId] = [...state.listChannelRender[clanId], cate];
			}
		},
		removeCategoryFromListRender: (state, action: PayloadAction<{ clanId: string; categoryId: string }>) => {
			const { clanId, categoryId } = action.payload;

			if (state.listChannelRender[clanId]) {
				state.listChannelRender[clanId] = state.listChannelRender[clanId].filter(
					(item) => item.id !== categoryId && (item as IChannel).category_id !== categoryId
				);
			}
		},
		updateCategory: (state, action: PayloadAction<{ clanId: string; cate: ApiUpdateCategoryDescRequest }>) => {
			const { clanId, cate } = action.payload;
			if (state.listChannelRender[clanId]) {
				const indexUpdate = state.listChannelRender[clanId].findIndex((channel) => channel.id === cate.category_id);
				state.listChannelRender[clanId][indexUpdate] = {
					...state.listChannelRender[clanId][indexUpdate],
					category_name: cate.category_name
				};
			}
		},
		addThreadToListRender: (state, action: PayloadAction<{ clanId: string; channel: ChannelsEntity }>) => {
			const { channel, clanId } = action.payload;

			const channelData: IChannel = {
				...(channel as IChannel),
				id: channel.id
			};

			if (!state.listChannelRender[clanId]) {
				return;
			}

			const isExistChannel = state.listChannelRender[clanId]?.findIndex((channel) => (channel as IChannel)?.channel_id === channelData.id);
			if (isExistChannel === -1 && clanId) {
				const indexInsert = state.listChannelRender[clanId]?.findIndex(
					(channel) => (channel as IChannel)?.channel_id === channelData.parent_id && !(channel as IChannel).isFavor
				);

				if (indexInsert === -1) {
					return;
				}

				const channel = state.listChannelRender[clanId]?.[indexInsert] as IChannel;
				state.listChannelRender[clanId]?.splice(indexInsert, 1, { ...channel, threadIds: [...(channel.threadIds || []), channelData.id] });
				state.listChannelRender[clanId]?.splice(indexInsert + 1, 0, channelData);
				state.listChannelRender[clanId].join();
			}
		},
		addBadgeToChannelRender: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			if (clanId === '0') {
				return;
			}
			if (!state.listChannelRender[clanId]) {
				return;
			}
			state.listChannelRender[clanId] = state.listChannelRender[clanId].map((channel) => {
				if (channel.id === channelId) {
					return {
						...channel,
						count_mess_unread: ((channel as IChannel).count_mess_unread || 0) + 1
					};
				}
				return channel;
			});
		},
		updateChannelUnreadCount: (state, action: PayloadAction<{ channelId: string; clanId: string; count: number; isReset?: boolean }>) => {
			const { channelId, clanId, count, isReset = false } = action.payload;
			if (clanId === '0') {
				return;
			}
			if (!state.listChannelRender[clanId]) {
				return;
			}
			state.listChannelRender[clanId] = state.listChannelRender[clanId].map((channel) => {
				if (channel.id === channelId) {
					const currentCount = (channel as IChannel).count_mess_unread || 0;
					const newCount = isReset ? count : Math.max(0, currentCount + count);
					return {
						...channel,
						count_mess_unread: newCount
					};
				}
				return channel;
			});
		},
		removeBadgeFromChannel: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			const channels = state.listChannelRender[clanId];

			if (channels) {
				let hasChanged = false;

				const updatedChannels = channels.map((channel) => {
					if (channel.id === channelId && (channel as any)?.count_mess_unread !== 0) {
						hasChanged = true;
						return {
							...channel,
							count_mess_unread: 0
						};
					}
					return channel;
				});

				if (hasChanged) {
					state.listChannelRender[clanId] = updatedChannels;
				}
			}
		},
		leaveChannelListRender: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			if (state.listChannelRender[clanId]) {
				const indexRemove = state.listChannelRender[clanId]?.findIndex((channel) => channel.id === channelId);
				if (indexRemove === -1) {
					return;
				}
				state.listChannelRender[clanId]?.splice(indexRemove, 1);
				state.listChannelRender[clanId].join();
			}
		},
		handleMarkAsReadListRender: (
			state,
			action: PayloadAction<{ channelId?: string; clanId?: string; categoryId?: string; type: EMarkAsReadType }>
		) => {
			const { channelId, clanId, categoryId, type } = action.payload;
			switch (type) {
				case EMarkAsReadType.CHANNEL:
					if (!clanId || !channelId || !state.listChannelRender[clanId]) {
						return;
					}
					state.listChannelRender[clanId] = state.listChannelRender[clanId].map((channel) => {
						if (channel.id === channelId || (channel as IChannel).parent_id === channelId) {
							return {
								...channel,
								count_mess_unread: 0
							};
						}
						return channel;
					});
					break;
				case EMarkAsReadType.CLAN:
					if (!clanId || !state.listChannelRender[clanId]) {
						return;
					}
					state.listChannelRender[clanId] = state.listChannelRender[clanId].map((channel) => {
						return {
							...channel,
							count_mess_unread: 0
						};
					});
					break;
				case EMarkAsReadType.CATEGORY:
					if (!clanId || !categoryId || !state.listChannelRender[clanId]) {
						return;
					}
					state.listChannelRender[clanId] = state.listChannelRender[clanId].map((channel) => {
						if ((channel as IChannel).category_id === categoryId) {
							return {
								...channel,
								count_mess_unread: 0
							};
						}
						return channel;
					});
					break;
				default:
					break;
			}
		},
		handleMarkFavor: (state, action: PayloadAction<{ channelId: string; clanId: string; mark: boolean }>) => {
			const { channelId, clanId, mark } = action.payload;
			if (!state.listChannelRender[clanId]) {
				return;
			}
			if (!mark) {
				const markIndex = state.listChannelRender[clanId].findIndex(
					(channel) => channel.id === channelId && (channel as IChannel).category_id === FAVORITE_CATEGORY_ID
				);
				if (markIndex === -1) {
					return;
				}
				const listFavor = (state.listChannelRender[clanId][0] as ICategoryChannel).channels.filter(
					(channel) => (channel as string) !== channelId
				);
				state.listChannelRender[clanId][0] = { ...state.listChannelRender[clanId][0], channels: listFavor as string[] };

				state.listChannelRender[clanId] = state.listChannelRender[clanId].filter(
					(channel) => !(channel.id === channelId && (channel as IChannel).category_id === FAVORITE_CATEGORY_ID)
				);
				return;
			}

			const channelMark: IChannel = {
				...state.listChannelRender[clanId].filter((channel) => channel.id === channelId)[0],
				category_id: FAVORITE_CATEGORY_ID
			};
			((state.listChannelRender[clanId][0] as ICategoryChannel).channels as string[]).push(channelId);
			state.listChannelRender[clanId]?.splice(1, 0, channelMark);
			state.listChannelRender[clanId].join();
		},
		sortCategoryChannel: (state, action: PayloadAction<{ clanId: string; listCategoryOrder: ICategoryChannel[] }>) => {
			const { listCategoryOrder, clanId } = action.payload;
			const listChannel = state.listChannelRender[clanId].filter((channel) => !channel.isFavor) || [];
			const listChannelFavor = state.listChannelRender[clanId].filter((channel) => channel.isFavor);

			const listChannelRender: (ICategoryChannel | IChannel)[] = [];
			listCategoryOrder.map((category) => {
				const channelAndThread = listChannel.filter((channel) => channel.category_id === category.id || category.id === channel.id);
				channelAndThread.map((channel) => {
					listChannelRender.push(channel);
				});
			});

			state.listChannelRender[clanId] = [...listChannelFavor, ...listChannelRender];
		},
		setActiveThread: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { channelId, clanId } = action.payload;

			if (state.listChannelRender[clanId]) {
				const updateIndex = state.listChannelRender[clanId]?.findIndex((channel) => channel.id === channelId);
				if (updateIndex === -1) {
					return;
				}
				const activeThread: IChannel = {
					...state.listChannelRender[clanId][updateIndex],
					active: 1
				};
				state.listChannelRender[clanId]?.splice(updateIndex, 1, activeThread);
				state.listChannelRender[clanId].join();
			}
		},
		sortChannelInCategory: (state, action: PayloadAction<{ clanId: string; categoryId: string; indexStart: number; indexEnd: number }>) => {
			const { clanId, categoryId, indexStart, indexEnd } = action.payload;
			if (!state.listOrderChannelByCate[categoryId]) {
				const itemOrder = state.listChannelRender[clanId][indexStart];
				const itemTarget = state.listChannelRender[clanId][indexEnd];
				const channelThreadOrder = state.listChannelRender[clanId].filter((item) => {
					if (
						((item as IChannel).id === itemOrder.id || (item as IChannel).parent_id === itemOrder.id) &&
						item.category_id !== FAVORITE_CATEGORY_ID
					) {
						return {
							...item
						};
					}
				});
				const channelThreadTarget = state.listChannelRender[clanId].filter((item) => {
					if (
						((item as IChannel).id === itemTarget.id || (item as IChannel).parent_id === itemTarget.id) &&
						item.category_id !== FAVORITE_CATEGORY_ID
					) {
						return {
							...item
						};
					}
				});

				if (categoryId !== FAVORITE_CATEGORY_ID) {
					state.listChannelRender[clanId].splice(indexStart, channelThreadOrder.length);
					state.listChannelRender[clanId].join();
					state.listChannelRender[clanId].splice(
						indexStart < indexEnd
							? indexEnd - channelThreadOrder.length + channelThreadTarget.length
							: indexEnd + channelThreadTarget.length,
						0,
						...channelThreadOrder
					);
					state.listChannelRender[clanId].join();
				} else {
					state.listChannelRender[clanId].splice(indexStart, 1);
					state.listChannelRender[clanId].join();
					state.listChannelRender[clanId].splice(indexStart < indexEnd ? indexEnd : indexEnd + 1, 0, itemOrder);
					state.listChannelRender[clanId].join();
				}
			}
		},
		updateCategoryChannels: (state, action: PayloadAction<{ clanId: string; categoryId: string; channelId: string }>) => {
			const { clanId, categoryId, channelId } = action.payload;
			const index = state.listChannelRender[clanId]?.findIndex((item) => item.id === categoryId);
			if (index !== undefined && index !== -1) {
				const category = state.listChannelRender[clanId][index] as ICategoryChannel;
				category.channels = [...((category.channels as string[]) || []), channelId] as string[];
				state.listChannelRender[clanId][index] = category;
			}
		},

		bulkDeleteChannelsInListRender: (state, action: PayloadAction<{ channelIds: string[]; clanId: string }>) => {
			const { channelIds, clanId } = action.payload;
			if (!state.listChannelRender[clanId]) {
				return;
			}

			const channelsToDelete = channelIds
				.map((channelId) => state.listChannelRender[clanId].find((channel) => channel.id === channelId) as IChannel)
				.filter(Boolean);

			state.listChannelRender[clanId] = state.listChannelRender[clanId].filter(
				(channel) => !channelIds.includes(channel.id) && !channelIds.includes((channel as IChannel).parent_id || '')
			);

			channelsToDelete.forEach((channelToDelete) => {
				if (channelToDelete?.category_id) {
					const categoryIndex = state.listChannelRender[clanId].findIndex((item) => item.id === channelToDelete.category_id);
					if (categoryIndex !== -1) {
						const category = state.listChannelRender[clanId][categoryIndex] as ICategoryChannel;
						if (category.channels) {
							if (typeof category.channels[0] === 'string') {
								category.channels = (category.channels as string[]).filter((id) => !channelIds.includes(id));
							} else {
								category.channels = (category.channels as IChannel[]).filter((channel) => !channelIds.includes(channel.id));
							}
						}
					}
				}
			});
		}
	}
});

export const listChannelRenderAction = {
	...listChannelRenderSlice.actions,
	updateClanBadgeRender,
	bulkUpdateClanBadgeRender
};

export const listChannelRenderReducer = listChannelRenderSlice.reducer;

export const getListChannelRenderState = (rootState: { [CHANNEL_LIST_RENDER]: ChannelListRenderState }): ChannelListRenderState =>
	rootState[CHANNEL_LIST_RENDER];

export const selectListChannelRenderByClanId = createSelector([getListChannelRenderState, (state, clanId?: string) => clanId], (state, clanId) => {
	if (!clanId || !state.listChannelRender[clanId]) {
		return undefined;
	}
	return state.listChannelRender[clanId];
});

export const selectAllThreadUnreadBehind = createSelector(
	[
		getListChannelRenderState,
		(state, clanId?: string) => clanId,
		(_, __, channelId?: string) => channelId,
		(_, __, ___, threadId?: string) => threadId
	],
	(state, clanId, channelId, threadId) => {
		if (!clanId || !state.listChannelRender[clanId]) {
			return undefined;
		}
		const list = state.listChannelRender[clanId];
		const index = list.findIndex((c) => c.id === threadId);

		const result = list.slice(index + 1).filter((channel) => (channel as IChannel)?.parent_id === channelId);
		return result;
	}
);

export const selectListOrderChannel = createSelector(getListChannelRenderState, (state) => {
	return state.listOrderChannelByCate;
});

function prioritizeChannel(channels: IChannel[]): IChannel[] {
	return channels.sort((a, b) => {
		const aParentId = a.parent_id ?? '';
		const bParentId = b.parent_id ?? '';

		if ((aParentId === '0' || aParentId === '') && bParentId !== '0') {
			return -1;
		}
		if (aParentId !== '0' && (bParentId === '0' || bParentId === '')) {
			return 1;
		}
		if (aParentId === '0' || aParentId === '') {
			const aChannelId = a.channel_id ?? '';
			const bChannelId = b.channel_id ?? '';
			return aChannelId < bChannelId ? -1 : aChannelId > bChannelId ? 1 : 0;
		}
		return aParentId < bParentId ? -1 : aParentId > bParentId ? 1 : 0;
	});
}

function sortChannels(channels: IChannel[], categoryId: string): IChannel[] {
	const sortedChannels: IChannel[] = [];
	let indexThread = channels.length;
	const numOfChannel = channels.length;
	for (let i = 0; i < numOfChannel; i++)
		if (channels[i].parent_id !== '0' && channels[i].parent_id !== undefined) {
			indexThread = i;
			break;
		}

	const numOfParent = indexThread;
	for (let i = 0; i < numOfParent; i++) {
		const channel = channels[i];
		if (channel.category_id === categoryId) {
			sortedChannels.push(channel);
			for (; indexThread < numOfChannel; indexThread++) {
				const thread = channels[indexThread];
				const parentId = thread.parent_id || '';
				if (thread.parent_id === channel.id) {
					sortedChannels.push(thread);
					if (channel.threadIds) {
						channel.threadIds = [...channel.threadIds, thread.id];
					} else {
						channel.threadIds = [thread.id];
					}
				} else if (channel.id < parentId) {
					indexThread--;
					break;
				}
			}
		}
	}
	return sortedChannels;
}

export enum EMarkAsReadType {
	CHANNEL,
	CLAN,
	CATEGORY
}
