import { captureSentryError } from '@mezon/logger';
import type { IAttachmentEntity, IChannelAttachment, LoadingStatus } from '@mezon/utils';
import { ETypeLinkMedia } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelAttachment } from 'mezon-js/dist/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, isCacheValid, markApiFirstCalled } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';

export const ATTACHMENT_FEATURE_KEY = 'attachments';

/*
 * Update these interfaces according to your requirements.
 */
export interface AttachmentEntity extends IChannelAttachment {
	id: string; // Primary ID
}

export interface AttachmentState extends EntityState<AttachmentEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	attachment: string;
	openModalAttachment: boolean;
	mode: ChannelStreamMode | undefined;
	messageId: string;
	currentAttachment: AttachmentEntity | null;
	listAttachmentsByChannel: Record<
		string,
		{
			attachments: AttachmentEntity[];
			cache?: CacheMetadata;
			pagination?: {
				isLoading: boolean;
				hasMoreBefore: boolean;
				hasMoreAfter: boolean;
				limit: number;
			};
		}
	>;
}

export const attachmentAdapter = createEntityAdapter({
	selectId: (attachment: AttachmentEntity) => attachment.url as string,
	sortComparer: (a: AttachmentEntity, b: AttachmentEntity) => {
		if (a.create_time && b.create_time) {
			return Date.parse(b.create_time) - Date.parse(a.create_time);
		}
		return 0;
	}
});

type fetchChannelAttachmentsPayload = {
	clanId: string;
	channelId: string;
	fileType?: string;
	state?: number;
	limit?: number;
	before?: number;
	after?: number;
	noCache?: boolean;
	direction?: 'initial' | 'before' | 'after';
};

const CHANNEL_ATTACHMENTS_CACHED_TIME = 1000 * 60 * 60;

