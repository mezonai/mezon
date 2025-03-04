import { UploadLimitReason } from '@mezon/utils';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export const DRAG_AND_DROP_FEATURE_KEY = 'dragAndDrop';

export interface DragAndDropState {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
	draggingState: boolean;
	isOverLimitUpload: boolean;
	overLimitReason: UploadLimitReason;
}

export const initialDragAndDropState: DragAndDropState = {
	loadingStatus: 'not loaded',
	error: null,
	draggingState: false,
	isOverLimitUpload: false,
	overLimitReason: UploadLimitReason.COUNT
};

export const dragAndDropSlice = createSlice({
	name: DRAG_AND_DROP_FEATURE_KEY,
	initialState: initialDragAndDropState,
	reducers: {
		setDraggingState: (state, action) => {
			state.draggingState = action.payload;
		},
		setOverLimitUploadState: (state, action) => {
			state.isOverLimitUpload = action.payload;
		},
		setOverLimitReasonState: (state, action) => {
			state.overLimitReason = action.payload;
		}
	}
});

export const dragAndDropReducer = dragAndDropSlice.reducer;

export const dragAndDropAction = { ...dragAndDropSlice.actions };

export const getDragAndDropState = (rootState: { [DRAG_AND_DROP_FEATURE_KEY]: DragAndDropState }): DragAndDropState =>
	rootState[DRAG_AND_DROP_FEATURE_KEY];

export const selectDragAndDropState = createSelector(getDragAndDropState, (state) => state.draggingState);
export const selectOverLimitUploadState = createSelector(getDragAndDropState, (state) => state.isOverLimitUpload);
export const selectOverLimitReasonState = createSelector(getDragAndDropState, (state) => state.overLimitReason);
