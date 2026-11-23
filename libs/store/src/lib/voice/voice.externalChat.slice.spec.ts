import type { VoiceState } from './voice.slice';
import { initialVoiceState, selectExternalChatUnread, voiceActions, voiceReducer } from './voice.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock(
	'@mezon/transport',
	() => ({
		SfuBreakoutApiError: class SfuBreakoutApiError extends Error {},
		callSfuBreakoutMerge: jest.fn(),
		callSfuBreakoutRoom: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('@mezon/utils', () => ({
	...jest.requireActual('../../../../utils/src/lib/utils/clanChannel'),
	LENGHT_USER_ID: 19
}));
jest.mock('mezon-js', () => ({ ChannelType: { CHANNEL_TYPE_MEZON_VOICE: 4 } }));
jest.mock('../account/account.slice', () => ({ selectCurrentUserId: jest.fn() }));
jest.mock('../cache-metadata', () => ({
	createApiKey: jest.fn(),
	createCacheMetadata: jest.fn(),
	markApiFirstCalled: jest.fn(),
	shouldForceApiCall: jest.fn()
}));
jest.mock('../channels/channels.slice', () => ({ channelsActions: {}, selectCurrentChannelId: jest.fn() }));
jest.mock('../clans/clans.slice', () => ({ selectCurrentClanId: jest.fn() }));
jest.mock('../helpers', () => ({
	ensureClientAsync: jest.fn(),
	ensureSession: jest.fn(),
	fetchDataWithSocketFallback: jest.fn(),
	getMezonCtx: jest.fn()
}));
jest.mock('../meet/meet.slice', () => ({ generateMeetToken: jest.fn() }));

function stateWith(overrides: Partial<VoiceState> = {}): VoiceState {
	return {
		...initialVoiceState,
		...overrides
	};
}

describe('voice slice external chat unread', () => {
	it('starts at zero in initialVoiceState', () => {
		expect(initialVoiceState.externalChatUnread).toBe(0);
		expect(selectExternalChatUnread({ voice: initialVoiceState })).toBe(0);
	});

	it('increments externalChatUnread on noteExternalChatMessage only while openChatBox is false', () => {
		const closed = stateWith({ openChatBox: false, externalChatUnread: 0 });
		const afterFirst = voiceReducer(closed, voiceActions.noteExternalChatMessage());
		const afterSecond = voiceReducer(afterFirst, voiceActions.noteExternalChatMessage());

		expect(afterSecond.externalChatUnread).toBe(2);
		expect(selectExternalChatUnread({ voice: afterSecond })).toBe(2);

		const open = stateWith({ openChatBox: true, externalChatUnread: 0 });
		const whileOpen = voiceReducer(open, voiceActions.noteExternalChatMessage());

		expect(whileOpen.externalChatUnread).toBe(0);
	});

	it('zeroes externalChatUnread when setToggleChatBox opens the chat box and preserves zero when closing', () => {
		const withUnread = stateWith({ openChatBox: false, externalChatUnread: 3 });

		const opened = voiceReducer(withUnread, voiceActions.setToggleChatBox());
		expect(opened.openChatBox).toBe(true);
		expect(opened.externalChatUnread).toBe(0);

		const closedAgain = voiceReducer(opened, voiceActions.setToggleChatBox());
		expect(closedAgain.openChatBox).toBe(false);
		expect(closedAgain.externalChatUnread).toBe(0);

		const afterReclosedMessage = voiceReducer(closedAgain, voiceActions.noteExternalChatMessage());
		expect(afterReclosedMessage.externalChatUnread).toBe(1);
	});

	it('zeroes externalChatUnread on resetExternalCall', () => {
		const withUnread = stateWith({ externalChatUnread: 5, isJoined: true, externalToken: 'tok' });

		const reset = voiceReducer(withUnread, voiceActions.resetExternalCall());

		expect(reset.externalChatUnread).toBe(0);
	});
});