export const fetchChannelAttachmentsCached = async (
	getState: () => any,
	mezon: MezonValueContext,
	clanId: string,
	channelId: string,
	fileType = '',
	state?: number,
	limit?: number,
	before?: number,
	after?: number,
	noCache = false
) => {
	const currentState = getState();
	const attachmentState = currentState[ATTACHMENT_FEATURE_KEY] as AttachmentState;
	const channelData = attachmentState.listAttachmentsByChannel[channelId];

	if (!noCache && channelData?.cache && isCacheValid(channelData.cache) && channelData.attachments && channelData.attachments.length > 0) {
		const existingAttachments = channelData.attachments;
		let hasDataForRange = false;

		if (before !== undefined) {
			const beforeTime = before * 1000;
			hasDataForRange = existingAttachments.some((att) => {
				if (!att.create_time) return false;
				const attTime = new Date(att.create_time).getTime();
				return attTime < beforeTime;
			});
		} else if (after !== undefined) {
			const afterTime = after * 1000;
			hasDataForRange = existingAttachments.some((att) => {
				if (!att.create_time) return false;
				const attTime = new Date(att.create_time).getTime();
				return attTime > afterTime;
			});
		} else {
			hasDataForRange = true;
		}

		if (hasDataForRange) {
			return {
				attachments: existingAttachments,
				fromCache: true,
				time: channelData.cache.lastFetched
			};
		}
	}

	const response = await mezon.client.listChannelAttachments(mezon.session, clanId, channelId, fileType, state, limit, before, after);

	const apiKey = createApiKey('fetchChannelAttachments', clanId, channelId, fileType, limit || '', before || '', after || '');
	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const mapChannelAttachmentsToEntity = (attachmentRes: ApiChannelAttachment, channelId?: string, clanId?: string) => {
	const attachmentEntity: IAttachmentEntity = { ...attachmentRes, id: attachmentRes.id || '', channelId, clanId };
	return attachmentEntity;
};

export const fetchChannelAttachments = createAsyncThunk(
	'attachment/fetchChannelAttachments',
	async (
		{ clanId, channelId, fileType, state, limit = 50, before, after, noCache, direction = 'initial' }: fetchChannelAttachmentsPayload,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchChannelAttachmentsCached(
				thunkAPI.getState,
				mezon,
				clanId,
				channelId,
				fileType,
				state,
				limit,
				before,
				after,
				Boolean(noCache)
			);

			if (!response.attachments) {
				return { attachments: [], channelId, fromCache: response.fromCache, direction };
			}

			const attachments = response.attachments.map((attachmentRes) => mapChannelAttachmentsToEntity(attachmentRes, channelId, clanId));

			if (response.fromCache) {
				return {
					attachments,
					channelId,
					fromCache: true,
					direction
				};
			}

			return { attachments, channelId, fromCache: response.fromCache, direction };
		} catch (error) {
			captureSentryError(error, 'attachment/fetchChannelAttachments');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const getInitialChannelState = () => ({
	attachments: [] as AttachmentEntity[],
	pagination: {
		isLoading: false,
		hasMoreBefore: true,
		hasMoreAfter: true,
		limit: 50
	}
});

export const initialAttachmentState: AttachmentState = attachmentAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	attachment: '',
	openModalAttachment: false,
	mode: undefined,
	messageId: '',
	currentAttachment: null,
	listAttachmentsByChannel: {}
});

export const attachmentSlice = createSlice({
	name: ATTACHMENT_FEATURE_KEY,
	initialState: initialAttachmentState,
	reducers: {
		add: attachmentAdapter.addOne,
		addMany: attachmentAdapter.addMany,
		remove: attachmentAdapter.removeOne,
		setAttachment: (state, action) => {
			state.attachment = action.payload;
		},
		setOpenModalAttachment: (state, action) => {
			state.openModalAttachment = action.payload;
		},
		setMode: (state, action) => {
			state.mode = action.payload;
		},
		setMessageId: (state, action) => {
			state.messageId = action.payload;
		},
		setCurrentAttachment: (state, action: PayloadAction<AttachmentEntity | null>) => {
			state.currentAttachment = action.payload;
		},
		removeCurrentAttachment: (state) => {
			state.currentAttachment = null;
		},
		updateCache: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (!state.listAttachmentsByChannel[channelId]) {
				state.listAttachmentsByChannel[channelId] = getInitialChannelState();
			}
			state.listAttachmentsByChannel[channelId].cache = createCacheMetadata(CHANNEL_ATTACHMENTS_CACHED_TIME);
		},
		addAttachments: (state, action: PayloadAction<{ listAttachments: AttachmentEntity[]; channelId: string }>) => {
			const currentChannelId = action?.payload?.channelId;

			if (!state.listAttachmentsByChannel[currentChannelId]) {
				return;
			}

			action?.payload?.listAttachments?.forEach((attachment) => {
				state?.listAttachmentsByChannel[currentChannelId]?.attachments?.unshift(attachment);
			});
		},
		removeAttachments: (state, action: PayloadAction<{ messageId: string; channelId: string }>) => {
			const { messageId, channelId } = action.payload;
			if (state.listAttachmentsByChannel[channelId]) {
				state.listAttachmentsByChannel[channelId].attachments = state.listAttachmentsByChannel[channelId].attachments.filter(
					(attachment) => attachment.message_id !== messageId
				);

				if (state.listAttachmentsByChannel[channelId].attachments.length === 0) {
					delete state.listAttachmentsByChannel[channelId];
				}
			}
		},
		setAttachmentLoading: (state, action: PayloadAction<{ channelId: string; isLoading: boolean }>) => {
			const { channelId, isLoading } = action.payload;
			if (!state.listAttachmentsByChannel[channelId]) {
				state.listAttachmentsByChannel[channelId] = getInitialChannelState();
			}
			if (state.listAttachmentsByChannel[channelId].pagination) {
				state.listAttachmentsByChannel[channelId].pagination!.isLoading = isLoading;
			}
		},
		resetAttachmentPagination: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (!state.listAttachmentsByChannel[channelId]) {
				state.listAttachmentsByChannel[channelId] = getInitialChannelState();
			}
			state.listAttachmentsByChannel[channelId].pagination = {
				isLoading: false,
				hasMoreBefore: true,
				hasMoreAfter: true,
				limit: 50
			};
		},
		clearAttachmentChannel: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (state.listAttachmentsByChannel[channelId]) {
				state.listAttachmentsByChannel[channelId].attachments = [];
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelAttachments.pending, (state: AttachmentState, action) => {
				state.loadingStatus = 'loading';
				const channelId = action.meta.arg.channelId;
				if (!state.listAttachmentsByChannel[channelId]) {
					state.listAttachmentsByChannel[channelId] = getInitialChannelState();
				}
				if (state.listAttachmentsByChannel[channelId].pagination) {
					state.listAttachmentsByChannel[channelId].pagination!.isLoading = true;
				}
			})
			.addCase(fetchChannelAttachments.fulfilled, (state: AttachmentState, action) => {
				const { attachments, channelId, fromCache, direction = 'initial' } = action.payload;
				const limit = action.meta.arg.limit || 50;

				if (!state.listAttachmentsByChannel[channelId]) {
					state.listAttachmentsByChannel[channelId] = getInitialChannelState();
				}

				const pagination = state.listAttachmentsByChannel[channelId].pagination;
				if (!pagination) {
					return;
				}

				if (!fromCache) {
					if (direction === 'before') {
						if (attachments.length === 0) {
							pagination.hasMoreBefore = false;
						} else {
							const currentAttachments = state.listAttachmentsByChannel[channelId].attachments;
							const existingUrls = new Set(currentAttachments.map((att) => att.url));
							const newItems = attachments.filter((att) => !existingUrls.has(att.url));
							const newAttachments = [...currentAttachments, ...newItems];

							pagination.hasMoreBefore = attachments.length >= limit;
							state.listAttachmentsByChannel[channelId].attachments = newAttachments;
						}
					} else if (direction === 'after') {
						if (attachments.length === 0) {
							pagination.hasMoreAfter = false;
						} else {
							const currentAttachments = state.listAttachmentsByChannel[channelId].attachments;
							const existingUrls = new Set(currentAttachments.map((att) => att.url));
							const newItems = attachments.filter((att) => !existingUrls.has(att.url));
							const newAttachments = [...newItems, ...currentAttachments];

							pagination.hasMoreAfter = attachments.length >= limit;
							state.listAttachmentsByChannel[channelId].attachments = newAttachments;
						}
					} else {
						if (attachments.length === 0) {
							pagination.hasMoreBefore = false;
							pagination.hasMoreAfter = false;
						} else {
							pagination.hasMoreBefore = attachments.length >= limit;
							pagination.hasMoreAfter = attachments.length >= limit;
						}
						state.listAttachmentsByChannel[channelId].attachments = attachments;
					}

					if (attachments.length > 0) {
						attachmentAdapter.setAll(state, state.listAttachmentsByChannel[channelId].attachments);
						state.listAttachmentsByChannel[channelId].cache = createCacheMetadata(CHANNEL_ATTACHMENTS_CACHED_TIME);
					}
				}

				pagination.isLoading = false;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchChannelAttachments.rejected, (state: AttachmentState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
				const channelId = action.meta.arg.channelId;
				if (state.listAttachmentsByChannel[channelId]?.pagination) {
					state.listAttachmentsByChannel[channelId].pagination!.isLoading = false;
				}
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const attachmentReducer = attachmentSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const attachmentActions = {
	...attachmentSlice.actions,
	fetchChannelAttachments
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */

export const getAttachmentState = (rootState: { [ATTACHMENT_FEATURE_KEY]: AttachmentState }): AttachmentState => rootState[ATTACHMENT_FEATURE_KEY];

export const selectAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.attachment);

export const selectCurrentAttachmentShowImage = createSelector(getAttachmentState, (state: AttachmentState) => state.currentAttachment);

export const selectOpenModalAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.openModalAttachment);

export const selectModeAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.mode);

export const selectMessageIdAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.messageId);

export const selectAllListAttachmentByChannel = createSelector([getAttachmentState, (state, channelId: string) => channelId], (state, channelId) => {
	if (!Object.prototype.hasOwnProperty.call(state.listAttachmentsByChannel, channelId)) {
		return undefined;
	}
	return state.listAttachmentsByChannel[channelId]?.attachments?.filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX));
});

