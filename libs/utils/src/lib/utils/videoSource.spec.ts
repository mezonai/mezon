import { isMediaTypeNotSupported } from './file';
import { FragmentedMp4Indexer, fragmentedMp4InitEnd } from './fragmentedMp4';
import {
	getHlsIndexPlaylistUrl,
	getHlsMasterPlaylistUrl,
	isRotatedHlsVideo,
	isTranscodedVideoContainer,
	mayBeTranscodedVideo,
	probeFragmentedMp4Playlist,
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

describe('probeFragmentedMp4Playlist', () => {
	function u32(value: number): Uint8Array {
		const out = new Uint8Array(4);
		new DataView(out.buffer).setUint32(0, value, false);
		return out;
	}

	function mp4Box(type: string, ...parts: Uint8Array[]): Uint8Array {
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

	function fullBox(type: string, version: number, flags: number, ...parts: Uint8Array[]): Uint8Array {
		return mp4Box(type, u32((((version & 0xff) << 24) | (flags & 0xffffff)) >>> 0), ...parts);
	}

	function buildRecording(withMfra: boolean, fragmented = true, mdatSize = 12000): { bytes: Uint8Array; mfraSize: number } {
		const ftyp = mp4Box('ftyp', new TextEncoder().encode('isom'), u32(512), new TextEncoder().encode('iso6'));
		const mvhd = fullBox('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(0), new Uint8Array(80));
		const tkhd = fullBox('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(0), new Uint8Array(60));
		const mdhd = fullBox('mdhd', 0, 0, u32(0), u32(0), u32(1000), u32(0), u32(0));
		const hdlr = fullBox('hdlr', 0, 0, u32(0), new TextEncoder().encode('vide'), new Uint8Array(13));
		const trak = mp4Box('trak', tkhd, mp4Box('mdia', mdhd, hdlr, mp4Box('minf', mp4Box('stbl'))));
		const mvex = fragmented ? mp4Box('mvex', fullBox('trex', 0, 0, u32(1), u32(1), u32(3000), u32(0), u32(0))) : new Uint8Array(0);
		const moov = mp4Box('moov', mvhd, trak, mvex);

		if (!fragmented) {
			return { bytes: new Uint8Array([...ftyp, ...moov, ...mp4Box('mdat', new Uint8Array(24000))]), mfraSize: 0 };
		}

		const makeFrag = (seq: number, base: number) => [
			mp4Box(
				'moof',
				fullBox('mfhd', 0, 0, u32(seq)),
				mp4Box('traf', fullBox('tfhd', 0, 0x020000, u32(1)), fullBox('tfdt', 0, 0, u32(base)), fullBox('trun', 0, 0, u32(1)))
			),
			mp4Box('mdat', new Uint8Array(mdatSize))
		];
		const [moof1, mdat1] = makeFrag(1, 0);
		const [moof2, mdat2] = makeFrag(2, 3000);
		const raw = new Uint8Array([...ftyp, ...moov, ...moof1, ...mdat1, ...moof2, ...mdat2]);

		if (!withMfra) {
			return { bytes: raw, mfraSize: 0 };
		}

		const indexer = new FragmentedMp4Indexer();
		indexer.push(raw);
		const fin = indexer.finish()!;
		const full = new Uint8Array(raw.length + fin.tail.length);
		full.set(raw.subarray(0, fin.headOffset), 0);
		full.set(fin.head, fin.headOffset);
		full.set(raw.subarray(fin.headOffset + fin.head.length), fin.headOffset + fin.head.length);
		full.set(fin.tail, raw.length);
		return { bytes: full, mfraSize: fin.tail.length };
	}

	function serveRange(file: Uint8Array) {
		return jest.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
			const headers = new Headers(init?.headers);
			const range = headers.get('range') ?? '';
			expect(range).toMatch(/^bytes=\d+-\d+$/);
			const [, startStr, endStr] = /^bytes=(\d+)-(\d+)$/.exec(range)!;
			const start = Number(startStr);
			const end = Math.min(Number(endStr), file.length - 1);
			return new Response(file.subarray(start, end + 1), {
				status: 206,
				headers: { 'Content-Range': `bytes ${start}-${end}/${file.length}` }
			});
		});
	}

	it('makes no request for non-CDN hosts or non-mp4/m4v/mov extensions', async () => {
		const fetchMock = jest.spyOn(globalThis, 'fetch');

		await expect(probeFragmentedMp4Playlist('https://cdn.komu.vn/1cf93b197d401000/clip.mp4')).resolves.toBeUndefined();
		await expect(probeFragmentedMp4Playlist('https://cdn.mezon.ai/1cf93b197d401000/movie.mkv')).resolves.toBeUndefined();
		await expect(probeFragmentedMp4Playlist('https://cdn.mezon.ai/1cf93b197d401000/clip.webm')).resolves.toBeUndefined();
		await expect(probeFragmentedMp4Playlist('blob:https://mezon.ai/0b6f')).resolves.toBeUndefined();
		await expect(probeFragmentedMp4Playlist(undefined)).resolves.toBeUndefined();

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('stops after one fetch for a normal mp4 and after two when the tail is not mfro', async () => {
		const normal = buildRecording(false, false);
		const normalFetch = serveRange(normal.bytes);
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();
		expect(normalFetch).toHaveBeenCalledTimes(1);

		normalFetch.mockRestore();
		const unindexed = buildRecording(false, true);
		const unindexedFetch = serveRange(unindexed.bytes);
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();
		expect(unindexedFetch).toHaveBeenCalledTimes(2);
	});

	it('reads the head and one tail range holding mfro and mfra, and returns the VOD playlist', async () => {
		const { bytes } = buildRecording(true, true);
		const fetchMock = serveRange(bytes);
		const signed = `${VIDEO}?${SIGNATURE}`;

		const playlist = await probeFragmentedMp4Playlist(signed);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const ranges = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('range'));
		expect(ranges).toEqual(['bytes=0-16383', `bytes=${fragmentedMp4InitEnd(bytes)}-${bytes.length - 1}`]);
		expect(playlist).toContain('#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-TARGETDURATION:3\n#EXT-X-PLAYLIST-TYPE:VOD\n');
		expect(playlist).toContain(`#EXT-X-MAP:URI="${signed}"`);
		expect(playlist?.endsWith('#EXT-X-ENDLIST\n')).toBe(true);

		await expect(probeFragmentedMp4Playlist('https://cdn.mezon.ai/1cf93b197d401000/REC.MOV')).resolves.toContain('#EXTM3U\n');
		await expect(probeFragmentedMp4Playlist('https://cdn.mezon.ai/1cf93b197d401000/rec.m4v')).resolves.toContain('#EXTM3U\n');
	});

	it('reads only the last 256 KiB of a large file for the index', async () => {
		const { bytes } = buildRecording(true, true, 300000);
		const fetchMock = serveRange(bytes);

		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toContain('#EXT-X-ENDLIST\n');
		const ranges = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('range'));
		expect(ranges).toEqual(['bytes=0-16383', `bytes=${bytes.length - 262144}-${bytes.length - 1}`]);
	});

	it('fetches the mfra on its own when it is larger than the tail range', async () => {
		const { bytes } = buildRecording(true, true, 300000);
		const claimed = 270000;
		new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(bytes.length - 4, claimed);
		const fetchMock = serveRange(bytes);

		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();
		const ranges = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('range'));
		expect(ranges).toEqual([
			'bytes=0-16383',
			`bytes=${bytes.length - 262144}-${bytes.length - 1}`,
			`bytes=${bytes.length - claimed}-${bytes.length - 1}`
		]);
	});

	it('returns undefined when any response is not 206 or lacks Content-Range', async () => {
		const { bytes } = buildRecording(true, true);
		const fetchMock = jest.spyOn(globalThis, 'fetch');

		fetchMock.mockResolvedValueOnce(new Response(bytes, { status: 200 }));
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();

		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();

		fetchMock.mockResolvedValueOnce(new Response(bytes.subarray(0, 16384), { status: 206 }));
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();

		let call = 0;
		fetchMock.mockImplementation(async () => {
			call += 1;
			if (call === 1) {
				return new Response(bytes.subarray(0, 16384), {
					status: 206,
					headers: { 'Content-Range': `bytes 0-16383/${bytes.length}` }
				});
			}
			return new Response('', { status: 403 });
		});
		await expect(probeFragmentedMp4Playlist(VIDEO)).resolves.toBeUndefined();
	});

	it('returns undefined on abort or timeout and never sends a suffix range', async () => {
		jest.useFakeTimers();
		try {
			const seenRanges: string[] = [];
			jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
				seenRanges.push(new Headers(init?.headers).get('range') ?? '');
				return new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				});
			});

			const controller = new AbortController();
			const aborted = probeFragmentedMp4Playlist(VIDEO, controller.signal);
			controller.abort();
			await expect(aborted).resolves.toBeUndefined();

			const hung = probeFragmentedMp4Playlist(VIDEO);
			jest.advanceTimersByTime(29999);
			await Promise.resolve();
			expect(seenRanges).toHaveLength(2);
			jest.advanceTimersByTime(1);
			await expect(hung).resolves.toBeUndefined();

			for (const range of seenRanges) {
				expect(range).toMatch(/^bytes=\d+-\d+$/);
			}
		} finally {
			jest.useRealTimers();
		}
	});
});
