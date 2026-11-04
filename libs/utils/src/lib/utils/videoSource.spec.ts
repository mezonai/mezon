import { isMediaTypeNotSupported } from './file';
import {
	getHlsIndexPlaylistUrl,
	getHlsMasterPlaylistUrl,
	isRotatedHlsVideo,
	isTranscodedVideoContainer,
	mayBeTranscodedVideo,
	probeHlsIndexPlaylist,
	probeHlsMasterPlaylist,
	wantsHlsTranscode
} from './videoSource';

jest.mock('../constant', () => ({ MAX_FILE_ATTACHMENTS: 10 }));
jest.mock('../helper/videoPoster', () => ({ captureVideoPosterFromUrl: jest.fn() }));

const VIDEO = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000001_clip.mp4';
const PLAYLIST = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4/master.m3u8';
const SIGNATURE = '1791900000-c2lnbmF0dXJl';
const MASTER = '#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-STREAM-INF:BANDWIDTH=3137344,RESOLUTION=1280x720\nstream_0/playlist.m3u8\n';
const INDEX = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4/index.m3u8';
const DEV_VIDEO = 'https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000002001_clip.mp4';
const DEV_INDEX = 'https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/index.m3u8';
const EVENT_PLAYLIST = '#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-PLAYLIST-TYPE:EVENT\n#EXT-X-MAP:URI="init.mp4"\n';

function respond(status: number, body: string) {
	return new Response(body, { status });
}

afterEach(() => {
	delete process.env.NX_MEZON_CDN_URL;
	jest.restoreAllMocks();
});

it('only treats files on the transcoding hosts as possibly converted', () => {
	expect(mayBeTranscodedVideo(VIDEO)).toBe(true);
	expect(mayBeTranscodedVideo(`${VIDEO}?${SIGNATURE}`)).toBe(true);
	expect(mayBeTranscodedVideo('http://cdn.mezon.vn/1cf93b197d401000/clip.mov')).toBe(true);
	expect(mayBeTranscodedVideo('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).toBe(false);
	expect(mayBeTranscodedVideo('https://cdn.mezon.ai.example.com/clip.mp4')).toBe(false);
	expect(mayBeTranscodedVideo('blob:https://mezon.ai/0b6f')).toBe(false);
	expect(mayBeTranscodedVideo(`${VIDEO}/master.m3u8`)).toBe(false);
	expect(mayBeTranscodedVideo('https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4')).toBe(false);
	expect(mayBeTranscodedVideo('https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4/stream_0/data000.ts')).toBe(false);
	expect(mayBeTranscodedVideo('https://cdn.mezon.ai/1cf93b197d401000/')).toBe(false);
	expect(mayBeTranscodedVideo(`${VIDEO}#t=3`)).toBe(false);
	expect(mayBeTranscodedVideo(undefined)).toBe(false);
});

it('points at the master playlist under the hls/ prefix and keeps the CDN signature', () => {
	expect(getHlsMasterPlaylistUrl(VIDEO)).toBe(PLAYLIST);
	expect(getHlsMasterPlaylistUrl(`${VIDEO}?${SIGNATURE}`)).toBe(`${PLAYLIST}?${SIGNATURE}`);
	expect(getHlsMasterPlaylistUrl('http://cdn.mezon.vn/1cf93b197d401000/clip.mov')).toBe(
		'http://cdn.mezon.vn/hls/1cf93b197d401000/clip.mov/master.m3u8'
	);
	expect(getHlsMasterPlaylistUrl('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).toBeUndefined();
});

it('plays the containers the media server converts and keeps the rest as files', () => {
	for (const name of ['movie.mkv', 'OLD.AVI', 'clip.flv', 'clip.wmv']) {
		const url = `https://cdn.mezon.ai/1cf93b197d401000/2081000000000000013_${name}`;
		expect(isTranscodedVideoContainer(url)).toBe(true);
		expect(isMediaTypeNotSupported('video/mkv', url)).toBe(false);
		expect(isMediaTypeNotSupported('application/octet-stream', `${url}?${SIGNATURE}`)).toBe(false);
	}
	expect(isTranscodedVideoContainer(VIDEO)).toBe(false);
	expect(isMediaTypeNotSupported('video/mkv', 'https://cdn.komu.vn/1cf93b197d401000/movie.mkv')).toBe(true);
	expect(isMediaTypeNotSupported('video', 'https://cdn.mezon.ai/1cf93b197d401000/movie.rmvb')).toBe(true);
	expect(isMediaTypeNotSupported('image/bmp', 'https://cdn.mezon.ai/1cf93b197d401000/scan.bmp')).toBe(true);
});

it('resolves to the signed playlist when the converted stream exists', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(respond(200, MASTER));

	await expect(probeHlsMasterPlaylist(`${VIDEO}?${SIGNATURE}`)).resolves.toBe(`${PLAYLIST}?${SIGNATURE}`);

	const probed = String(fetchMock.mock.calls[0][0]);
	expect(probed).toMatch(new RegExp(`^${PLAYLIST.replace(/\./g, '\\.')}\\?probe=[0-9a-f]+$`));
});

it('asks the CDN for a fresh answer on every probe so a cached 404 cannot hide a new stream', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(respond(404, '<Error><Code>NoSuchKey</Code></Error>'));
	const now = jest.spyOn(Date, 'now');

	now.mockReturnValue(1000);
	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBeUndefined();
	now.mockReturnValue(2000);
	fetchMock.mockResolvedValue(respond(200, MASTER));
	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBe(PLAYLIST);

	expect(String(fetchMock.mock.calls[0][0])).not.toBe(String(fetchMock.mock.calls[1][0]));
});

it('plays the original when the probe answers anything but a playlist', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch');

	fetchMock.mockResolvedValueOnce(respond(200, '<html>login</html>'));
	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBeUndefined();
	fetchMock.mockResolvedValueOnce(respond(503, ''));
	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBeUndefined();
	fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBeUndefined();
});

it('never probes a file outside the transcoding hosts', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch');

	await expect(probeHlsMasterPlaylist('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).resolves.toBeUndefined();
	await expect(probeHlsMasterPlaylist('blob:https://mezon.ai/0b6f')).resolves.toBeUndefined();

	expect(fetchMock).not.toHaveBeenCalled();
});

it('reads only the head of the playlist', async () => {
	let pulled = 0;
	let cancelled = false;
	const body = new ReadableStream<Uint8Array>({
		pull(controller) {
			pulled += 1;
			controller.enqueue(new TextEncoder().encode(pulled === 1 ? '#EXT' : 'M3U\n#EXT-X-VERSION:6\n'));
		},
		cancel() {
			cancelled = true;
		}
	});
	jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }));

	await expect(probeHlsMasterPlaylist(VIDEO)).resolves.toBe(PLAYLIST);
	expect(cancelled).toBe(true);
	expect(pulled).toBeLessThanOrEqual(3);
});

