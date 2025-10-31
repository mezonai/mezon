import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { clearApiCallTracker } from '../cache-metadata';
import { listChannelsByUserActions } from '../channels/channelUser.slice';
import { channelsActions } from '../channels/channels.slice';
import { usersClanActions } from '../clanMembers/clan.members';
import { clansActions } from '../clans/clans.slice';
import { directActions } from '../direct/direct.slice';
import { createCachedSelector, messagesActions } from '../messages/messages.slice';
import type { RootState } from '../store';
import { voiceActions } from '../voice/voice.slice';

export const APP_FEATURE_KEY = 'app';
const NUMBER_HISTORY = 10;

export interface showSettingFooterProps {
	status: boolean;
	initTab: string;
	profileInitTab: string;
	clanId: string;
	isUserProfile?: boolean;
}

export interface AppState {
	themeApp: 'light' | 'dark' | 'sunrise' | 'purple_haze' | 'redDark' | 'abyss_dark';
	currentLanguage: 'en' | 'vi';
	loadingStatus: LoadingStatus;
	error?: string | null;
	isShowMemberList: boolean;
	isShowChatStream: boolean;
	isShowChatVoice: boolean;
	chatStreamWidth: number;
	isShowCanvas: boolean;
	isShowMemberListDM: boolean;
	isUseProfileDM: boolean;
	initialPath?: string;
	initialParams?: Record<string, string>;
	closeMenu: boolean;
	statusMenu: boolean;
	hiddenBottomTabMobile: boolean;
	hasInternetMobile: boolean;
	loadingMainMobile: boolean;
	isFromFcmMobile: boolean;
	isShowSettingFooter: showSettingFooterProps;
	isShowPopupQuickMess: boolean;
	categoryChannelOffsets: { [key: number]: number };
	isShowWelcomeMobile: boolean;
	history: {
		url: string[];
		current: number | null;
	};
	isShowUpdateUsername: boolean;
}

const getInitialLanguage = (): 'en' | 'vi' => {
	if (typeof window !== 'undefined') {
		const storedLang = localStorage.getItem('i18nextLng');
		if (storedLang === 'vi' || storedLang === 'en') {
			return storedLang;
		}
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (timezone === 'Asia/Ho_Chi_Minh' || timezone === 'Asia/Saigon') {
			return 'vi';
		}

		const browserLang = navigator.language.toLowerCase();
		if (browserLang.startsWith('vi')) {
			return 'vi';
		}
	}
	return 'en';
};

export const initialAppState: AppState = {
	loadingStatus: 'not loaded',

	themeApp: 'sunrise',
	currentLanguage: getInitialLanguage(),
	isShowMemberList: true,
	isShowChatStream: false,
	isShowChatVoice: false,
	chatStreamWidth: 0,
	isShowCanvas: true,
	isShowMemberListDM: true,
	isUseProfileDM: true,
	initialPath: '/',
	initialParams: {},
	closeMenu: false,
	statusMenu: true,
	hiddenBottomTabMobile: false,
	hasInternetMobile: true,
	loadingMainMobile: false,
	isFromFcmMobile: false,
	isShowSettingFooter: { status: false, initTab: 'Account', isUserProfile: true, profileInitTab: 'USER_SETTING', clanId: '' },
	isShowPopupQuickMess: false,
	categoryChannelOffsets: {},
	isShowWelcomeMobile: true,
	history: {
		url: [],
		current: null
	},
	isShowUpdateUsername: false
};

export const refreshApp = createAsyncThunk('app/refreshApp', async ({ id }: { id: string }, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;

		if (!state) {
			throw Error('refresh app error: state does not init');
		}

		clearApiCallTracker();

		const isClanView = state?.clans?.currentClanId && state.clans.currentClanId !== '0';
		const currentChannelId = state.channels?.byClans[state.clans?.currentClanId as string]?.currentChannelId;
		const currentDirectId = state.direct?.currentDirectMessageId;
		const currentClanId = state.clans?.currentClanId;
		const path = isElectron() ? window.location.hash : window.location.pathname;

		let channelId = null;
		let clanId = null;
		if (currentChannelId && RegExp(currentChannelId).test(path)) {
			clanId = currentClanId;
			channelId = currentChannelId;
		} else if (currentDirectId && RegExp(currentDirectId).test(path)) {
			clanId = '0';
			channelId = currentDirectId;
		}

		channelId &&
			thunkAPI.dispatch(
				messagesActions.fetchMessages({
					clanId: clanId || '',
					channelId,
					isFetchingLatestMessages: true,
					isClearMessage: true,
					noCache: true
				})
			);

		thunkAPI.dispatch(clansActions.joinClan({ clanId: '0' }));
		thunkAPI.dispatch(clansActions.fetchClans({}));
		thunkAPI.dispatch(listChannelsByUserActions.fetchListChannelsByUser({}));

		if (isClanView && currentClanId) {
			thunkAPI.dispatch(usersClanActions.fetchUsersClan({ clanId: currentClanId }));
			thunkAPI.dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true }));
			thunkAPI.dispatch(clansActions.joinClan({ clanId: currentClanId }));
			thunkAPI.dispatch(
				voiceActions.fetchVoiceChannelMembers({
					clanId: currentClanId ?? '',
					channelId: '',
					channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE
				})
			);
		}

		thunkAPI.dispatch(directActions.fetchDirectMessage({ noCache: true }));
	} catch (error) {
		captureSentryError(error, 'app/refreshApp');
		return thunkAPI.rejectWithValue(error);
	}
});

