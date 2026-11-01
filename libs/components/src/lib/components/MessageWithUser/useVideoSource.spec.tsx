import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useIngestPlaylistReady, useVideoSource } from './useVideoSource';

type TestInstance = { props: { onError: () => void; 'data-failed'?: boolean; 'data-ready'?: boolean } };
type ReactTestRenderer = { root: { findByType: (type: string) => TestInstance }; update: (element: ReactElement) => void; unmount: () => void };
// The workspace has this renderer but not its optional type package.
const { act, create } = jest.requireActual<{
	act: { (callback: () => Promise<void>): Promise<void>; (callback: () => void): void };
	create: (element: ReactElement, options?: { createNodeMock: (node: { type: unknown }) => unknown }) => ReactTestRenderer;
}>('react-test-renderer');

let mockIsSafari = false;
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/videoSource'),
		get IS_SAFARI() {
			return mockIsSafari;
		}
	}),
	{ virtual: true }
);

type HlsErrorListener = (event: string, data: { fatal: boolean }) => void;

const mockHlsInstances: MockHls[] = [];
let mockHlsSupported = true;

class MockHls {
	static Events = { ERROR: 'hlsError' };
	static isSupported = () => mockHlsSupported;
	source?: string;
	media?: unknown;
	destroyed = false;
	private errorListener?: HlsErrorListener;

	constructor(readonly config: Record<string, unknown>) {
		mockHlsInstances.push(this);
	}

	on(_event: string, listener: HlsErrorListener) {
		this.errorListener = listener;
	}

	loadSource(url: string) {
		this.source = url;
	}

	attachMedia(media: unknown) {
		this.media = media;
	}

	destroy() {
		this.destroyed = true;
	}

	fail(fatal: boolean) {
		this.errorListener?.('hlsError', { fatal });
	}
}

jest.mock('hls.js', () => ({ __esModule: true, default: MockHls }));

const VIDEO = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000001_movie.mkv';
const SIGNED = `${VIDEO}?1791900000-c2lnbmF0dXJl`;
const PLAYLIST = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_movie.mkv/master.m3u8?1791900000-c2lnbmF0dXJl';
const CLIP = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000003_clip.mp4?1791900000-c2lnbmF0dXJl';
const CLIP_PLAYLIST = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000003_clip.mp4/master.m3u8?1791900000-c2lnbmF0dXJl';
const MASTER = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3137344,RESOLUTION=1280x720\nstream_0/playlist.m3u8\n';
const DEV_CLIP = 'https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000002001_clip.mp4?1791900000-c2lnbmF0dXJl';
const DEV_INDEX = 'https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/index.m3u8';
const DEV_MASTER = 'https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/master.m3u8?1791900000-c2lnbmF0dXJl';
const EVENT_PLAYLIST = '#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-PLAYLIST-TYPE:EVENT\n#EXT-X-START:TIME-OFFSET=0\n#EXT-X-MAP:URI="init.mp4"\n';

class FakeVideo {
	private source = '';
	private listeners: Record<string, (() => void)[]> = {};
	nativeHls = '';
	paused = true;
	videoWidth = 0;
	currentTime = 0;
	duration = NaN;
	addEventListener(type: string, listener: () => void) {
		(this.listeners[type] ??= []).push(listener);
	}
	removeEventListener(type: string, listener: () => void) {
		this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== listener);
	}
	emit(type: string) {
		(this.listeners[type] ?? []).forEach((listener) => listener());
	}
	get src() {
		return this.source;
	}
	// Like the media element's load algorithm: a new source cancels a pending play.
	set src(value: string) {
		this.source = value;
		this.paused = true;
		this.currentTime = 0;
		this.duration = NaN;
	}
	play = jest.fn(() => {
		this.paused = false;
		return Promise.resolve();
	});
	canPlayType(type: string) {
		return type === 'application/vnd.apple.mpegurl' ? this.nativeHls : '';
	}
}

function Player({ url, enabled = true, preview = false, ingest = false }: { url?: string; enabled?: boolean; preview?: boolean; ingest?: boolean }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const { failed, handleError } = useVideoSource(videoRef, url, enabled, { preview, ingest });
	return enabled ? <video ref={videoRef} data-failed={failed} onError={handleError} /> : null;
}

let video: FakeVideo;
let fetchMock: jest.SpiedFunction<typeof fetch>;
let renderer: ReactTestRenderer;

function render(element: ReactElement) {
	act(() => {
		renderer = create(element, { createNodeMock: (node) => (node.type === 'video' ? video : null) });
	});
}

