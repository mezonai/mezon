import { configureStore } from '@reduxjs/toolkit';
import {
	VIDEO_STREAM_FEATURE_KEY,
	fetchStreamPlayback,
	loadDefaultStreamQuality,
	selectStreamQuality,
	videoStreamActions,
	videoStreamReducer,
	watchStream
} from './videoStream.slice';

const mockGetStreamPlayback = jest.fn();
const mockWriteStreamingWatch = jest.fn();

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('../helpers', () => {
	const mezon = () => ({
		client: { getStreamPlayback: mockGetStreamPlayback, writeStreamingWatch: mockWriteStreamingWatch },
		session: { token: 'session' }
	});
	return { getMezonCtx: () => ({}), ensureSocket: async () => mezon(), ensureClient: () => mezon() };
});

const createStore = () => configureStore({ reducer: { [VIDEO_STREAM_FEATURE_KEY]: videoStreamReducer } });

beforeEach(() => {
	mockGetStreamPlayback.mockReset();
	mockWriteStreamingWatch.mockReset();
});

describe('fetchStreamPlayback', () => {
	it('asks for a publish token and needs a WHIP URL back', async () => {
		const store = createStore();
		mockGetStreamPlayback.mockResolvedValueOnce({ token: 't', whip_url: 'https://node/whip/42', whep_url: '', hls_url: '', expires_at: '1' });

		const playback = await store.dispatch(fetchStreamPlayback({ channelId: '42', publish: true })).unwrap();

		expect(mockGetStreamPlayback).toHaveBeenCalledWith({ token: 'session' }, { channel_id: '42', publish: true });
		expect(playback?.whip_url).toBe('https://node/whip/42');
	});

	it('returns null instead of rejecting when the response cannot be used', async () => {
		const store = createStore();
		mockGetStreamPlayback.mockResolvedValueOnce({ token: 't', whip_url: '', whep_url: 'https://node/whep/42', hls_url: '', expires_at: '1' });
		mockGetStreamPlayback.mockResolvedValueOnce({ token: '', whip_url: '', whep_url: '', hls_url: '', expires_at: '0' });
		mockGetStreamPlayback.mockRejectedValueOnce({ code: 0, error: { code: 503, message: 'Service unavailable.' } });

		expect(await store.dispatch(fetchStreamPlayback({ channelId: '42', publish: true })).unwrap()).toBeNull();
		expect(await store.dispatch(fetchStreamPlayback({ channelId: '42' })).unwrap()).toBeNull();
		expect(await store.dispatch(fetchStreamPlayback({ channelId: '42' })).unwrap()).toBeNull();
	});
});

describe('watchStream', () => {
	it('tells the server which channel this socket starts and stops watching', async () => {
		const store = createStore();
		mockWriteStreamingWatch.mockResolvedValue(undefined);

		await store.dispatch(watchStream({ channelId: '42', watching: true })).unwrap();
		await store.dispatch(watchStream({ channelId: '42', watching: false })).unwrap();

		expect(mockWriteStreamingWatch.mock.calls).toEqual([
			[{ token: 'session' }, '42', true],
			[{ token: 'session' }, '42', false]
		]);
	});

	it('does not reject when the server does not know the message or the socket is closed', async () => {
		const store = createStore();
		mockWriteStreamingWatch.mockRejectedValueOnce({ code: 0, error: { code: 400, message: 'unhandled envelope' } });
		mockWriteStreamingWatch.mockRejectedValueOnce('Socket connection has not been established yet.');

		await expect(store.dispatch(watchStream({ channelId: '42', watching: true })).unwrap()).resolves.toBeUndefined();
		await expect(store.dispatch(watchStream({ channelId: '42', watching: false })).unwrap()).resolves.toBeUndefined();
	});
});

describe('default quality', () => {
	it('is the quality every join starts with', () => {
		const store = createStore();
		store.dispatch(videoStreamActions.setDefaultQuality('low'));
		store.dispatch(videoStreamActions.setQuality('high'));

		store.dispatch(videoStreamActions.startStream({ clanId: '1', clanName: 'c', streamId: '42', streamName: 's', parentId: '0' }));

		expect(selectStreamQuality(store.getState())).toBe('low');
	});

	it('ignores a stored value that is not a quality', () => {
		const storage = new Map([['mezon.stream.defaultQuality', 'ultra']]);
		Object.assign(globalThis, { localStorage: { getItem: (key: string) => storage.get(key) ?? null } });

		expect(loadDefaultStreamQuality()).toBe('auto');
		storage.set('mezon.stream.defaultQuality', 'mid');
		expect(loadDefaultStreamQuality()).toBe('mid');
	});
});
