import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { t } from 'i18next';
import { ensureSession, getMezonCtx } from '../helpers';
import { toastActions } from '../toasts/toasts.slice';

export const REPORT_MESSAGE_FEATURE_KEY = 'reportMessage';

export interface ReportMessagePayload {
	messageId: string;
	abuseType: string;
}

export interface ReportMessageState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isReportModalVisible?: boolean;
	reportingMessageId?: string | null;
}

export const initialReportMessageState: ReportMessageState = {
	loadingStatus: 'not loaded',
	error: null,
	isReportModalVisible: false,
	reportingMessageId: null
};

export const reportMessageAbuse = createAsyncThunk('reportMessage/reportMessageAbuse', async (payload: ReportMessagePayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.reportMessageAbuse(mezon.session, BigInt(payload.messageId), payload.abuseType);

		thunkAPI.dispatch(
			toastActions.addToast({
				message: t('common:reportMessage.success'),
				type: 'success'
			})
		);

		return response;
	} catch (error: unknown) {
		captureSentryError(error, 'reportMessage/reportMessageAbuse');
		const errorMessage = error instanceof Error ? error.message : t('common:reportMessage.failed');
		thunkAPI.dispatch(
			toastActions.addToast({
				message: errorMessage,
				type: 'error'
			})
		);
		return thunkAPI.rejectWithValue(error);
	}
});

export const reportMessageSlice = createSlice({
	name: REPORT_MESSAGE_FEATURE_KEY,
	initialState: initialReportMessageState,
	reducers: {
		setReportModalVisible: (state, action: PayloadAction<boolean>) => {
			state.isReportModalVisible = action.payload;
			if (!action.payload) {
				state.reportingMessageId = null;
			}
		},
		setReportingMessageId: (state, action: PayloadAction<string | null>) => {
			state.reportingMessageId = action.payload;
		},
		resetReportMessageState: (state) => {
			state.loadingStatus = 'not loaded';
			state.error = null;
			state.isReportModalVisible = false;
			state.reportingMessageId = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(reportMessageAbuse.pending, (state) => {
				state.loadingStatus = 'loading';
				state.error = null;
			})
			.addCase(reportMessageAbuse.fulfilled, (state) => {
				state.loadingStatus = 'loaded';
				state.error = null;
				state.isReportModalVisible = false;
				state.reportingMessageId = null;
			})
			.addCase(reportMessageAbuse.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message || t('common:reportMessage.failed');
			});
	}
});

export const reportMessageReducer = reportMessageSlice.reducer;

export const reportMessageActions = {
	...reportMessageSlice.actions,
	reportMessageAbuse
};

export const getReportMessageState = (rootState: { [REPORT_MESSAGE_FEATURE_KEY]: ReportMessageState }) => rootState[REPORT_MESSAGE_FEATURE_KEY];
export const selectReportMessageLoadingStatus = createSelector([getReportMessageState], (state) => state.loadingStatus);
export const selectReportMessageError = createSelector([getReportMessageState], (state) => state.error);
export const selectIsReportModalVisible = createSelector([getReportMessageState], (state) => state.isReportModalVisible);
export const selectReportingMessageId = createSelector([getReportMessageState], (state) => state.reportingMessageId);