async function settle() {
	await act(async () => {
		for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

function mediaError() {
	act(() => renderer.root.findByType('video').props.onError());
}

function isFailed() {
	return renderer.root.findByType('video').props['data-failed'];
}

function serveStream(exists: boolean) {
	fetchMock.mockImplementation(async () =>
		exists ? new Response(MASTER, { status: 200 }) : new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 })
	);
}

beforeEach(() => {
	video = new FakeVideo();
	mockHlsInstances.length = 0;
	mockHlsSupported = true;
	mockIsSafari = false;
	fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
	act(() => renderer?.unmount());
	delete process.env.NX_MEZON_CDN_URL;
	jest.useRealTimers();
	jest.restoreAllMocks();
});

function serveIngest(playlists: Record<string, boolean>) {
	fetchMock.mockImplementation(async (input) => {
		const found = Object.entries(playlists).find(([playlist]) => String(input).startsWith(`${playlist}?`));
		return found?.[1]
			? new Response(found[0].includes('index.m3u8') ? EVENT_PLAYLIST : MASTER, { status: 200 })
			: new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 });
	});
}

const probed = () => fetchMock.mock.calls.map(([input]) => String(input).split('?')[0]);

it('plays a file outside the transcoding hosts as it is, without probing', async () => {
	render(<Player url="https://cdn.komu.vn/1cf93b197d401000/clip.mp4" />);
	await settle();

	expect(video.src).toBe('https://cdn.komu.vn/1cf93b197d401000/clip.mp4');
	expect(fetchMock).not.toHaveBeenCalled();
	expect(video.play).not.toHaveBeenCalled();
});

it('starts a file outside the transcoding hosts when the viewer pressed play before it loaded', async () => {
	video.paused = false;
	render(<Player url="https://cdn.komu.vn/1cf93b197d401000/clip.mp4" />);
	await settle();

	expect(video.src).toBe('https://cdn.komu.vn/1cf93b197d401000/clip.mp4');
	expect(video.play).toHaveBeenCalledTimes(1);
	expect(video.paused).toBe(false);
});

it('plays the stream of an mp4 the media server converted, like any other video', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={CLIP} />);
	await settle();

	expect(video.src).toBe(CLIP_PLAYLIST);
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(mockHlsInstances).toHaveLength(0);
});

it('plays the original of an mp4 the media server has not converted yet', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={CLIP} />);
	await settle();

	expect(video.src).toBe(CLIP);
	expect(isFailed()).toBe(false);
});

it('moves an original that plays without a picture to its stream once the stream exists', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={CLIP} />);
	await settle();
	expect(video.src).toBe(CLIP);

	serveStream(true);
	video.paused = false;
	act(() => video.emit('loadedmetadata'));
	await settle();

	expect(video.src).toBe(CLIP_PLAYLIST);
	expect(video.play).toHaveBeenCalledTimes(1);
	expect(isFailed()).toBe(false);
});

it('keeps an original without a picture when it has no stream, like a clip with only sound', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={CLIP} />);
	await settle();
	act(() => video.emit('loadedmetadata'));
	await settle();

	expect(video.src).toBe(CLIP);
	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(isFailed()).toBe(false);
});

it('leaves an original that shows a picture alone', async () => {
	serveStream(false);

	render(<Player url={CLIP} />);
	await settle();
	video.videoWidth = 1920;
	act(() => video.emit('loadedmetadata'));
	await settle();

	expect(video.src).toBe(CLIP);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('plays the converted stream natively where the browser can', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();

	expect(video.src).toBe(PLAYLIST);
	expect(mockHlsInstances).toHaveLength(0);
});

it('plays the converted stream through hls.js where the browser cannot', async () => {
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();

	expect(video.src).toBe('');
	expect(mockHlsInstances).toHaveLength(1);
	expect(mockHlsInstances[0].source).toBe(PLAYLIST);
	expect(mockHlsInstances[0].media).toBe(video);
	expect(mockHlsInstances[0].config).toEqual({ capLevelToPlayerSize: true });
});

it('tries the stream once when an unconverted original fails, then gives up', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={SIGNED} />);
	await settle();
	expect(video.src).toBe(SIGNED);

	mediaError();
	await settle();
	expect(video.src).toBe(PLAYLIST);
	expect(isFailed()).toBe(false);

	mediaError();
	await settle();
	expect(isFailed()).toBe(true);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('falls back to the original when the converted stream fails', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();
	mediaError();
	await settle();
	expect(video.src).toBe(SIGNED);

	mediaError();
	await settle();
	expect(isFailed()).toBe(true);
});

