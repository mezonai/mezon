import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { usePresignRefresh } from './usePresignRefresh';

type ReactTestRenderer = { unmount: () => void };
const { act, create } = jest.requireActual<{
	act: { (callback: () => Promise<void>): Promise<void>; (callback: () => void): void };
	create: (element: ReactElement) => ReactTestRenderer;
}>('react-test-renderer');

const mockRefetchedAt: number[] = [];
const mockAppliedFinishes: Array<{ channelId: string; messageId: string; presignFinish: string[] }> = [];
const mockHasFinishedHlsCopy = jest.fn<(url?: string, signal?: AbortSignal) => Promise<boolean>>(async () => false);
jest.mock(
	'@mezon/store',
	() => ({
		messagesActions: {
			refreshPresignMessage: () => {
				mockRefetchedAt.push(Date.now());
				return { type: 'refreshPresignMessage' };
			},
			applyPresignRefresh: (payload: { channelId: string; messageId: string; presignFinish: string[] }) => {
				mockAppliedFinishes.push(payload);
				return { type: 'applyPresignRefresh', payload };
			}
		},
		selectCurrentClanId: () => 'clan',
		useAppDispatch: () => () => undefined,
		useAppSelector: () => 'clan'
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/presignFinish'),
		ETypeLinkMedia: { IMAGE_PREFIX: 'image' },
		hasFinishedHlsCopy: (...args: [string | undefined, AbortSignal | undefined]) => mockHasFinishedHlsCopy(...args)
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse }));

const START = Date.UTC(2026, 10, 2, 8, 0, 0);
const KEY = '1846031000000002001_clip';
const KEY_2 = '1846031000000002002_second';
const video = { url: `https://cdn.mezon.ai/0000000000031031/${KEY}.mp4`, filetype: 'video/mp4', filename: 'clip.mp4', size: 20 * 1024 * 1024 };
const secondVideo = {
	url: `https://cdn.mezon.ai/0000000000031031/${KEY_2}.mov`,
	filetype: 'video/quicktime',
	filename: 'second.mov',
	size: 25 * 1024 * 1024
};

let reconnectHandler: (() => void) | undefined;

function Row({ ageSec, content, attachments = [video] }: { ageSec: number; content: unknown; attachments?: (typeof video)[] }) {
	usePresignRefresh({
		hasPresignPending: true,
		clanId: 'clan',
		bucketId: 'channel',
		parentChannelId: 'channel',
		messageId: '900',
		createTimeSeconds: START / 1000 - ageSec,
		attachments,
		content
	});
	return null;
}

const gapsSec = () => mockRefetchedAt.slice(1).map((at, index) => (at - mockRefetchedAt[index]) / 1000);

beforeEach(() => {
	jest.useFakeTimers({ now: START, doNotFake: ['nextTick', 'queueMicrotask'] });
	mockRefetchedAt.length = 0;
	mockAppliedFinishes.length = 0;
	mockHasFinishedHlsCopy.mockReset();
	mockHasFinishedHlsCopy.mockResolvedValue(false);
	reconnectHandler = undefined;
	Object.assign(globalThis, {
		window: {
			addEventListener: (event: string, listener: () => void) => {
				if (event === 'mezon:socket-reconnect') reconnectHandler = listener;
			},
			removeEventListener: () => {
				reconnectHandler = undefined;
			}
		}
	});
});

afterEach(() => {
	jest.useRealTimers();
});

it('backs off a file ingest upload that outlasts ten minutes, up to one refetch every 5 minutes', () => {
	let row: ReactTestRenderer | undefined;
	act(() => {
		row = create(<Row ageSec={9 * 60} content={{ presign_finish: [], presign_ingest: [KEY] }} />);
	});
	act(() => {
		jest.advanceTimersByTime(30 * 60 * 1000);
	});
	row?.unmount();

	expect(gapsSec()).toEqual([15, 15, 15, 15, 15, 30, 60, 120, 240, 300, 300, 300, 300]);
});

it('still stops at ten minutes for an upload outside the ingest', () => {
	let row: ReactTestRenderer | undefined;
	act(() => {
		row = create(<Row ageSec={9 * 60} content={{ presign_finish: [] }} />);
	});
	act(() => {
		jest.advanceTimersByTime(30 * 60 * 1000);
	});
	row?.unmount();

	expect(gapsSec()).toEqual([15, 15, 15, 15]);
});

it('heals a stuck pending ingest video after two refetches once its HLS playlist has ended and stops re-probing it', async () => {
	mockHasFinishedHlsCopy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

	let row: ReactTestRenderer | undefined;
	act(() => {
		row = create(<Row ageSec={0} content={{ presign_finish: [], presign_ingest: [KEY] }} />);
	});

	await act(async () => {
		await jest.advanceTimersByTimeAsync(15000);
	});
	expect(mockHasFinishedHlsCopy).not.toHaveBeenCalled();

	await act(async () => {
		await jest.advanceTimersByTimeAsync(15000);
	});
	expect(mockHasFinishedHlsCopy).toHaveBeenCalledTimes(1);
	expect(mockHasFinishedHlsCopy).toHaveBeenLastCalledWith(video.url, expect.any(AbortSignal));
	expect(mockAppliedFinishes).toEqual([]);

	await act(async () => {
		await jest.advanceTimersByTimeAsync(15000);
	});
	expect(mockHasFinishedHlsCopy).toHaveBeenCalledTimes(2);
	expect(mockAppliedFinishes).toEqual([{ channelId: 'channel', messageId: '900', presignFinish: [KEY] }]);

	await act(async () => {
		await jest.advanceTimersByTimeAsync(30000);
	});
	expect(mockHasFinishedHlsCopy).toHaveBeenCalledTimes(2);
	row?.unmount();
});

it('avoids duplicate in-flight HLS probes for the same key and aborts on unmount', async () => {
	let resolveProbe!: (value: boolean) => void;
	let receivedSignal: AbortSignal | undefined;
	mockHasFinishedHlsCopy.mockImplementation(
		(_url, signal) =>
			new Promise<boolean>((resolve) => {
				receivedSignal = signal;
				resolveProbe = resolve;
			})
	);

	let row: ReactTestRenderer | undefined;
	act(() => {
		row = create(<Row ageSec={0} content={{ presign_finish: [], presign_ingest: [KEY] }} />);
	});

	await act(async () => {
		await jest.advanceTimersByTimeAsync(30000);
	});
	expect(mockHasFinishedHlsCopy).toHaveBeenCalledTimes(1);

	await act(async () => {
		reconnectHandler?.();
		await jest.advanceTimersByTimeAsync(15000);
	});
	expect(mockHasFinishedHlsCopy).toHaveBeenCalledTimes(1);
	expect(receivedSignal?.aborted).toBe(false);

	act(() => {
		row?.unmount();
	});
	expect(receivedSignal?.aborted).toBe(true);

	await act(async () => {
		resolveProbe(true);
		await Promise.resolve();
	});
	expect(mockAppliedFinishes).toEqual([]);
});

it('skips HLS probing for non-ingest videos and already-finished ingest videos', async () => {
	mockHasFinishedHlsCopy.mockResolvedValue(true);

	let row: ReactTestRenderer | undefined;
	act(() => {
		row = create(<Row ageSec={0} attachments={[video, secondVideo]} content={{ presign_finish: [KEY], presign_ingest: [KEY] }} />);
	});

	await act(async () => {
		await jest.advanceTimersByTimeAsync(45000);
	});
	expect(mockHasFinishedHlsCopy).not.toHaveBeenCalled();
	expect(mockAppliedFinishes).toEqual([]);
	row?.unmount();
});