it('gives up when the caller aborts or the CDN hangs', async () => {
	jest.useFakeTimers();
	try {
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				})
		);

		const caller = new AbortController();
		const aborted = probeHlsMasterPlaylist(VIDEO, caller.signal);
		caller.abort();
		await expect(aborted).resolves.toBeUndefined();

		const hung = probeHlsMasterPlaylist(VIDEO);
		jest.advanceTimersByTime(5000);
		await expect(hung).resolves.toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	} finally {
		jest.useRealTimers();
	}
});

it('asks the server to transcode every video the media server accepts, whatever its size', () => {
	for (const name of ['clip.mp4', 'IMG_0001.MOV', 'movie.mkv', 'old.avi', 'a.flv', 'b.m4v', 'c.wmv']) {
		expect(wantsHlsTranscode(name)).toBe(true);
	}
	for (const name of ['clip.webm', 'photo.png', 'song.mp3', 'notes.pdf', 'mp4', '.mp4', 'clip.mp4.zip', '']) {
		expect(wantsHlsTranscode(name)).toBe(false);
	}
	expect(wantsHlsTranscode(undefined)).toBe(false);
});

it('builds the playlist of the file ingest from the origin and path of the attachment, without its signature', () => {
	expect(getHlsIndexPlaylistUrl(VIDEO)).toBe(INDEX);
	expect(getHlsIndexPlaylistUrl(`${VIDEO}?${SIGNATURE}`)).toBe(INDEX);
	expect(getHlsIndexPlaylistUrl('http://cdn.mezon.vn/1cf93b197d401000/IMG_0001.MOV')).toBe(
		'http://cdn.mezon.vn/hls/1cf93b197d401000/IMG_0001.MOV/index.m3u8'
	);
	expect(getHlsIndexPlaylistUrl('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).toBeUndefined();
	expect(getHlsIndexPlaylistUrl(INDEX)).toBeUndefined();
	expect(getHlsIndexPlaylistUrl(undefined)).toBeUndefined();
});

it('takes the configured CDN as a host with HLS, the dev CDN among others', () => {
	expect(mayBeTranscodedVideo(DEV_VIDEO)).toBe(false);
	expect(getHlsIndexPlaylistUrl(DEV_VIDEO)).toBeUndefined();

	process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
	expect(mayBeTranscodedVideo(DEV_VIDEO)).toBe(true);
	expect(getHlsIndexPlaylistUrl(`${DEV_VIDEO}?${SIGNATURE}`)).toBe(DEV_INDEX);
	expect(getHlsMasterPlaylistUrl(DEV_VIDEO)).toBe('https://cdn-dev.nccsoft.vn/hls/0000000000031031/1846031000000002001_clip.mp4/master.m3u8');
	expect(getHlsIndexPlaylistUrl(VIDEO)).toBe(INDEX);

	process.env.NX_MEZON_CDN_URL = 'https://cdn.mezon.ai';
	expect(mayBeTranscodedVideo(DEV_VIDEO)).toBe(false);
	expect(mayBeTranscodedVideo(VIDEO)).toBe(true);

	process.env.NX_MEZON_CDN_URL = 'not a url';
	expect(mayBeTranscodedVideo(VIDEO)).toBe(true);
	expect(mayBeTranscodedVideo(DEV_VIDEO)).toBe(false);
});

it('leaves other containers on the configured CDN as files, since only the prod media server converts them', () => {
	process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
	expect(isTranscodedVideoContainer('https://cdn-dev.nccsoft.vn/0000000000031031/1846031000000002001_movie.mkv')).toBe(false);
	expect(isTranscodedVideoContainer('https://cdn.mezon.ai/1cf93b197d401000/2081000000000000013_movie.mkv')).toBe(true);
});

it('probes the ingest playlist with n = Unix ms / 3000 rounded down, the same for every viewer during the same 3 s', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => respond(404, '<Error><Code>NoSuchKey</Code></Error>'));
	const now = jest.spyOn(Date, 'now');

	for (const [ms, n] of [
		[2999, 0],
		[3000, 1],
		[5999, 1],
		[6000, 2],
		[1793000000123, 597666666]
	]) {
		now.mockReturnValue(ms);
		await expect(probeHlsIndexPlaylist(`${VIDEO}?${SIGNATURE}`)).resolves.toBeUndefined();
		expect(String(fetchMock.mock.lastCall?.[0])).toBe(`${INDEX}?probe=${n}`);
	}
});