it('keeps playing on the other source when the viewer had pressed play', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={SIGNED} />);
	await settle();
	video.paused = false;
	mediaError();
	await settle();

	expect(video.src).toBe(PLAYLIST);
	expect(video.play).toHaveBeenCalledTimes(1);
});

it('leaves a paused video paused on the other source', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();
	mediaError();
	await settle();

	expect(video.src).toBe(SIGNED);
	expect(video.play).not.toHaveBeenCalled();
});

it('fails at once for a file that cannot have been converted', async () => {
	render(<Player url="https://cdn.komu.vn/1cf93b197d401000/clip.mp4" />);
	await settle();

	mediaError();
	expect(isFailed()).toBe(true);
});

it('leaves recoverable hls.js errors to hls.js and falls back to the original on a fatal one', async () => {
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();
	const [hls] = mockHlsInstances;

	mediaError();
	act(() => hls.fail(false));
	await settle();
	expect(hls.destroyed).toBe(false);
	expect(video.src).toBe('');

	act(() => hls.fail(true));
	await settle();
	expect(hls.destroyed).toBe(true);
	expect(video.src).toBe(SIGNED);
	expect(isFailed()).toBe(false);
});

it('plays the original when the browser has no Media Source Extensions', async () => {
	mockHlsSupported = false;
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();

	expect(mockHlsInstances).toHaveLength(0);
	expect(video.src).toBe(SIGNED);
});

it('buffers a single segment of the smallest rendition for a preview', async () => {
	serveStream(true);

	render(<Player url={SIGNED} preview />);
	await settle();

	expect(mockHlsInstances[0].config).toEqual({ capLevelToPlayerSize: true, startLevel: 0, maxBufferLength: 1, maxMaxBufferLength: 1 });
});

it('drops the probe and releases hls.js once the video goes away', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);
	render(<Player url={SIGNED} />);
	act(() => renderer.update(<Player url={SIGNED} enabled={false} />));
	await settle();
	expect(video.src).toBe('');
	expect((fetchMock.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);

	video.nativeHls = '';
	render(<Player url={SIGNED} />);
	await settle();
	const [hls] = mockHlsInstances;
	act(() => renderer.unmount());
	expect(hls.destroyed).toBe(true);
});

