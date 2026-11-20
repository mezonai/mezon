import { configureStore } from '@reduxjs/toolkit';
import {
	LIVE_STREAM_FEATURE_KEY,
	liveStreamActions,
	liveStreamReducer,
	selectIsLiveActive,
	selectIsLiveInChannel,
	selectLiveChannelId,
	selectLiveInfo,
	selectLivePhase,
	selectLiveSources,
	selectLiveStopRequest
} from './liveStream.slice';

const createStore = () => configureStore({ reducer: { [LIVE_STREAM_FEATURE_KEY]: liveStreamReducer } });

const startPayload = {
	clanId: '10',
	channelId: '20',
	channelLabel: 'stream-test',
	clanName: 'Clan Ten',
	parentId: '0',
	screenOn: true,
	cameraOn: false,
	micOn: true,
	systemAudioOn: true,
	hasSystemAudio: true
};

describe('liveStream.slice', () => {
	it('transitions starting -> live -> reconnecting -> live -> reset', () => {
		const store = createStore();

		expect(selectLivePhase(store.getState())).toBe('idle');
		expect(selectIsLiveActive(store.getState())).toBe(false);
		expect(selectLiveChannelId(store.getState())).toBe('');
		expect(selectIsLiveInChannel(store.getState(), '20')).toBe(false);

		store.dispatch(liveStreamActions.starting(startPayload));
		expect(selectLivePhase(store.getState())).toBe('starting');
		expect(selectIsLiveActive(store.getState())).toBe(true);
		expect(selectLiveChannelId(store.getState())).toBe('20');
		expect(selectIsLiveInChannel(store.getState(), '20')).toBe(true);
		expect(selectIsLiveInChannel(store.getState(), '21')).toBe(false);
		expect(selectLiveInfo(store.getState())).toEqual({
			clanId: '10',
			clanName: 'Clan Ten',
			channelId: '20',
			channelLabel: 'stream-test',
			parentId: '0',
			attempt: 0
		});

		store.dispatch(liveStreamActions.setPhase({ phase: 'live' }));
		expect(selectLivePhase(store.getState())).toBe('live');
		expect(selectLiveInfo(store.getState()).attempt).toBe(0);

		store.dispatch(liveStreamActions.setPhase({ phase: 'reconnecting', attempt: 2 }));
		expect(selectLivePhase(store.getState())).toBe('reconnecting');
		expect(selectLiveInfo(store.getState()).attempt).toBe(2);

		store.dispatch(liveStreamActions.setPhase({ phase: 'live' }));
		expect(selectLivePhase(store.getState())).toBe('live');
		expect(selectLiveInfo(store.getState()).attempt).toBe(0);

		store.dispatch(liveStreamActions.reset());
		expect(selectLivePhase(store.getState())).toBe('idle');
		expect(selectIsLiveActive(store.getState())).toBe(false);
		expect(selectLiveChannelId(store.getState())).toBe('');
		expect(selectIsLiveInChannel(store.getState(), '20')).toBe(false);
		expect(selectLiveSources(store.getState())).toEqual({
			screenOn: false,
			cameraOn: false,
			micOn: false,
			systemAudioOn: false,
			hasSystemAudio: false
		});
	});

	it('updates source flags partially and memoizes selectors', () => {
		const store = createStore();
		store.dispatch(liveStreamActions.starting(startPayload));

		const initialSources = selectLiveSources(store.getState());
		expect(initialSources).toEqual({
			screenOn: true,
			cameraOn: false,
			micOn: true,
			systemAudioOn: true,
			hasSystemAudio: true
		});

		store.dispatch(liveStreamActions.setPhase({ phase: 'live' }));
		expect(selectLiveSources(store.getState())).toBe(initialSources);

		store.dispatch(liveStreamActions.setSources({ cameraOn: true, micOn: false }));
		expect(selectLiveSources(store.getState())).toEqual({
			screenOn: true,
			cameraOn: true,
			micOn: false,
			systemAudioOn: true,
			hasSystemAudio: true
		});
	});

	it('records stop requests while active and clears them on reset or restart', () => {
		const store = createStore();

		store.dispatch(liveStreamActions.requestStop('user'));
		expect(selectLiveStopRequest(store.getState())).toBeNull();

		store.dispatch(liveStreamActions.starting(startPayload));
		store.dispatch(liveStreamActions.requestStop('accessLost'));
		expect(selectLiveStopRequest(store.getState())).toBe('accessLost');

		store.dispatch(liveStreamActions.starting(startPayload));
		expect(selectLiveStopRequest(store.getState())).toBeNull();

		store.dispatch(liveStreamActions.requestStop('user'));
		expect(selectLiveStopRequest(store.getState())).toBe('user');

		store.dispatch(liveStreamActions.reset());
		expect(selectLiveStopRequest(store.getState())).toBeNull();
	});
});
