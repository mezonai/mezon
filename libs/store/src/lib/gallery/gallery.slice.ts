import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import { ETypeLinkMedia } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { AttachmentEntity } from '../attachment/attachments.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createCacheMetadata } from '../cache-metadata';
import { ensureSession, getMezonCtx } from '../helpers';

export const GALLERY_FEATURE_KEY = 'gallery';

export interface GalleryState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	galleryByChannel: Record<
		string,
		{
			attachments: AttachmentEntity[];
			pagination: {
				hasMoreBefore: boolean;
				hasMoreAfter: boolean;
				isLoading: boolean;
				limit: number;
			};
			cache?: CacheMetadata;
		}
	>;
}

export type MediaFilterType = 'all' | 'image' | 'video';

type fetchGalleryAttachmentsPayload = {
	clanId: string;
	channelId: string;
	fileType?: string;
	limit?: number;
	before?: number;
	after?: number;
	direction?: 'before' | 'after' | 'initial';
	mediaFilter?: MediaFilterType;
};

const GALLERY_CACHED_TIME = 1000 * 60 * 60;

export const fetchGalleryAttachments = createAsyncThunk(
	'gallery/fetchGalleryAttachments',
	async (
		{
			clanId,
			channelId,
			fileType = 'image',
			limit = 50,
			before,
			after,
			direction = 'initial',
			mediaFilter = 'image'
		}: fetchGalleryAttachmentsPayload,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.listChannelAttachments(mezon.session, clanId, channelId, fileType, undefined, limit, before, after);

			if (!response.attachments) {
				return { attachments: [], channelId, direction };
			}

			const attachments = response.attachments
				.filter((att) => {
					if (mediaFilter === 'all') {
						return att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) || att?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX);
					} else if (mediaFilter === 'image') {
						return att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX);
					} else if (mediaFilter === 'video') {
						return att?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX);
					}
					return false;
				})
				.map((attachmentRes) => ({
					...attachmentRes,
					id: attachmentRes.id || '',
					channelId,
					clanId,
					isVideo: attachmentRes?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX),
					create_time: attachmentRes.create_time_seconds
						? new Date(Number(attachmentRes.create_time_seconds) * 1000).toISOString()
						: undefined
				}))
				.sort((a, b) => {
					if (a.create_time_seconds && b.create_time_seconds) {
						return b.create_time_seconds - a.create_time_seconds;
					}
					return 0;
				}) as AttachmentEntity[];

			return { attachments, channelId, direction };
		} catch (error) {
			captureSentryError(error, 'gallery/fetchGalleryAttachments');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const getInitialChannelGalleryState = () => ({
	attachments: [] as AttachmentEntity[],
	pagination: {
		hasMoreBefore: true,
		hasMoreAfter: true,
		isLoading: false,
		limit: 50
	}
});

export const initialGalleryState: GalleryState = {
	loadingStatus: 'not loaded',
	error: null,
	galleryByChannel: {}
};

export const gallerySlice = createSlice({
	name: GALLERY_FEATURE_KEY,
	initialState: initialGalleryState,
	reducers: {
		setGalleryLoading: (state, action: PayloadAction<{ channelId: string; isLoading: boolean }>) => {
			const { channelId, isLoading } = action.payload;
			if (!state.galleryByChannel[channelId]) {
				state.galleryByChannel[channelId] = getInitialChannelGalleryState();
			}
			state.galleryByChannel[channelId].pagination.isLoading = isLoading;
		},

		setGalleryPaginationFlags: (
			state,
			action: PayloadAction<{
				channelId: string;
				hasMoreBefore?: boolean;
				hasMoreAfter?: boolean;
			}>
		) => {
			const { channelId, hasMoreBefore, hasMoreAfter } = action.payload;
			if (!state.galleryByChannel[channelId]) {
				state.galleryByChannel[channelId] = getInitialChannelGalleryState();
			}

			if (hasMoreBefore !== undefined) {
				state.galleryByChannel[channelId].pagination.hasMoreBefore = hasMoreBefore;
			}
			if (hasMoreAfter !== undefined) {
				state.galleryByChannel[channelId].pagination.hasMoreAfter = hasMoreAfter;
			}
		},

		clearGalleryChannel: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			delete state.galleryByChannel[channelId];
		},

		clearGalleryAttachments: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (state.galleryByChannel[channelId]) {
				state.galleryByChannel[channelId].attachments = [];
			}
		},

		resetGalleryPagination: (state, action: PayloadAction<{ channelId: string }>) => {
			const { channelId } = action.payload;
			if (!state.galleryByChannel[channelId]) {
				state.galleryByChannel[channelId] = getInitialChannelGalleryState();
			}
			state.galleryByChannel[channelId].pagination.hasMoreBefore = true;
			state.galleryByChannel[channelId].pagination.hasMoreAfter = true;
		},

		addGalleryAttachments: (state, action: PayloadAction<{ channelId: string; attachments: AttachmentEntity[] }>) => {
			const { channelId, attachments } = action.payload;
			if (!state.galleryByChannel[channelId]) {
				state.galleryByChannel[channelId] = getInitialChannelGalleryState();
			}

			const existingIds = new Set(state.galleryByChannel[channelId].attachments.map((att) => att.id || att.url));
			const newAttachments = attachments.filter((att) => !existingIds.has(att.id || att.url));

			state.galleryByChannel[channelId].attachments.push(...newAttachments);
			state.galleryByChannel[channelId].attachments.sort((a, b) => {
				if (a.create_time_seconds && b.create_time_seconds) {
					return b.create_time_seconds - a.create_time_seconds;
				}
				return 0;
			});
		}
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchGalleryAttachments.pending, (state: GalleryState, action) => {
				state.loadingStatus = 'loading';
				const { channelId } = action.meta.arg;
				if (!state.galleryByChannel[channelId]) {
					state.galleryByChannel[channelId] = getInitialChannelGalleryState();
				}
				state.galleryByChannel[channelId].pagination.isLoading = true;
			})
			.addCase(
				fetchGalleryAttachments.fulfilled,
				(
					state: GalleryState,
					action: PayloadAction<
						{ attachments: AttachmentEntity[]; channelId: string; direction: 'before' | 'after' | 'initial' },
						string,
						{ arg: fetchGalleryAttachmentsPayload }
					>
				) => {
					const { attachments, channelId, direction } = action.payload;

					if (!state.galleryByChannel[channelId]) {
						state.galleryByChannel[channelId] = getInitialChannelGalleryState();
					}

					const channelGallery = state.galleryByChannel[channelId];

					if (direction === 'before') {
						const allItemsAlreadyExist = attachments.every((att) =>
							channelGallery.attachments.some((existing) => existing.id === att.id)
						);
						channelGallery.pagination.hasMoreBefore = !allItemsAlreadyExist;
					} else if (direction === 'after') {
						const allItemsAlreadyExist = attachments.every((att) =>
							channelGallery.attachments.some((existing) => existing.id === att.id)
						);
						channelGallery.pagination.hasMoreAfter = !allItemsAlreadyExist;
					}

					if (direction === 'initial') {
						channelGallery.attachments = attachments;
					} else {
						const existingIds = new Set(channelGallery.attachments.map((att) => att.id || att.url));
						const newAttachments = attachments.filter((att) => !existingIds.has(att.id || att.url));

						if (direction === 'after') {
							channelGallery.attachments = [...newAttachments, ...channelGallery.attachments];
						} else {
							channelGallery.attachments = [...channelGallery.attachments, ...newAttachments];
						}
					}

					channelGallery.pagination.isLoading = false;
					channelGallery.cache = createCacheMetadata(GALLERY_CACHED_TIME);
					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchGalleryAttachments.rejected, (state: GalleryState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;

				const { channelId } = action.meta.arg;
				if (state.galleryByChannel[channelId]) {
					state.galleryByChannel[channelId].pagination.isLoading = false;
				}
			});
	}
});

export const galleryReducer = gallerySlice.reducer;

export const galleryActions = {
	...gallerySlice.actions,
	fetchGalleryAttachments
};

export const getGalleryState = (rootState: { [GALLERY_FEATURE_KEY]: GalleryState }): GalleryState => rootState[GALLERY_FEATURE_KEY];

export const selectGalleryAttachmentsByChannel = createSelector(
	[getGalleryState, (state, channelId: string) => channelId],
	(state, channelId) => state.galleryByChannel[channelId]?.attachments || []
);

export const selectGalleryPaginationByChannel = createSelector(
	[getGalleryState, (state, channelId: string) => channelId],
	(state, channelId) => state.galleryByChannel[channelId]?.pagination || getInitialChannelGalleryState().pagination
);