it('keeps the loaded source when only the CDN signature is renewed', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();
	act(() => renderer.update(<Player url={`${VIDEO}?1791999999-ZnJlc2g`} />));
	await settle();

	expect(video.src).toBe(PLAYLIST);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('signs the next source with the renewed signature', async () => {
	video.nativeHls = 'maybe';
	serveStream(true);

	render(<Player url={SIGNED} />);
	await settle();
	act(() => renderer.update(<Player url={`${VIDEO}?1791999999-ZnJlc2g`} />));
	mediaError();
	await settle();

	expect(video.src).toBe(`${VIDEO}?1791999999-ZnJlc2g`);
});

it('stays failed through a renewed signature and starts over for another file', async () => {
	video.nativeHls = 'maybe';
	serveStream(false);

	render(<Player url={SIGNED} />);
	await settle();
	mediaError();
	await settle();
	mediaError();
	act(() => renderer.update(<Player url={`${VIDEO}?1791999999-ZnJlc2g`} />));
	expect(isFailed()).toBe(true);

	serveStream(true);
	const other = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000002_other.mkv';
	act(() => renderer.update(<Player url={other} />));
	expect(isFailed()).toBe(false);
	await settle();
	expect(video.src).toBe('https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000002_other.mkv/master.m3u8');
});

describe('a video sent through the file ingest', () => {
	const DEV_MASTER_PATH = DEV_MASTER.split('?')[0];

	beforeEach(() => {
		process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
	});

	it('plays its EVENT playlist from the start through hls.js, probed as index.m3u8 with the shared probe value', async () => {
		jest.spyOn(Date, 'now').mockReturnValue(1793000000123);
		serveIngest({ [DEV_INDEX]: true });

		render(<Player url={DEV_CLIP} ingest />);
		await settle();

		expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([`${DEV_INDEX}?probe=597666666`]);
		expect(mockHlsInstances).toHaveLength(1);
		expect(mockHlsInstances[0].source).toBe(DEV_INDEX);
		expect(mockHlsInstances[0].media).toBe(video);
		expect(mockHlsInstances[0].config).toEqual({ capLevelToPlayerSize: true, startPosition: 0 });
	});

	it('plays it natively in Safari', async () => {
		mockIsSafari = true;
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: true });

		render(<Player url={DEV_CLIP} ingest />);
		await settle();

		expect(video.src).toBe(DEV_INDEX);
		expect(mockHlsInstances).toHaveLength(0);
	});

	it('plays it through hls.js where another browser also plays HLS itself, as Chrome 156 does, since that player stops at the end of the first playlist', async () => {
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: true });

		render(<Player url={DEV_CLIP} ingest />);
		await settle();

		expect(video.src).toBe('');
		expect(mockHlsInstances).toHaveLength(1);
		expect(mockHlsInstances[0].source).toBe(DEV_INDEX);
		expect(mockHlsInstances[0].config).toEqual({ capLevelToPlayerSize: true, startPosition: 0 });
	});

	it('keeps the native player for a video without the marker in such a browser', async () => {
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_MASTER_PATH]: true });

		render(<Player url={DEV_CLIP} />);
		await settle();

		expect(video.src).toBe(DEV_MASTER);
		expect(mockHlsInstances).toHaveLength(0);
	});

	it('plays the original when its playlist answers 404', async () => {
		mockIsSafari = true;
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: false, [DEV_MASTER_PATH]: true });

		render(<Player url={DEV_CLIP} ingest />);
		await settle();

		expect(video.src).toBe(DEV_CLIP);
		expect(probed()).toEqual([DEV_INDEX]);
	});

	it('keeps its playlist while it plays and falls back to the original once, never to master.m3u8', async () => {
		mockIsSafari = true;
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: true, [DEV_MASTER_PATH]: true });
		render(<Player url={DEV_CLIP} ingest />);
		await settle();
		expect(video.src).toBe(DEV_INDEX);

		mediaError();
		await settle();
		expect(video.src).toBe(DEV_CLIP);
		expect(isFailed()).toBe(false);

		mediaError();
		await settle();
		expect(isFailed()).toBe(true);
		expect(probed()).toEqual([DEV_INDEX]);
	});

	it('tries its playlist, not master.m3u8, when the original fails or shows no picture', async () => {
		mockIsSafari = true;
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: false, [DEV_MASTER_PATH]: true });
		render(<Player url={DEV_CLIP} ingest />);
		await settle();
		mediaError();
		await settle();
		expect(video.src).toBe(DEV_INDEX);

		act(() => renderer.unmount());
		video = new FakeVideo();
		video.nativeHls = 'maybe';
		render(<Player url={DEV_CLIP} ingest />);
		await settle();
		serveIngest({ [DEV_INDEX]: true });
		act(() => video.emit('loadedmetadata'));
		await settle();
		expect(video.src).toBe(DEV_INDEX);
		expect(probed()).not.toContain(DEV_MASTER_PATH);
	});

	it('keeps the old rule for a video without the marker, on the dev CDN too: master.m3u8, then the original', async () => {
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: true, [DEV_MASTER_PATH]: true });
		render(<Player url={DEV_CLIP} />);
		await settle();
		expect(video.src).toBe(DEV_MASTER);
		expect(probed()).toEqual([DEV_MASTER_PATH]);

		act(() => renderer.unmount());
		video = new FakeVideo();
		video.nativeHls = 'maybe';
		serveIngest({ [DEV_INDEX]: true });
		render(<Player url={DEV_CLIP} />);
		await settle();
		expect(video.src).toBe(DEV_CLIP);
	});

	describe('in Safari, whose player keeps a playlist it started on as live without a duration after #EXT-X-ENDLIST arrives', () => {
		const START = 1793000000000;
		const n = Math.floor(START / 3000);
		const advance = (ms: number) =>
			act(async () => {
				await jest.advanceTimersByTimeAsync(ms);
			});
		let ended: boolean;

		beforeEach(() => {
			jest.useFakeTimers({ now: START, doNotFake: ['nextTick', 'queueMicrotask'] });
			mockIsSafari = true;
			video.nativeHls = 'maybe';
			ended = false;
			fetchMock.mockImplementation(async () => new Response(ended ? `${EVENT_PLAYLIST}#EXT-X-ENDLIST\n` : EVENT_PLAYLIST, { status: 200 }));
		});

		it('reads it every 3 s with the shared probe value and, once it has ended, loads the copy read at the same position, still playing', async () => {
			render(<Player url={DEV_CLIP} ingest />);
			await advance(0);
			expect(video.src).toBe(DEV_INDEX);
			video.paused = false;
			video.duration = Infinity;
			video.currentTime = 12.5;

			await advance(3000);
			expect(video.src).toBe(DEV_INDEX);
			ended = true;
			await advance(3000);

			expect(video.src).toBe(`${DEV_INDEX}?probe=${n + 2}`);
			expect(video.currentTime).toBe(12.5);
			expect(video.play).toHaveBeenCalledTimes(1);
			await advance(30000);
			expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
				`${DEV_INDEX}?probe=${n}`,
				`${DEV_INDEX}?probe=${n + 1}`,
				`${DEV_INDEX}?probe=${n + 2}`
			]);
		});

		it('leaves a paused video paused', async () => {
			render(<Player url={DEV_CLIP} ingest />);
			await advance(0);
			video.duration = Infinity;
			video.currentTime = 30;
			ended = true;
			await advance(3000);

			expect(video.src).toBe(`${DEV_INDEX}?probe=${n + 1}`);
			expect(video.currentTime).toBe(30);
			expect(video.play).not.toHaveBeenCalled();
		});

		it('asks nothing more once the player knows the duration, or after falling back to the original', async () => {
			render(<Player url={DEV_CLIP} ingest />);
			await advance(0);
			video.duration = 20.1;
			await advance(30000);
			expect(fetchMock).toHaveBeenCalledTimes(1);

			act(() => renderer.unmount());
			video = new FakeVideo();
			video.nativeHls = 'maybe';
			render(<Player url={DEV_CLIP} ingest />);
			await advance(0);
			video.duration = Infinity;
			mediaError();
			await advance(30000);
			expect(video.src).toBe(DEV_CLIP);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});
});

