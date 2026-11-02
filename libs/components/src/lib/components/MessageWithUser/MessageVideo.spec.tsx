import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import MessageVideo from './MessageVideo';

type TestInstance = { props: { src?: string; onPlay: () => void; onError: () => void; disablePlay?: boolean; children?: unknown } };
type Query = {
	find: (predicate: (node: TestInstance) => boolean) => TestInstance;
	findByType: (type: string) => TestInstance;
	findAllByType: (type: string) => TestInstance[];
	findAllByProps: (props: Record<string, unknown>) => TestInstance[];
};
type TestRenderer = { root: Query; update: (element: ReactElement) => void; unmount: () => void };
// The workspace has this renderer but not its optional type package.
const { act, create } = jest.requireActual<{
	act: { (callback: () => Promise<void>): Promise<void>; (callback: () => void): void };
	create: (element: ReactElement, options?: { createNodeMock: (node: { type: unknown }) => unknown }) => TestRenderer;
}>('react-test-renderer');

let mockIsIntersecting = true;
let mockUploadProgress: Record<string, number> = {};
jest.mock('@mezon/ui', () => ({ Icons: { PlayButton: () => null, Download: () => null } }), { virtual: true });
jest.mock(
	'@mezon/store',
	() => ({
		selectAttachmentUploadProgress: (_state: unknown, key?: string) => (key === undefined ? undefined : mockUploadProgress[key]),
		useAppSelector: (selector: (state: unknown) => unknown) => selector({})
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/videoSource'),
		IS_SAFARI: true,
		calculateMediaDimensions: () => ({ width: 320, height: 180 }),
		createImgproxyUrl: (url: string) => `proxy:${url}`,
		getPresignKeyFromAttachmentUrl: (url?: string) => url?.split('?')[0].split('/').pop()?.split('.')[0],
		useIsIntersecting: () => mockIsIntersecting,
		useResizeObserver: () => undefined
	}),
	{ virtual: true }
);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('use-debounce', () => ({ useDebouncedCallback: (callback: unknown) => callback }));
jest.mock('mp4box', () => ({}));

const attachment = {
	filename: 'movie.mp4',
	filetype: 'video',
	url: 'https://cdn/video.mp4',
	thumbnail: 'https://cdn/poster.png',
	local_source: 'blob:independent-poster',
	width: 320,
	height: 180
};

beforeEach(() => {
	mockIsIntersecting = true;
	mockUploadProgress = {};
});

it('keeps the same poster through acknowledgement and upload completion, including a remount', () => {
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<MessageVideo attachmentData={attachment} isSending />);
	});
	const poster = renderer.root.findByType('img');
	expect(poster.props.src).toBe(attachment.local_source);
	act(() => {
		renderer.update(<MessageVideo attachmentData={attachment} isPresignPending />);
	});
	expect(renderer.root.findByType('img')).toBe(poster);
	expect(poster.props.src).toBe(attachment.local_source);
	mockIsIntersecting = false;
	act(() => {
		renderer.update(<MessageVideo attachmentData={attachment} />);
	});
	expect(renderer.root.findByType('img')).toBe(poster);
	expect(poster.props.src).toBe(attachment.local_source);
	expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
	act(() => {
		renderer.update(<MessageVideo key="confirmed" attachmentData={attachment} />);
	});
	expect(renderer.root.findByType('img').props.src).toBe(attachment.local_source);
	act(() => renderer.unmount());
});

it('falls back to the remote poster if the local preview is evicted', () => {
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<MessageVideo attachmentData={attachment} />);
	});
	act(() => renderer.root.findByType('img').props.onError());
	expect(renderer.root.findByType('img').props.src).toBe(`proxy:${attachment.thumbnail}`);
	act(() => renderer.unmount());
});

it('keeps remote-only pending videos gated until upload completes', () => {
	let renderer!: ReturnType<typeof create>;
	const remote = { ...attachment, local_source: undefined };
	act(() => {
		renderer = create(<MessageVideo attachmentData={remote} isPresignPending />);
	});
	expect(renderer.root.findAllByType('img')).toHaveLength(0);
	act(() => {
		renderer.update(<MessageVideo attachmentData={remote} />);
	});
	expect(renderer.root.findByType('img').props.src).toBe(`proxy:${remote.thumbnail}`);
	act(() => renderer.unmount());
});