it('resolves to the ingest playlist once its body starts with #EXTM3U', async () => {
	const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => respond(200, EVENT_PLAYLIST));
	await expect(probeHlsIndexPlaylist(VIDEO)).resolves.toBe(INDEX);

	fetchMock.mockImplementation(async () => respond(200, '<html>login</html>'));
	await expect(probeHlsIndexPlaylist(VIDEO)).resolves.toBeUndefined();

	await expect(probeHlsIndexPlaylist('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).resolves.toBeUndefined();
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

describe('isRotatedHlsVideo', () => {
	const INIT = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4/init.mp4';
	const UPRIGHT = [1, 0, 0, 1];
	const QUARTER_AS_IPHONE = [0, 1, -1, 0, 2160, 0];
	const HALF = [-1, 0, 0, -1, 1920, 1080];
	const THREE_QUARTERS = [0, -1, 1, 0, 0, 1920];
	const MIRRORED = [-1, 0, 0, 1, 1920, 0];

	function box(type: string, ...parts: Uint8Array[]): Uint8Array {
		const bytes = new Uint8Array(8 + parts.reduce((size, part) => size + part.length, 0));
		new DataView(bytes.buffer).setUint32(0, bytes.length);
		bytes.set(
			Array.from(type, (char) => char.charCodeAt(0)),
			4
		);
		let at = 8;
		for (const part of parts) {
			bytes.set(part, at);
			at += part.length;
		}
		return bytes;
	}

	function trackHeader([a, b, c, d, x = 0, y = 0]: number[], width: number, height: number, version = 0): Uint8Array {
		const matrix = version === 1 ? 52 : 40;
		const body = new Uint8Array(matrix + 44);
		const view = new DataView(body.buffer);
		view.setUint8(0, version);
		[a, b, 0, c, d, 0, x, y].forEach((value, i) => view.setInt32(matrix + i * 4, value * 0x10000));
		view.setInt32(matrix + 32, 0x40000000);
		view.setUint32(matrix + 36, width * 0x10000);
		view.setUint32(matrix + 40, height * 0x10000);
		return box('tkhd', body);
	}

	const initSegment = (...headers: Uint8Array[]) =>
		new Uint8Array([
			...box('ftyp', new TextEncoder().encode('iso6')),
			...box('moov', box('mvhd', new Uint8Array(100)), ...headers.map((header) => box('trak', header)))
		]);
	const serve = (body: Uint8Array | string, status = 200) =>
		jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(body, { status }));

	it('reads the init segment next to the playlist, without the signature of the master', async () => {
		const fetchMock = serve(initSegment(trackHeader(UPRIGHT, 1920, 1080)));

		await isRotatedHlsVideo(INDEX);
		await isRotatedHlsVideo(`${PLAYLIST}?${SIGNATURE}`);

		expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([INIT, INIT]);
	});

	it('is true for a video turned a quarter, half or three quarters, or mirrored, in a version 0 or 1 track header', async () => {
		for (const [matrix, version] of [
			[QUARTER_AS_IPHONE, 0],
			[HALF, 0],
			[THREE_QUARTERS, 1],
			[MIRRORED, 0]
		] as const) {
			serve(initSegment(trackHeader(UPRIGHT, 0, 0), trackHeader(matrix, 1920, 1080, version)));
			await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(true);
		}
	});

	it('is false for an upright video whatever its sound track says, and for a missing, cut or foreign init segment', async () => {
		serve(initSegment(trackHeader(HALF, 0, 0), trackHeader(UPRIGHT, 3840, 2160, 1)));
		await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(false);

		serve('<Error><Code>NoSuchKey</Code></Error>', 404);
		await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(false);
		serve('<html>login</html>');
		await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(false);
		serve(initSegment(trackHeader(QUARTER_AS_IPHONE, 1920, 1080)).subarray(0, 150));
		await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(false);
		jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
		await expect(isRotatedHlsVideo(INDEX)).resolves.toBe(false);
	});
});
