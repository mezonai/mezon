import { ETypeLinkMedia, IChannelAttachment, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelStreamMode } from 'mezon-js';
import { ApiChannelAttachment } from 'mezon-js/dist/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

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
	listAttachmentsByChannel: Record<string, AttachmentEntity[]>;
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
	noCache?: boolean;
};

const CHANNEL_ATTACHMENTS_CACHED_TIME = 1000 * 60 * 3;
const fetchChannelAttachmentsCached = memoizeAndTrack(
	(mezon: MezonValueContext, clanId: string, channelId: string) => mezon.client.listChannelAttachments(mezon.session, clanId, channelId, ''),
	{
		promise: true,
		maxAge: CHANNEL_ATTACHMENTS_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[2] + args[0].session.username;
		}
	}
);

export const mapChannelAttachmentsToEntity = (attachmentRes: ApiChannelAttachment, channelId?: string, clanId?: string) => {
	return { ...attachmentRes, id: attachmentRes.id || '', channelId, clanId };
};

export const fetchChannelAttachments = createAsyncThunk(
	'attachment/fetchChannelAttachments',
	async ({ clanId, channelId, noCache }: fetchChannelAttachmentsPayload, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchChannelAttachmentsCached.clear();
		}

		const response = await fetchChannelAttachmentsCached(mezon, channelId, clanId);

		if (!response.attachments) {
			return [];
		}

		const attachments = response.attachments.map((attachmentRes) => mapChannelAttachmentsToEntity(attachmentRes, channelId, clanId));
		return attachments;
	}
);

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
		addAttachments: (state, action: PayloadAction<{ listAttachments: AttachmentEntity[]; channelId: string }>) => {
			const currentChannelId = action?.payload?.channelId;
			if (state.listAttachmentsByChannel[currentChannelId]) {
				action?.payload?.listAttachments.map((attachment) => {
					state.listAttachmentsByChannel?.[currentChannelId]?.unshift?.(attachment);
				});
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelAttachments.pending, (state: AttachmentState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannelAttachments.fulfilled, (state: AttachmentState, action) => {
				const currentChannelId = action?.payload?.[0]?.channelId as string;
				if (action.payload.length > 0 && !Object.prototype.hasOwnProperty.call(state.listAttachmentsByChannel, currentChannelId)) {
					attachmentAdapter.setAll(state, action.payload);
					state.listAttachmentsByChannel[currentChannelId] = action.payload;
				}
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchChannelAttachments.rejected, (state: AttachmentState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
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
const { selectAll, selectEntities } = attachmentAdapter.getSelectors();

export const getAttachmentState = (rootState: { [ATTACHMENT_FEATURE_KEY]: AttachmentState }): AttachmentState => rootState[ATTACHMENT_FEATURE_KEY];

export const selectAllAttachment = createSelector(getAttachmentState, selectAll);

export const selectAttachmentEntities = createSelector(getAttachmentState, selectEntities);

export const selectAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.attachment);

export const selectCurrentAttachmentShowImage = createSelector(getAttachmentState, (state: AttachmentState) => state.currentAttachment);

export const selectOpenModalAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.openModalAttachment);

export const selectModeAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.mode);

export const selectMessageIdAttachment = createSelector(getAttachmentState, (state: AttachmentState) => state.messageId);

export const selectAttachmentPhoto = () =>
	createSelector(selectAllAttachment, (attachments) => (attachments || []).filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX)));

export const selectAllListAttachmentByChannel = (channelId: string) =>
	createSelector(getAttachmentState, (state) => {
		if (!Object.prototype.hasOwnProperty.call(state.listAttachmentsByChannel, channelId)) {
			return [];
		}
		return state.listAttachmentsByChannel[channelId].filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX));
	});

export const checkListAttachmentExist = (channelId: string) =>
	createSelector(getAttachmentState, (state) => Boolean(state.listAttachmentsByChannel[channelId]));