it('shows the poster again instead of reloading a video that scrolled out and back', () => {
	let renderer!: ReturnType<typeof create>;
	const remote = { ...attachment, local_source: undefined };
	act(() => {
		renderer = create(<MessageVideo attachmentData={remote} />);
	});
	act(() => renderer.root.find((node) => typeof node.props.onPlay === 'function').props.onPlay());
	expect(renderer.root.findAllByType('video')).toHaveLength(1);

	mockIsIntersecting = false;
	act(() => renderer.update(<MessageVideo attachmentData={remote} />));
	expect(renderer.root.findAllByType('video')).toHaveLength(0);

	mockIsIntersecting = true;
	act(() => renderer.update(<MessageVideo attachmentData={remote} />));
	expect(renderer.root.findAllByType('video')).toHaveLength(0);
	expect(renderer.root.findByType('img').props.src).toBe(`proxy:${remote.thumbnail}`);
	act(() => renderer.unmount());
});

describe('a video sent through the file ingest', () => {
	const START = 1793000000000;
	const n = Math.floor(START / 3000);
	const URL = 'https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000002001_clip.mp4?1791900000-c2lnbmF0dXJl';
	const INDEX = 'https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/index.m3u8';
	const INIT = 'https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/init.mp4';
	const remote = { ...attachment, url: URL, local_source: undefined };
	const EVENT_PLAYLIST = '#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-PLAYLIST-TYPE:EVENT\n';

	function quarterTurnedInitSegment(): Uint8Array {
		const bytes = new Uint8Array(108);
		const view = new DataView(bytes.buffer);
		for (const [at, type] of [
			[0, 'moov'],
			[8, 'trak'],
			[16, 'tkhd']
		] as const) {
			view.setUint32(at, bytes.length - at);
			bytes.set(
				Array.from(type, (char) => char.charCodeAt(0)),
				at + 4
			);
		}
		const matrix = 16 + 8 + 40;
		view.setInt32(matrix + 4, 0x10000);
		view.setInt32(matrix + 12, -0x10000);
		view.setUint32(matrix + 36, 1920 * 0x10000);
		view.setUint32(matrix + 40, 1080 * 0x10000);
		return bytes;
	}

	class FakeVideo {
		src = '';
		paused = true;
		duration = NaN;
		videoWidth = 0;
		addEventListener() {
			return undefined;
		}
		removeEventListener() {
			return undefined;
		}
		canPlayType(type: string) {
			return type === 'application/vnd.apple.mpegurl' ? 'maybe' : '';
		}
		play = jest.fn(async () => {
			this.paused = false;
		});
		pause() {
			this.paused = true;
		}
		removeAttribute() {
			this.src = '';
		}
		load() {
			return undefined;
		}
	}

	let video: FakeVideo;
	let renderer: TestRenderer;
	let stored: boolean;
	let fetchMock: jest.SpiedFunction<typeof fetch>;

	const render = (element: ReactElement) =>
		act(() => {
			renderer = create(element, { createNodeMock: (node) => (node.type === 'video' ? video : null) });
		});
	const advance = (ms: number) =>
		act(async () => {
			await jest.advanceTimersByTimeAsync(ms);
		});
	const poster = () => renderer.root.find((node) => typeof node.props.onPlay === 'function');
	const labels = () =>
		renderer.root
			.findAllByProps({ role: 'status' })
			.map((node) => (Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children));
	const requests = () => fetchMock.mock.calls.map(([input]) => String(input));

	beforeEach(() => {
		process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
		jest.useFakeTimers({ now: START, doNotFake: ['nextTick', 'queueMicrotask'] });
		video = new FakeVideo();
		stored = false;
		fetchMock = jest
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () =>
				stored ? new Response(EVENT_PLAYLIST, { status: 200 }) : new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 })
			);
	});

	afterEach(() => {
		act(() => renderer?.unmount());
		delete process.env.NX_MEZON_CDN_URL;
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('stays uploading while its playlist answers 404, becomes playable once it exists, and plays it from the start', async () => {
		render(<MessageVideo attachmentData={remote} isPresignPending isIngest />);
		await advance(0);
		expect(poster().props.disablePlay).toBe(true);
		expect(labels()).toEqual(['attachment.uploading']);

		await advance(3000);
		expect(poster().props.disablePlay).toBe(true);
		stored = true;
		await advance(3000);
		expect(requests()).toEqual([`${INDEX}?probe=${n}`, `${INDEX}?probe=${n + 1}`, `${INDEX}?probe=${n + 2}`, INIT]);
		expect(poster().props.disablePlay).toBe(false);
		expect(labels()).toEqual(['attachment.uploading']);

		act(() => poster().props.onPlay());
		await advance(0);
		expect(renderer.root.findAllByType('video')).toHaveLength(1);
		expect(video.src).toBe(INDEX);
		expect(video.play).toHaveBeenCalled();
	});

	it('in Safari, keeps a turned video uploading once its playlist exists, then plays the original after presign_finish', async () => {
		fetchMock.mockImplementation(async (input) =>
			String(input) === INIT ? new Response(quarterTurnedInitSegment(), { status: 200 }) : new Response(EVENT_PLAYLIST, { status: 200 })
		);
		render(<MessageVideo attachmentData={remote} isPresignPending isIngest />);
		await advance(30000);
		expect(requests()).toEqual([`${INDEX}?probe=${n}`, INIT]);
		expect(poster().props.disablePlay).toBe(true);
		expect(labels()).toEqual(['attachment.uploading']);

		act(() => renderer.update(<MessageVideo attachmentData={remote} isIngest />));
		act(() => poster().props.onPlay());
		await advance(0);
		expect(video.src).toBe(URL);
	});

	it('keeps playing its playlist when presign_finish arrives, as the playlist turns into VOD', async () => {
		stored = true;
		render(<MessageVideo attachmentData={remote} isPresignPending isIngest />);
		await advance(0);
		act(() => poster().props.onPlay());
		await advance(0);
		expect(video.src).toBe(INDEX);
		video.duration = 300;
		const asked = fetchMock.mock.calls.length;

		act(() => renderer.update(<MessageVideo attachmentData={remote} isIngest />));
		await advance(9000);
		expect(renderer.root.findAllByType('video')).toHaveLength(1);
		expect(video.src).toBe(INDEX);
		expect(fetchMock).toHaveBeenCalledTimes(asked);
	});

	it('plays the original once presign_finish arrived and the playlist answers 404', async () => {
		render(<MessageVideo attachmentData={remote} isIngest />);
		await advance(9000);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(poster().props.disablePlay).toBe(false);

		act(() => poster().props.onPlay());
		await advance(0);
		expect(requests()).toEqual([`${INDEX}?probe=${n + 3}`]);
		expect(video.src).toBe(URL);
	});

	it('asks nothing while the video is off screen', async () => {
		mockIsIntersecting = false;
		render(<MessageVideo attachmentData={remote} isPresignPending isIngest />);
		await advance(9000);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('keeps a pending video without the marker gated, without asking for its playlist', async () => {
		stored = true;
		render(<MessageVideo attachmentData={remote} isPresignPending />);
		await advance(9000);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(poster().props.disablePlay).toBe(true);
	});

	it('shows the sender how much the ingest holds, then that it is finishing', async () => {
		mockUploadProgress = { '1846031000000002001_clip': 0.425 };
		render(<MessageVideo attachmentData={remote} isPresignPending isIngest />);
		await advance(0);
		expect(labels()).toEqual(['attachment.uploading 42%']);

		mockUploadProgress = { '1846031000000002001_clip': 1 };
		act(() => renderer.update(<MessageVideo attachmentData={remote} isPresignPending isIngest />));
		expect(labels()).toEqual(['attachment.finishing']);

		stored = true;
		await advance(3000);
		expect(poster().props.disablePlay).toBe(false);
		expect(labels()).toEqual(['attachment.finishing']);

		act(() => renderer.update(<MessageVideo attachmentData={remote} isIngest />));
		expect(labels()).toEqual([]);
	});
});
