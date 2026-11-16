import { configureStore } from '@reduxjs/toolkit';
import {
	TOPIC_DISCUSSIONS_FEATURE_KEY,
	fetchTopics,
	initialTopicsState,
	loadMoreTopics,
	selectIsTopicUnread,
	selectUnreadTopicCountByClan,
	topicsActions,
	topicsReducer
} from './topicDiscussions.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		CREATING_TOPIC: 'CREATING_TOPIC',
		EBacktickType: {},
		isTikTokLink: jest.fn(),
		isYouTubeLink: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('../helpers', () => ({
	ensureSession: jest.fn(async (mezon: unknown) => mezon),
	getMezonCtx: jest.fn(({ extra }: { extra: { mezon: unknown } }) => extra.mezon)
}));
jest.mock('../messages/messages.slice', () => ({
	messagesActions: {},
	selectMessageEntitiesByChannelId: () => ({})
}));
jest.mock('../messages/references.slice', () => ({
	selectOgpData: () => undefined
}));
jest.mock('../threads/threads.slice', () => ({
	threadsActions: {}
}));

function createTestStore(currentClanId = 'clan-1') {
	const client = {
		listSdTopic: jest.fn()
	};
	const mezon = { client, session: {} };
	const store = configureStore({
		reducer: {
			[TOPIC_DISCUSSIONS_FEATURE_KEY]: topicsReducer,
			clans: () => ({ currentClanId })
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: { mezon } }, serializableCheck: false })
	});
	return { store, client };
}

describe('topicDiscussions unread state', () => {
	it('seeds unreadTopics from fetchTopics.fulfilled for unread_count 2, 0 and missing', async () => {
		const { store, client } = createTestStore('clan-1');
		store.dispatch(topicsActions.markTopicUnread({ topicId: 'topic-read', clanId: 'clan-1' }));
		store.dispatch(topicsActions.markTopicUnread({ topicId: 'topic-legacy', clanId: 'clan-1' }));

		client.listSdTopic.mockResolvedValueOnce({
			topics: [
				{ id: 'topic-unread', clan_id: 'clan-1', unread_count: 2 },
				{ id: 'topic-read', clan_id: 'clan-1', unread_count: 0 },
				{ id: 'topic-legacy', clan_id: 'clan-1' }
			]
		});

		await store.dispatch(fetchTopics({ clanId: 'clan-1' }));

		const state = store.getState();
		expect(state[TOPIC_DISCUSSIONS_FEATURE_KEY].unreadTopics).toEqual({
			'topic-unread': 'clan-1'
		});
		expect(selectIsTopicUnread('topic-unread')(state)).toBe(true);
		expect(selectIsTopicUnread('topic-read')(state)).toBe(false);
		expect(selectIsTopicUnread('topic-legacy')(state)).toBe(false);
		expect(selectUnreadTopicCountByClan('clan-1')(state)).toBe(1);
	});

	it('updates unreadTopics on loadMoreTopics.fulfilled', async () => {
		const { store, client } = createTestStore('clan-1');
		store.dispatch(topicsActions.markTopicUnread({ topicId: 'topic-2', clanId: 'clan-1' }));

		client.listSdTopic.mockResolvedValueOnce({
			topics: [
				{ id: 'topic-1', clan_id: 'clan-1', unread_count: 3 },
				{ id: 'topic-2', clan_id: 'clan-1', unread_count: 0 },
				{ id: 'topic-3', clan_id: 'clan-1' }
			]
		});

		await store.dispatch(loadMoreTopics({ clanId: 'clan-1', limit: 50, page: 2 }));

		const state = store.getState();
		expect(state[TOPIC_DISCUSSIONS_FEATURE_KEY].unreadTopics).toEqual({
			'topic-1': 'clan-1'
		});
	});

	it('marks topics unread and read via reducers', () => {
		let sliceState = topicsReducer(initialTopicsState, topicsActions.markTopicUnread({ topicId: 'topic-1', clanId: 'clan-a' }));
		expect(sliceState.unreadTopics).toEqual({ 'topic-1': 'clan-a' });
		expect(selectIsTopicUnread('topic-1')({ [TOPIC_DISCUSSIONS_FEATURE_KEY]: sliceState })).toBe(true);

		const sameRefState = topicsReducer(sliceState, topicsActions.markTopicUnread({ topicId: 'topic-1', clanId: 'clan-a' }));
		expect(sameRefState).toBe(sliceState);

		sliceState = topicsReducer(sliceState, topicsActions.markTopicRead({ topicId: 'topic-1' }));
		expect(sliceState.unreadTopics).toEqual({});
		expect(selectIsTopicUnread('topic-1')({ [TOPIC_DISCUSSIONS_FEATURE_KEY]: sliceState })).toBe(false);
	});

	it('counts unread topics per clan only', () => {
		let sliceState = initialTopicsState;
		sliceState = topicsReducer(sliceState, topicsActions.markTopicUnread({ topicId: 't1', clanId: 'clan-1' }));
		sliceState = topicsReducer(sliceState, topicsActions.markTopicUnread({ topicId: 't2', clanId: 'clan-1' }));
		sliceState = topicsReducer(sliceState, topicsActions.markTopicUnread({ topicId: 't3', clanId: 'clan-2' }));

		const rootState = { [TOPIC_DISCUSSIONS_FEATURE_KEY]: sliceState };
		const selectClan1Count = selectUnreadTopicCountByClan('clan-1');
		expect(selectUnreadTopicCountByClan('clan-1')).toBe(selectClan1Count);
		expect(selectClan1Count(rootState)).toBe(2);
		expect(selectUnreadTopicCountByClan('clan-2')(rootState)).toBe(1);
		expect(selectUnreadTopicCountByClan('clan-3')(rootState)).toBe(0);
	});
});
