import { GET_WINDOW_STATE, MAC_WINDOWS_ACTION, WINDOW_STATE_CHANGED } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import isElectron from 'is-electron';

export const WINDOW_CONTROLS_FEATURE_KEY = 'windowControls';

// Enum for window control actions
export enum WindowControlAction {
	MINIMIZE = 'APP::MINIMIZE_WINDOW',
	MAXIMIZE = 'APP::MAXIMIZE_WINDOW',
	UNMAXIMIZE = 'APP::UNMAXIMIZE_WINDOW',
	CLOSE = 'APP::CLOSE_APP'
}

export interface WindowControlsState {
	isMaximized: boolean;
	isWindowFocused: boolean;
}

export const initialWindowControlsState: WindowControlsState = {
	isMaximized: false,
	isWindowFocused: true
};

// Async thunks for window operations
export const sendTitleBarAction = createAsyncThunk('windowControls/sendTitleBarAction', async (action: WindowControlAction) => {
	if (typeof window !== 'undefined' && window.electron?.send) {
		window.electron.send(MAC_WINDOWS_ACTION, action);
	}
	return action;
});

export const minimizeWindow = createAsyncThunk('windowControls/minimizeWindow', async (_, { dispatch }) => {
	await dispatch(sendTitleBarAction(WindowControlAction.MINIMIZE));
});

export const maximizeWindow = createAsyncThunk('windowControls/maximizeWindow', async (_, { dispatch, getState }) => {
	const state = getState() as { [WINDOW_CONTROLS_FEATURE_KEY]: WindowControlsState };
	const { isMaximized } = state[WINDOW_CONTROLS_FEATURE_KEY];
	const action = isMaximized ? WindowControlAction.UNMAXIMIZE : WindowControlAction.MAXIMIZE;
	await dispatch(sendTitleBarAction(action));
	return !isMaximized;
});

export const closeWindow = createAsyncThunk('windowControls/closeWindow', async (_, { dispatch }) => {
	await dispatch(sendTitleBarAction(WindowControlAction.CLOSE));
});

export const checkMaximizedState = createAsyncThunk('windowControls/checkMaximizedState', async () => {
	if (isElectron() && window.electron?.invoke) {
		try {
			const state = (await window.electron.invoke(GET_WINDOW_STATE)) as unknown as { isMaximized: boolean };
			return state.isMaximized;
		} catch (error) {
			console.warn('Could not check window maximized state:', error);
			return false;
		}
	}
	return false;
});

// Action to listen for window state changes from main process
export const listenToWindowStateChanges = () => (dispatch: (action: PayloadAction<boolean>) => void) => {
	if (isElectron() && window.electron?.on) {
		window.electron.on(WINDOW_STATE_CHANGED, (data: { isMaximized: boolean }) => {
			dispatch(windowControlsActions.setIsMaximized(data.isMaximized));
		});
	}
};

export const windowControlsSlice = createSlice({
	name: WINDOW_CONTROLS_FEATURE_KEY,
	initialState: initialWindowControlsState,
	reducers: {
		setIsMaximized: (state, action: PayloadAction<boolean>) => {
			state.isMaximized = action.payload;
		},
		setIsWindowFocused: (state, action: PayloadAction<boolean>) => {
			state.isWindowFocused = action.payload;
		},
		toggleMaximized: (state) => {
			state.isMaximized = !state.isMaximized;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(maximizeWindow.fulfilled, (state, action) => {
				state.isMaximized = action.payload;
			})
			.addCase(checkMaximizedState.fulfilled, (state, action) => {
				state.isMaximized = action.payload;
			});
	}
});

// Selectors
export const getWindowControlsState = (rootState: { [WINDOW_CONTROLS_FEATURE_KEY]: WindowControlsState }): WindowControlsState =>
	rootState[WINDOW_CONTROLS_FEATURE_KEY];

export const selectIsMaximized = createSelector(getWindowControlsState, (state) => state.isMaximized);

export const selectIsWindowFocused = createSelector(getWindowControlsState, (state) => state.isWindowFocused);
// Actions
export const windowControlsActions = windowControlsSlice.actions;

// Reducer
export const windowControlsReducer = windowControlsSlice.reducer;

export default windowControlsSlice.reducer;
