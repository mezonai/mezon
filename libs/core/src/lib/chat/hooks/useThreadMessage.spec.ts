import { messagesActions } from '@mezon/store';
import { uniqueUsers } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { useThreadMessage } from './useThreadMessage';

const mockDispatch = jest.fn();
const mockAddMember = jest.fn();
const mockAccount = { user: { id: 'user', username: 'username', display_name: 'Display name', avatar_url: 'avatar' } };

jest.mock(
	'@mezon/store',
	() => ({
		getStore: () => ({ getState: () => ({}) }),
		messagesActions: {
			sendMessage: jest.fn((payload) => ({ type: 'send', payload })),
			sendTypingUser: jest.fn((payload) => ({ type: 'typing', payload }))
		},
		selectAllAccount: () => mockAccount,
		selectCurrentClanId: () => 'clan',
		selectChannelById: () => ({}),
		selectAllChannelMembers: () => [],
		selectAllRolesClan: () => [],
		selectOgpData: () => undefined,
		useAppDispatch: () => mockDispatch,
		useAppSelector: (selector: (state: unknown) => unknown) => selector({})
	}),
	{ virtual: true }
);
jest.mock('@mezon/transport', () => ({ useMezon: () => ({ clientRef: { current: null }, sessionRef: { current: null } }) }), { virtual: true });
jest.mock('@mezon/utils', () => ({ uniqueUsers: jest.fn(() => []), CREATING_THREAD: 'creating-thread' }));
jest.mock('mezon-js', () => ({ ChannelStreamMode: { STREAM_MODE_THREAD: 4 } }));
jest.mock('react-redux', () => ({ useSelector: (selector: (state: unknown) => unknown) => selector({}) }));
jest.mock('./useChannelMembers', () => ({ useChannelMembers: () => ({ addMemberToThread: mockAddMember }) }));

function renderHook(channelId = 'thread') {
	let result!: ReturnType<typeof useThreadMessage>;
	function Harness() {
		result = useThreadMessage({ channelId, mode: ChannelStreamMode.STREAM_MODE_THREAD, username: 'username' });
		return null;
	}
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(React.createElement(Harness));
	});
	return { result, unmount: () => act(() => renderer.unmount()) };
}

beforeEach(() => {
	jest.clearAllMocks();
	mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve() });
});

it('dispatches the optimistic send immediately with the raw file and the new thread ID', async () => {
	let complete!: () => void;
	const sending = new Promise<void>((resolve) => {
		complete = resolve;
	});
	mockDispatch.mockReturnValue({ unwrap: () => sending });
	const { result, unmount } = renderHook('');
	const attachment = { filename: 'video.mp4', filetype: 'video/mp4', url: 'blob:local-video' };
	const request = result.sendMessageThread({}, [], [attachment], [], { channel_id: 'new-thread', channel_private: 0 });
	expect(messagesActions.sendMessage).toHaveBeenCalledWith(
		expect.objectContaining({
			channelId: 'new-thread',
			mode: ChannelStreamMode.STREAM_MODE_THREAD,
			isPublic: true,
			senderId: 'user',
			username: 'Display name',
			attachments: [attachment]
		})
	);
	expect(mockDispatch).toHaveBeenCalledTimes(1);
	expect(mockAddMember).not.toHaveBeenCalled();
	complete();
	await request;
	unmount();
});

it('keeps a failed send rejected so the composer cannot treat it as successful', async () => {
	mockDispatch.mockReturnValue({ unwrap: () => Promise.reject(new Error('Upload failed')) });
	const { result, unmount } = renderHook();
	await expect(result.sendMessageThread({}, [], [], [], { channel_id: 'thread', channel_private: 1 })).rejects.toThrow('Upload failed');
	expect(mockAddMember).not.toHaveBeenCalled();
	unmount();
});

it('routes typing to the thread channel instead of its parent', async () => {
	const { result, unmount } = renderHook();
	await result.sendMessageTyping();
	expect(messagesActions.sendTypingUser).toHaveBeenCalledWith(
		expect.objectContaining({ channelId: 'thread', mode: ChannelStreamMode.STREAM_MODE_THREAD })
	);
	unmount();
});

it('accepts attachment-only sends without a mentions array', async () => {
	const { result, unmount } = renderHook();
	await result.sendMessageThread({}, undefined, [{ filename: 'file.txt', url: 'blob:file' }], [], { channel_id: 'thread', channel_private: 1 });
	expect(uniqueUsers).toHaveBeenCalledWith([], [], [], []);
	expect(messagesActions.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false }));
	unmount();
});
