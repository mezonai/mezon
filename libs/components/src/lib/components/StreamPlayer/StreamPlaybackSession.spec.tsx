import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { StreamPlaybackSession } from './StreamPlaybackSession';
import { startWhep } from './whep';

type Playback = { token: string; whep_url: string; hls_url: string };
type Watch = { channelId: string; watching: boolean };
type State = {
	isJoin: boolean;
	streamInfo: { streamId: string } | null;
	playback: Playback | null;
	members: Record<string, string[]>;
	watches: Watch[];
};
type Action = { type: string; payload?: unknown };
type Act = { (callback: () => Promise<unknown>): Promise<void>; (callback: () => void): void };
type TestRenderer = { unmount: () => void };

const { act, create } = jest.requireActual<{ act: Act; create: (element: ReactElement) => TestRenderer }>('react-test-renderer');

jest.mock(
	'@mezon/store',
	() => {
		const { useDispatch, useSelector } = jest.requireActual<{ useDispatch: unknown; useSelector: unknown }>('react-redux');
		const action = (type: string) => (payload?: unknown) => ({ type, payload });
		return {
			appActions: { setIsShowChatStream: action('app/setIsShowChatStream') },
			toastActions: { addToast: action('toast/addToast') },
			videoStreamActions: { resetPlayback: action('stream/resetPlayback'), setPlayback: action('stream/setPlayback') },
			fetchStreamPlayback: action('stream/fetchStreamPlayback'),
			watchStream: action('stream/watchStream'),
			selectIsJoin: (state: State) => state.isJoin,
			selectCurrentStreamInfo: (state: State) => state.streamInfo,
			selectStreamPlayback: (state: State) => state.playback,
			selectStreamMembersByChannelId: (state: State, channelId: string) => state.members[channelId] ?? [],
			selectStreamQuality: () => 'auto',
			selectStreamVolume: () => 1,
			selectStreamMuted: () => false,
			useAppDispatch: useDispatch,
			useAppSelector: useSelector
		};
	},
	{ virtual: true }
);
jest.mock('@mezon/utils', () => ({ setPreferredOutputDeviceId: () => undefined, sinkIdForHtmlMediaElement: () => '' }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../MezonSfuVoiceChannel/usePreferredOutputDevice', () => ({
	usePreferredOutputDevice: () => ({ outputDeviceId: 'default', handleSinkIdFailure: () => undefined })
}));
jest.mock('./StreamVideoSlot', () => ({ getStreamVideo: () => mockVideo }));
jest.mock('./whep', () => ({
	WhepError: class extends Error {},
	startWhep: jest.fn(),
	stopWhep: jest.fn(),
	setWhepLayer: jest.fn(),
	waitConnected: jest.fn()
}));

const mockHlsSources: string[] = [];

class MockHls {
	static isSupported = () => true;
	static Events = { MANIFEST_PARSED: 'manifestParsed', FRAG_BUFFERED: 'fragBuffered', ERROR: 'hlsError' };
	static ErrorTypes = { MEDIA_ERROR: 'mediaError' };
	levels = [];
	currentLevel = -1;
	on() {
		return undefined;
	}
	once() {
		return undefined;
	}
	loadSource(url: string) {
		mockHlsSources.push(url);
	}
	attachMedia() {
		return undefined;
	}
	destroy() {
		return undefined;
	}
}

jest.mock('hls.js', () => ({ __esModule: true, default: MockHls }));

const mockVideo = {
	volume: 1,
	muted: false,
	srcObject: null,
	onerror: null,
	play: () => Promise.resolve(),
	canPlayType: () => '',
	removeAttribute: () => undefined,
	load: () => undefined
};

Object.assign(globalThis, { window: new EventTarget() });

const hlsUrl = (channelId: string) => `https://cdn.mezon.ai/${channelId}/live/index.m3u8`;

const initialState: State = { isJoin: false, streamInfo: null, playback: null, members: {}, watches: [] };

const reducer = (state: State = initialState, action: Action): State => {
	switch (action.type) {
		case 'test/join': {
			const channelId = action.payload as string;
			return {
				...state,
				isJoin: true,
				streamInfo: { streamId: channelId },
				playback: { token: 't', whep_url: '', hls_url: hlsUrl(channelId) },
				members: { [channelId]: ['publisher'] }
			};
		}
		case 'test/publisherLeft':
			return { ...state, members: {} };
		case 'stream/resetPlayback':
			return { ...state, isJoin: false, playback: null };
		case 'stream/watchStream':
			return { ...state, watches: [...state.watches, action.payload as Watch] };
		default:
			return state;
	}
};

const join = (channelId: string) => ({ type: 'test/join', payload: channelId });
const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

const createStore = () => configureStore({ reducer });

let store: ReturnType<typeof createStore>;
let renderer: TestRenderer | undefined;

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockHlsSources.length = 0;
	store = createStore();
	act(() => {
		renderer = create(
			<Provider store={store}>
				<StreamPlaybackSession />
			</Provider>
		);
	});
});

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	jest.useRealTimers();
});

it('renews the watch every 30 s and stops renewing once the player stops', async () => {
	act(() => {
		store.dispatch(join('42'));
	});
	await advance(29999);
	expect(store.getState().watches).toEqual([]);
	await advance(1);
	expect(store.getState().watches).toEqual([{ channelId: '42', watching: true }]);
	await advance(60000);
	expect(store.getState().watches).toHaveLength(3);

	act(() => {
		store.dispatch({ type: 'test/publisherLeft' });
	});
	await advance(90000);
	expect(store.getState().watches).toHaveLength(3);
});

it('renews only the current channel after a switch and nothing after unmount', async () => {
	act(() => {
		store.dispatch(join('42'));
	});
	await advance(15000);
	act(() => {
		store.dispatch(join('43'));
	});
	await advance(30000);
	expect(store.getState().watches).toEqual([{ channelId: '43', watching: true }]);

	act(() => renderer?.unmount());
	await advance(90000);
	expect(store.getState().watches).toHaveLength(1);
});

it('plays HLS without trying WHEP when the response has no WHEP URL', async () => {
	act(() => {
		store.dispatch(join('42'));
	});
	await advance(0);
	expect(startWhep).not.toHaveBeenCalled();
	expect(mockHlsSources).toEqual([hlsUrl('42')]);
});
