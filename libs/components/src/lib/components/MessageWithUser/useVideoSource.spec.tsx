import { useRef } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';
import { useVideoSource } from './useVideoSource';

jest.mock('@mezon/utils', () => jest.requireActual('../../../../../utils/src/lib/utils/videoSource'), { virtual: true });

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

class FakeVideo {
	private source = '';
	private listeners: Record<string, (() => void)[]> = {};
	nativeHls = '';
	paused = true;
	videoWidth = 0;
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
	}
	play = jest.fn(() => {
		this.paused = false;
		return Promise.resolve();
	});
	canPlayType(type: string) {
		return type === 'application/vnd.apple.mpegurl' ? this.nativeHls : '';
	}
}

function Player({ url, enabled = true, preview = false }: { url?: string; enabled?: boolean; preview?: boolean }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const { failed, handleError } = useVideoSource(videoRef, url, enabled, { preview });
	return enabled ? <video ref={videoRef} data-failed={failed} onError={handleError} /> : null;
}

let video: FakeVideo;
let fetchMock: jest.SpyInstance;
let renderer: ReactTestRenderer;

function render(element: React.ReactElement) {
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
	fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
	act(() => renderer?.unmount());
	jest.restoreAllMocks();
});

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
