import { isMediaTypeNotSupported } from './file';
import { getHlsMasterPlaylistUrl, isTranscodedVideoContainer, mayBeTranscodedVideo, probeHlsMasterPlaylist, wantsHlsTranscode } from './videoSource';

jest.mock('../constant', () => ({ MAX_FILE_ATTACHMENTS: 10 }));
jest.mock('../helper/videoPoster', () => ({ captureVideoPosterFromUrl: jest.fn() }));

const VIDEO = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000001_clip.mp4';
const PLAYLIST = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4/master.m3u8';
const SIGNATURE = '1791900000-c2lnbmF0dXJl';
const MASTER = '#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-STREAM-INF:BANDWIDTH=3137344,RESOLUTION=1280x720\nstream_0/playlist.m3u8\n';

function respond(status: number, body: string) {
	return new Response(body, { status });
}

afterEach(() => {
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
