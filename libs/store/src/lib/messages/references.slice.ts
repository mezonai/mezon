import type { IMessage, PreSendAttachment } from '@mezon/utils';
import { AttachmentTypeUpload, MAX_FILE_ATTACHMENTS } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiMessageRef } from 'mezon-js/api.gen';

export const REFERENCES_FEATURE_KEY = 'references';

/*
 * Update these interfaces according to your requirements.
 */
export interface ReferencesEntity extends IMessage {
	id: string;
}

export interface IAttachmentFile {
	name: string;
	path: string;
	type: string;
	size: number;
}

export interface ReferencesState extends EntityState<ReferencesEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
	dataReferences: Record<string, ApiMessageRef>;
	openEditMessageState: boolean;
	idMessageRefReaction: string;
	idMessageRefEdit: string;
	idMessageMention: string;
	attachmentAfterUpload: Record<string, PreSendAttachment>;
	geoLocation?: { latitude: number; longitude: number };
	ogpPreview: {
		url: string;
		index: number;
		channel_id: string;
	} | null;
	ogpData: OgpEntity | null;
}

export interface OgpEntity {
	url: string;
	image: string;
	index: number;
	title?: string;
	description?: string;
	channel_id: string;
	type?: string;
}

export const referencesAdapter = createEntityAdapter<ReferencesEntity>();

export const fetchReferences = createAsyncThunk<ReferencesEntity[]>('references/fetchStatus', async (_, thunkAPI) => {
	return Promise.resolve([]);
});

export const initialReferencesState: ReferencesState = referencesAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	dataReferences: {},
	openEditMessageState: false,
	idMessageRefReaction: '',
	idMessageRefEdit: '',
	idMessageMention: '',
	attachmentAfterUpload: {},
	geoLocation: undefined,
	ogpPreview: null,
	ogpData: null
});