export const appSlice = createSlice({
	name: APP_FEATURE_KEY,
	initialState: initialAppState,
	reducers: {
		setTheme: (state, action) => {
			state.themeApp = action.payload;
		},
		setLanguage: (state, action) => {
			state.currentLanguage = action.payload;
		},
		setIsShowMemberList: (state, action) => {
			state.isShowMemberList = action.payload;
		},
		toggleIsShowMemberList: (state) => {
			state.isShowMemberList = !state.isShowMemberList;
		},
		setIsShowChatStream: (state, action) => {
			state.isShowChatStream = action.payload;
		},
		setIsShowChatVoice: (state, action) => {
			state.isShowChatVoice = action.payload;
		},
		setChatStreamWidth: (state, action) => {
			state.chatStreamWidth = action.payload;
		},
		setIsShowCanvas: (state, action) => {
			state.isShowCanvas = action.payload;
		},
		setInitialPath: (state, action) => {
			state.initialPath = action.payload;
		},
		setInitialParams: (state, action) => {
			state.initialParams = action.payload;
		},
		setCloseMenu: (state, action) => {
			state.closeMenu = action.payload;
		},
		setIsShowMemberListDM: (state, action) => {
			state.isShowMemberListDM = action.payload;
		},
		setIsUseProfileDM: (state, action) => {
			state.isUseProfileDM = action.payload;
		},
		setStatusMenu: (state, action) => {
			state.statusMenu = action.payload;
		},
		setHiddenBottomTabMobile: (state, action) => {
			state.hiddenBottomTabMobile = action.payload;
		},
		setHasInternetMobile: (state, action) => {
			state.hasInternetMobile = action.payload;
		},
		setLoadingMainMobile: (state, action) => {
			state.loadingMainMobile = action.payload;
		},
		setIsFromFCMMobile: (state, action) => {
			state.isFromFcmMobile = action.payload;
		},
		setIsShowSettingFooterStatus: (state, action) => {
			state.isShowSettingFooter = {
				...state.isShowSettingFooter,
				status: action.payload
			};
		},
		setIsShowSettingFooterInitTab: (state, action) => {
			state.isShowSettingFooter = {
				...state.isShowSettingFooter,
				initTab: action.payload
			};
		},

		setIsShowSettingProfileInitTab: (state, action) => {
			state.isShowSettingFooter = {
				...state.isShowSettingFooter,
				profileInitTab: action.payload
			};
		},

		setClanIdSettingProfile: (state, action) => {
			state.isShowSettingFooter = {
				...state.isShowSettingFooter,
				clanId: action.payload
			};
		},

		setIsUserProfile: (state, action) => {
			state.isShowSettingFooter = {
				...state.isShowSettingFooter,
				isUserProfile: action.payload
			};
		},
		setIsShowPopupQuickMess: (state, action) => {
			state.isShowPopupQuickMess = action.payload;
		},
		setIsShowWelcomeMobile: (state, action) => {
			state.isShowWelcomeMobile = action.payload;
		},
		setHistory: (state, action) => {
			if (!state.history) {
				state.history = {
					url: [],
					current: null
				};
			}

			const url = action.payload;
			if (state.history.current !== null && state.history.url[state.history.current] === url) {
				return;
			}
			if (state.history.current !== null && state.history.url.length - 2 >= state.history.current && state.history.current > 0) {
				const history = [...state.history.url].splice(0, state.history.current + 1);
				history.push(url);
				state.history = {
					url: history.slice(-NUMBER_HISTORY),
					current: history.length > NUMBER_HISTORY ? NUMBER_HISTORY - 1 : history.length - 1
				};
				return;
			}

			const history = [...state.history.url, url];

			state.history = {
				url: history.slice(-NUMBER_HISTORY),
				current: history.length > NUMBER_HISTORY ? NUMBER_HISTORY - 1 : history.length - 1
			};
		},
		setBackHistory: (state, action) => {
			if (!state.history) return;
			if (state.history.current === null) return;
			if (action.payload) {
				if (!state.history.current) {
					return;
				}
				state.history.current = state.history.current - 1;
				return;
			} else {
				if (state.history.current === state.history.url.length - 1) {
					return;
				}
				state.history.current = state.history.current + 1;
			}
		},
		clearHistory: (state) => {
			state.history = {
				url: [],
				current: null
			};
		},
		cleanHistoryClan: (state, action: PayloadAction<string>) => {
			const clanId = action.payload;
			if (!state.history || !state.history?.url?.length) return;
			const filteredHistory = state.history.url.filter((url) => !url.includes(`/clans/${clanId}/`));
			let countCurrent = state.history?.current !== null ? state.history?.current : 0;
			state.history.url.map((url, index) => {
				if (index <= countCurrent && url.includes(`/clans/${clanId}/`)) {
					if (!state.history?.current) {
						return;
					}
					countCurrent = countCurrent - 1;
				}
			});
			state.history = {
				url: filteredHistory,
				current: countCurrent
			};
		},
		clearHistoryChannel: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.history || !state.history?.url?.length) return;
			const filteredHistory = state.history?.url.filter(
				(url) => !(url.includes(`/channels/${channelId}/`) || url.includes(`/message/${channelId}/`))
			);
			let countCurrent = state.history?.current !== null ? state.history.current : 0;
			state.history.url.map((url, index) => {
				if (index <= countCurrent && (url.includes(`/channels/${channelId}/`) || url.includes(`/message/${channelId}/`))) {
					if (!state.history.current) {
						return;
					}
					countCurrent = countCurrent - 1;
				}
			});
			state.history = {
				url: filteredHistory,
				current: countCurrent
			};
		},
		setIsShowUpdateUsername: (state, action) => {
			state.isShowUpdateUsername = action.payload;
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const appReducer = appSlice.reducer;

export const appActions = { ...appSlice.actions, refreshApp };

export const getAppState = (rootState: { [APP_FEATURE_KEY]: AppState }): AppState => rootState[APP_FEATURE_KEY];

export const selectAllApp = createSelector(getAppState, (state: AppState) => state);

export const selectTheme = createSelector(getAppState, (state: AppState) => state.themeApp);

export const selectCurrentLanguage = createSelector(getAppState, (state: AppState) => state.currentLanguage || 'en');

export const selectError = createSelector(getAppState, (state: AppState) => state.error);

export const selectIsShowMemberList = createSelector(getAppState, (state: AppState) => state.isShowMemberList);

export const selectIsShowChatStream = createSelector(getAppState, (state: AppState) => state.isShowChatStream);
export const selectIsShowChatVoice = createSelector(getAppState, (state: AppState) => state.isShowChatVoice);

export const selectChatStreamWidth = createSelector(getAppState, (state: AppState) => state.chatStreamWidth);

export const selectIsShowCanvas = createSelector(getAppState, (state: AppState) => state.isShowCanvas);

export const selectInitialPath = createCachedSelector(getAppState, (state: AppState) => state.initialPath);

export const selectInitialParams = createCachedSelector(getAppState, (state: AppState) => state.initialParams);

export const selectCloseMenu = createSelector(getAppState, (state: AppState) => state.closeMenu);

export const selectIsShowMemberListDM = createSelector(getAppState, (state: AppState) => state.isShowMemberListDM);

export const selectIsUseProfileDM = createSelector(getAppState, (state: AppState) => state.isUseProfileDM);

export const selectStatusMenu = createSelector(getAppState, (state: AppState) => state.statusMenu);

export const selectHiddenBottomTabMobile = createSelector(getAppState, (state: AppState) => state.hiddenBottomTabMobile);

export const selectHasInternetMobile = createSelector(getAppState, (state: AppState) => state.hasInternetMobile);

export const selectLoadingMainMobile = createSelector(getAppState, (state: AppState) => state.loadingMainMobile);

export const selectIsFromFCMMobile = createSelector(getAppState, (state: AppState) => state.isFromFcmMobile);

export const selectIsShowSettingFooter = createSelector(getAppState, (state: AppState) => state.isShowSettingFooter);

export const selectIsShowPopupQuickMess = createSelector(getAppState, (state: AppState) => state.isShowPopupQuickMess);

export const selectIsShowWelcomeMobile = createSelector(getAppState, (state: AppState) => state.isShowWelcomeMobile);

export const selectHistory = createSelector(getAppState, (state: AppState) => state.history);

export const selectIsShowUpdateUsername = createSelector(getAppState, (state: AppState) => state.isShowUpdateUsername);