export const selectAllListDocumentByChannel = createSelector([getAttachmentState, (state, channelId: string) => channelId], (state, channelId) => {
	if (!Object.prototype.hasOwnProperty.call(state.listAttachmentsByChannel, channelId)) {
		return [];
	}

	return (
		state.listAttachmentsByChannel[channelId]?.attachments?.reduce<AttachmentEntity[]>((result, att) => {
			const { filetype, filename } = att || {};
			if (!filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) && !filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX)) {
				result.push({
					...att,
					filename: filename ?? 'File',
					filetype: filetype ?? 'File'
				});
			}
			return result;
		}, []) || []
	);
});

export const selectAttachmentsLoadingStatus = createSelector(getAttachmentState, (state: AttachmentState) => state.loadingStatus);

export const selectAttachmentPaginationByChannel = createSelector(
	[getAttachmentState, (state, channelId: string) => channelId],
	(state, channelId) => {
		if (!Object.prototype.hasOwnProperty.call(state.listAttachmentsByChannel, channelId)) {
			return {
				isLoading: false,
				hasMoreBefore: true,
				hasMoreAfter: true,
				limit: 50
			};
		}
		return (
			state.listAttachmentsByChannel[channelId]?.pagination || {
				isLoading: false,
				hasMoreBefore: true,
				hasMoreAfter: true,
				limit: 50
			}
		);
	}
);
