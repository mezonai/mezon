import { AttachmentTypeUpload, IMessage, PreSendAttachment } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageRef } from 'mezon-js/api.gen';
import { MessagesEntity } from './messages.slice';

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
	messageReactionSelected: MessagesEntity | null | undefined;
	modeSelected: ChannelStreamMode | undefined;
	idMessageRefEdit: string;
	idMessageMention: string;
	attachmentAfterUpload: Record<string, PreSendAttachment>;
	geoLocation?: { latitude: number; longitude: number };
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
	messageReactionSelected: null,
	idMessageRefEdit: '',
	idMessageMention: '',
	attachmentAfterUpload: {},
	geoLocation: undefined,
	modeSelected: undefined
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
				state.dataReferences[action.payload.channelId] = action.payload.dataReferences;
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

			if (!state.attachmentAfterUpload[channelId] && files?.length <= 10) {
				state.attachmentAfterUpload[channelId] = {
					channelId: channelId,
					files: files
				};
			} else {
				// eslint-disable-next-line prettier/prettier
				if (files && files.length > 0 && state.attachmentAfterUpload[channelId].files.length + files.length <= 10) {
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

		replaceAttachments(state, action: PayloadAction<PreSendAttachment>) {
			const newAttachment = action.payload;
			const { channelId, files } = newAttachment;

			if (!channelId || !files) {
				return;
			}

			if (!state.attachmentAfterUpload[channelId]) {
				state.attachmentAfterUpload[channelId] = {
					channelId: channelId,
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

		setMessageReactionSelected(state, action) {
			state.messageReactionSelected = action.payload;
		},
		setModeSelected(state, action) {
			state.modeSelected = action.payload;
		},
		setIdReferenceMessageEdit(state, action) {
			state.idMessageRefEdit = action.payload;
		},
		setGeolocation(state, action) {
			state.geoLocation = action.payload;
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

const { selectAll, selectEntities } = referencesAdapter.getSelectors();

export const getReferencesState = (rootState: { [REFERENCES_FEATURE_KEY]: ReferencesState }): ReferencesState => rootState[REFERENCES_FEATURE_KEY];

export const selectAllReferences = createSelector(getReferencesState, selectAll);

export const selectReferencesEntities = createSelector(getReferencesState, selectEntities);

export const selectDataReferences = (channelId: string) =>
	createSelector(getReferencesState, (state: ReferencesState) => {
		return state.dataReferences[channelId] || '';
	});

export const selectOpenEditMessageState = createSelector(getReferencesState, (state: ReferencesState) => state.openEditMessageState);

export const selectMessageReaction = createSelector(getReferencesState, (state: ReferencesState) => state.messageReactionSelected);

export const selectMode = createSelector(getReferencesState, (state: ReferencesState) => state.modeSelected);

export const selectIdMessageRefEdit = createSelector(getReferencesState, (state: ReferencesState) => state.idMessageRefEdit);

export const selectMessageMetionId = createSelector(getReferencesState, (state: ReferencesState) => state.idMessageMention);

export const selectAttachmentAfterUpload = createSelector(getReferencesState, (state: ReferencesState) => state.attachmentAfterUpload);

export const selectAttachmentByChannelId = (channelId: string) =>
	createSelector(selectAttachmentAfterUpload, (attachmentAfterUpload) => attachmentAfterUpload[channelId] || null);

export const selectGeolocation = createSelector(getReferencesState, (state: ReferencesState) => state.geoLocation);
