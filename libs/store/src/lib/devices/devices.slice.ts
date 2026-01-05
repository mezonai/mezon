import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ensureSession, getMezonCtx } from '../helpers';

export const DEVICES_FEATURE_KEY = 'devices';

export interface IDevice {
	deviceId: string;
	device_name?: string;
	ip?: string;
	last_active?: string;
	login_at?: string;
	platform?: string;
	status?: number;
	is_current_device?: boolean;
	location?: string;
}

export interface DevicesState extends EntityState<IDevice, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentDeviceId: string | null;
}

export const devicesAdapter = createEntityAdapter<IDevice, string>({
	selectId: (device) => device.deviceId
});

export const initialDevicesState: DevicesState = devicesAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	currentDeviceId: null
});

export const fetchListLoggedDevices = createAsyncThunk('devices/fetchListLoggedDevices', async (_, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listLogedDevice(mezon.session);
		return (response?.devices || []) as IDevice[];
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
		return thunkAPI.rejectWithValue(errorMessage);
	}
});

export const devicesSlice = createSlice({
	name: DEVICES_FEATURE_KEY,
	initialState: initialDevicesState,
	reducers: {
		setCurrentDeviceId(state, action: PayloadAction<string>) {
			state.currentDeviceId = action.payload;
		},
		clearDevices(state) {
			devicesAdapter.removeAll(state);
			state.loadingStatus = 'not loaded';
			state.error = null;
		},
		removeDevice(state, action: PayloadAction<string>) {
			devicesAdapter.removeOne(state, action.payload);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListLoggedDevices.pending, (state) => {
				state.loadingStatus = 'loading';
				state.error = null;
			})
			.addCase(fetchListLoggedDevices.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				devicesAdapter.setAll(state, action.payload);

				const currentDevice = action.payload.find((device) => device.is_current_device);
				if (currentDevice) {
					state.currentDeviceId = currentDevice.deviceId;
				}
			})
			.addCase(fetchListLoggedDevices.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.payload as string;
			});
	}
});

export const devicesReducer = devicesSlice.reducer;

export const devicesActions = {
	...devicesSlice.actions,
	fetchListLoggedDevices
};

const { selectAll, selectEntities, selectById } = devicesAdapter.getSelectors();

export const getDevicesState = (rootState: { [DEVICES_FEATURE_KEY]: DevicesState }): DevicesState => rootState[DEVICES_FEATURE_KEY];

export const selectAllDevices = createSelector(getDevicesState, selectAll);

export const selectDevicesEntities = createSelector(getDevicesState, selectEntities);

export const selectDevicesLoadingStatus = createSelector(getDevicesState, (state) => state.loadingStatus);

export const selectDevicesError = createSelector(getDevicesState, (state) => state.error);

export const selectCurrentDeviceId = createSelector(getDevicesState, (state) => state.currentDeviceId);

export const selectCurrentDevice = createSelector([getDevicesState, selectCurrentDeviceId], (state, currentDeviceId) => {
	if (!currentDeviceId) return null;
	return state.entities[currentDeviceId] || null;
});

export const selectOtherDevices = createSelector([selectAllDevices, selectCurrentDeviceId], (devices, currentDeviceId) => {
	return devices.filter((device) => device.deviceId !== currentDeviceId);
});

export const selectDeviceById = (deviceId: string) => createSelector(getDevicesState, (state) => selectById(state, deviceId));