export const referencesSlice = createSlice({
	name: REFERENCES_FEATURE_KEY,
	initialState: initialReferencesState,
	reducers: {
		add: referencesAdapter.addOne,
		remove: referencesAdapter.removeOne,

		setMessageMentionId(state, action) {
			state.idMessageMention = action.payload;
		},

		setDataReferences(state, action: PayloadAction<{ channelId: string; dataReferences: ApiMessageRef }>) {
			if (action.payload !== null) {
				const { channelId, dataReferences } = action.payload;
				if (state.dataReferences[channelId]) {
					delete state.dataReferences[channelId];
				}
				state.dataReferences[channelId] = dataReferences;
			}
		},

		clearDataReferences(state, action: PayloadAction<string>) {
			const channelId = action.payload;
			if (channelId && state.dataReferences[channelId]) {
				delete state.dataReferences[channelId];
			}
		},

		resetAfterReply(state, action: PayloadAction<string>) {
			const channelId = action.payload;
			if (channelId) {
				if (state.dataReferences[channelId]) {
					delete state.dataReferences[channelId];
				}
				if (state.openEditMessageState) {
					state.openEditMessageState = false;
				}
				if (state.idMessageRefEdit) {
					state.idMessageRefEdit = '';
				}
			}
		},

		setOpenEditMessageState(state, action) {
			state.openEditMessageState = action.payload;
		},
		setAtachmentAfterUpload(state, action: PayloadAction<PreSendAttachment>) {
			const newAttachment = action.payload;
			const { channelId, files } = newAttachment;
			if (!channelId) {
				return;
			}

			if (!state.attachmentAfterUpload[channelId] && files?.length <= MAX_FILE_ATTACHMENTS) {
				state.attachmentAfterUpload[channelId] = {
					channelId,
					files
				};
			} else {
				if (
					files &&
					files.length > 0 &&
					(state.attachmentAfterUpload[channelId]?.files?.length || 0) + files?.length <= MAX_FILE_ATTACHMENTS
				) {
					state.attachmentAfterUpload[channelId].files = [...state.attachmentAfterUpload[channelId].files, ...files];
				}
			}

			if (files && files.length === 0) {
				delete state.attachmentAfterUpload[channelId];
			}
		},

		removeAttachment(state, action: PayloadAction<{ channelId: string; index: number }>) {
			const { channelId, index } = action.payload;

			const attachment = state.attachmentAfterUpload[channelId];

			if (attachment) {
				if (index >= 0 && index < attachment.files.length) {
					// Remove the file at the specified index
					attachment.files.splice(index, 1);

					// If no files are left, remove the attachment entry
					if (attachment.files.length === 0) {
						delete state.attachmentAfterUpload[channelId];
					} else {
						// Update the attachment entry with the remaining files
						state.attachmentAfterUpload[channelId] = {
							...attachment,
							files: [...attachment.files]
						};
					}
				}
			}
		},

		removeAttachmentByFileName(state, action: PayloadAction<{ channelId: string; fileName: string }>) {
			const { channelId, fileName } = action.payload;
			const attachment = state.attachmentAfterUpload[channelId];

			if (attachment) {
				const fileIndex = attachment.files.findIndex((file) => file?.filename === fileName);

				if (fileIndex >= 0) {
					attachment.files.splice(fileIndex, 1);

					// If no files are left, remove the attachment entry
					if (attachment.files.length === 0) {
						delete state.attachmentAfterUpload[channelId];
					}
				}
			}
		},

		replaceAttachments(state, action: PayloadAction<PreSendAttachment>) {
			const newAttachment = action.payload;
			const { channelId, files } = newAttachment;

			if (!channelId || !files) {
				return;
			}

			if (!state.attachmentAfterUpload[channelId]) {
				state.attachmentAfterUpload[channelId] = {
					channelId,
					files: []
				};
			}
			const existingFilesExcBlob = state.attachmentAfterUpload[channelId].files.filter(
				(file) => file.url && !file.url.startsWith(AttachmentTypeUpload.BLOB)
			);
			const newFilesExcBlob = files.filter((file) => file.url && !file.url.startsWith(AttachmentTypeUpload.BLOB));
			const filesAreIdentical =
				existingFilesExcBlob.length === newFilesExcBlob.length &&
				existingFilesExcBlob.every((file, index) => file.url === newFilesExcBlob[index].url);

			if (filesAreIdentical) return;

			///
			const existingFilesBlob = state.attachmentAfterUpload[channelId].files.filter(
				(file) => file.url && file.url.startsWith(AttachmentTypeUpload.BLOB)
			);

			state.attachmentAfterUpload[channelId].files = [
				...existingFilesBlob,
				...files.filter((file) => file.url && !file.url.startsWith(AttachmentTypeUpload.BLOB))
			];
		},

		setIdReferenceMessageReaction(state, action) {
			state.idMessageRefReaction = action.payload;
		},
		setIdReferenceMessageEdit(state, action) {
			state.idMessageRefEdit = action.payload;
		},
		setGeolocation(state, action) {
			state.geoLocation = action.payload;
		},
		resetEditReplyStates(state) {
			state.openEditMessageState = false;
			state.idMessageRefEdit = '';
			state.idMessageRefReaction = '';
			state.idMessageMention = '';
		},
		setOgpPreview(
			state,
			action: PayloadAction<{
				url: string;
				index: number;
				channel_id: string;
			} | null>
		) {
			state.ogpPreview = action.payload;
		},
		setOgpData(
			state,
			action: PayloadAction<{
				url: string;
				image: string;
				index: number;
				title?: string;
				description?: string;
				channel_id: string;
				type?: string;
			} | null>
		) {
			state.ogpData = action.payload;
		},
		clearAttachmentDraft(state, action: PayloadAction<string>) {
			delete state.attachmentAfterUpload[action.payload];
		},
		clearOgpData(state) {
			state.ogpData = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchReferences.pending, (state: ReferencesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchReferences.fulfilled, (state: ReferencesState, action: PayloadAction<ReferencesEntity[]>) => {
				referencesAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchReferences.rejected, (state: ReferencesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const referencesReducer = referencesSlice.reducer;

export const referencesActions = {
	...referencesSlice.actions
};

export const getReferencesState = (rootState: { [REFERENCES_FEATURE_KEY]: ReferencesState }): ReferencesState => rootState[REFERENCES_FEATURE_KEY];

export const selectDataReferences = createSelector([getReferencesState, (_, channelId: string) => channelId], (state: ReferencesState, channelId) => {
	return state.dataReferences[channelId] || '';
});

export const selectOpenEditMessageState = createSelector(getReferencesState, (state: ReferencesState) => state.openEditMessageState);

export const selectIdMessageRefReaction = createSelector(getReferencesState, (state: ReferencesState) => state.idMessageRefReaction);

export const selectIdMessageRefEdit = createSelector(getReferencesState, (state: ReferencesState) => state.idMessageRefEdit);

export const selectAttachmentAfterUpload = createSelector(getReferencesState, (state: ReferencesState) => state?.attachmentAfterUpload);

export const selectAttachmentByChannelId = createSelector(
	[selectAttachmentAfterUpload, (_, channelId: string) => channelId],
	(attachmentAfterUpload, channelId) => attachmentAfterUpload[channelId] || null
);

export const selectOgpPreview = createSelector(getReferencesState, (state: ReferencesState) => state.ogpPreview);
export const selectOgpData = createSelector(getReferencesState, (state: ReferencesState) => state.ogpData);
