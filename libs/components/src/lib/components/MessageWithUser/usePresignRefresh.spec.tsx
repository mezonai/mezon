import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { usePresignRefresh } from './usePresignRefresh';

type ReactTestRenderer = { unmount: () => void };
const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => ReactTestRenderer;
}>('react-test-renderer');

const mockRefetchedAt: number[] = [];
jest.mock(
	'@mezon/store',
	() => ({
		messagesActions: {
			refreshPresignMessage: () => {
				mockRefetchedAt.push(Date.now());
				return { type: 'refreshPresignMessage' };
			},
			applyPresignRefresh: () => ({ type: 'applyPresignRefresh' })
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
		ETypeLinkMedia: { IMAGE_PREFIX: 'image' }
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse }));

const START = Date.UTC(2026, 10, 2, 8, 0, 0);
const KEY = '1846031000000002001_clip';
const video = { url: `https://cdn.mezon.ai/0000000000031031/${KEY}.mp4`, filetype: 'video/mp4', filename: 'clip.mp4', size: 20 * 1024 * 1024 };

function Row({ ageSec, content }: { ageSec: number; content: unknown }) {
	usePresignRefresh({
		hasPresignPending: true,
		clanId: 'clan',
		bucketId: 'channel',
		parentChannelId: 'channel',
		messageId: '900',
		createTimeSeconds: START / 1000 - ageSec,
		attachments: [video],
		content
	});
	return null;
}

const gapsSec = () => mockRefetchedAt.slice(1).map((at, index) => (at - mockRefetchedAt[index]) / 1000);

beforeEach(() => {
	jest.useFakeTimers({ now: START });
	mockRefetchedAt.length = 0;
	Object.assign(globalThis, { window: { addEventListener: () => undefined, removeEventListener: () => undefined } });
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