describe('useIngestPlaylistReady', () => {
	const START = 1793000000000;
	const n = Math.floor(START / 3000);

	function Probe({ url, enabled }: { url?: string; enabled: boolean }) {
		return <span data-ready={useIngestPlaylistReady(url, enabled)} />;
	}
	const isReady = () => renderer.root.findByType('span').props['data-ready'];
	const advance = (ms: number) =>
		act(async () => {
			await jest.advanceTimersByTimeAsync(ms);
		});

	beforeEach(() => {
		process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
		jest.useFakeTimers({ now: START, doNotFake: ['nextTick', 'queueMicrotask'] });
	});

	it('asks every 3 s, with n = Unix ms / 3000, until the playlist exists, then stops', async () => {
		let stored = false;
		fetchMock.mockImplementation(async () =>
			stored ? new Response(EVENT_PLAYLIST, { status: 200 }) : new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 })
		);

		render(<Probe url={DEV_CLIP} enabled />);
		await advance(0);
		expect(isReady()).toBe(false);
		await advance(2999);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await advance(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		stored = true;
		await advance(3000);
		expect(isReady()).toBe(true);
		await advance(30000);

		expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
			`${DEV_INDEX}?probe=${n}`,
			`${DEV_INDEX}?probe=${n + 1}`,
			`${DEV_INDEX}?probe=${n + 2}`
		]);
	});

	it('asks nothing while disabled, stops when disabled, and does not ask again once ready', async () => {
		fetchMock.mockImplementation(async () => new Response('', { status: 404 }));
		render(<Probe url={DEV_CLIP} enabled={false} />);
		await advance(9000);
		expect(fetchMock).not.toHaveBeenCalled();

		act(() => renderer.update(<Probe url={DEV_CLIP} enabled />));
		await advance(0);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		act(() => renderer.update(<Probe url={DEV_CLIP} enabled={false} />));
		await advance(9000);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		fetchMock.mockImplementation(async () => new Response(EVENT_PLAYLIST, { status: 200 }));
		act(() => renderer.update(<Probe url={DEV_CLIP} enabled />));
		await advance(0);
		expect(isReady()).toBe(true);
		act(() => renderer.update(<Probe url={`${DEV_CLIP.split('?')[0]}?1791999999-ZnJlc2g`} enabled={false} />));
		act(() => renderer.update(<Probe url={`${DEV_CLIP.split('?')[0]}?1791999999-ZnJlc2g`} enabled />));
		await advance(9000);
		expect(isReady()).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('never asks for a file outside the hosts with HLS', async () => {
		render(<Probe url="https://cdn.komu.vn/1cf93b197d401000/clip.mp4" enabled />);
		await advance(9000);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(isReady()).toBe(false);
	});
});
