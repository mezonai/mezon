import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { FragmentedMp4Indexer, finalizedMp4Blob } from './fragmentedMp4';
import { fetchDownloadBlob, finishedHlsParts, hasFinishedHlsCopy } from './hlsDownload';

const VIDEO = 'https://cdn.mezon.ai/1cf93b197d401000/2080000000000000001_clip.mp4';
const BASE = 'https://cdn.mezon.ai/hls/1cf93b197d401000/2080000000000000001_clip.mp4';
const PLAYLIST = `${BASE}/index.m3u8`;
const FINISHED_PLAYLIST = [
	'#EXTM3U',
	'#EXT-X-VERSION:7',
	'#EXT-X-TARGETDURATION:4',
	'#EXT-X-MEDIA-SEQUENCE:0',
	'#EXT-X-PLAYLIST-TYPE:EVENT',
	'#EXT-X-MAP:URI="init.mp4"',
	'',
	'#EXTINF:4.000,',
	'seg00000.m4s',
	'#EXTINF:3.000,',
	'seg00001.m4s',
	'#EXT-X-ENDLIST',
	''
].join('\n');

function concat(...parts: Uint8Array[]): Uint8Array {
	let total = 0;
	for (const part of parts) total += part.length;
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

function u32(value: number): Uint8Array {
	const out = new Uint8Array(4);
	new DataView(out.buffer).setUint32(0, value, false);
	return out;
}

function ascii(text: string): Uint8Array {
	const out = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i += 1) {
		out[i] = text.charCodeAt(i);
	}
	return out;
}

function box(type: string, ...payloads: Uint8Array[]): Uint8Array {
	const body = concat(...payloads);
	return concat(u32(8 + body.length), ascii(type), body);
}

function fullBox(type: string, version: number, flags: number, ...payloads: Uint8Array[]): Uint8Array {
	const vf = ((version & 0xff) << 24) | (flags & 0xffffff);
	return box(type, u32(vf >>> 0), ...payloads);
}

function buildSyntheticHlsFmp4() {
	const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'), ascii('iso6'), ascii('mp41'));
	const mvhd = fullBox('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(0), new Uint8Array(80));
	const tkhd = fullBox('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(0), new Uint8Array(60));
	const mdhd = fullBox('mdhd', 0, 0, u32(0), u32(0), u32(1000), u32(0), u32(0));
	const trak = box('trak', tkhd, box('mdia', mdhd, box('minf', box('stbl'))));
	const trex = fullBox('trex', 0, 0, u32(1), u32(1), u32(1000), u32(0), u32(0));
	const moov = box('moov', mvhd, trak, box('mvex', trex));
	const init = concat(ftyp, moov);

	const buildSegment = (seq: number, baseTime: number, sampleCount: number) => {
		const tfhd = fullBox('tfhd', 0, 0x020000, u32(1));
		const tfdt = fullBox('tfdt', 0, 0, u32(baseTime));
		const trun = fullBox('trun', 0, 0, u32(sampleCount));
		const moof = box('moof', fullBox('mfhd', 0, 0, u32(seq)), box('traf', tfhd, tfdt, trun));
		const mdat = box('mdat', new Uint8Array([seq, 1, 2, 3]));
		return concat(moof, mdat);
	};

	const seg0 = buildSegment(1, 0, 4);
	const seg1 = buildSegment(2, 4000, 3);
	return { ftyp, init, seg0, seg1 };
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe('finishedHlsParts', () => {
	it('resolves init and segment URLs against a playlist URL with a probe query', () => {
		expect(finishedHlsParts(`${PLAYLIST}?probe=597666666`, FINISHED_PLAYLIST)).toEqual([
			`${BASE}/init.mp4`,
			`${BASE}/seg00000.m4s`,
			`${BASE}/seg00001.m4s`
		]);
	});

	it('returns undefined without ENDLIST, with STREAM-INF, without MAP, with two MAPs, or without segments', () => {
		const unfinished = FINISHED_PLAYLIST.replace('#EXT-X-ENDLIST\n', '');
		expect(finishedHlsParts(PLAYLIST, unfinished)).toBeUndefined();

		const withVariant = `#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nseg00000.m4s\n#EXT-X-ENDLIST\n`;
		expect(finishedHlsParts(PLAYLIST, withVariant)).toBeUndefined();

		const withoutMap = `#EXTM3U\n#EXTINF:4.000,\nseg00000.m4s\n#EXT-X-ENDLIST\n`;
		expect(finishedHlsParts(PLAYLIST, withoutMap)).toBeUndefined();

		const twoMaps = `#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-MAP:URI="init2.mp4"\n#EXTINF:4.000,\nseg00000.m4s\n#EXT-X-ENDLIST\n`;
		expect(finishedHlsParts(PLAYLIST, twoMaps)).toBeUndefined();

		const noSegments = `#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-ENDLIST\n`;
		expect(finishedHlsParts(PLAYLIST, noSegments)).toBeUndefined();
	});

	it('preserves absolute segment URIs', () => {
		const playlistWithAbsolute = `#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:4.000,\nhttps://other.cdn.example/seg00000.m4s\n#EXT-X-ENDLIST\n`;
		expect(finishedHlsParts(PLAYLIST, playlistWithAbsolute)).toEqual([`${BASE}/init.mp4`, 'https://other.cdn.example/seg00000.m4s']);
	});
});

describe('fetchDownloadBlob', () => {
	it('returns the response blob directly on 200 without requesting HLS', async () => {
		const payload = new Uint8Array([1, 2, 3, 4]);
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(payload, { status: 200 }));

		const blob = await fetchDownloadBlob(VIDEO);
		expect(blob).toBeDefined();
		expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(payload);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0][0])).toBe(VIDEO);
	});

	it('reassembles and finalizes init and segments from HLS on 404', async () => {
		const { ftyp, init, seg0, seg1 } = buildSyntheticHlsFmp4();
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
			const url = String(input);
			if (url === VIDEO) {
				return new Response('Not Found', { status: 404 });
			}
			if (url.startsWith(`${PLAYLIST}?probe=`)) {
				return new Response(FINISHED_PLAYLIST, { status: 200 });
			}
			if (url === `${BASE}/init.mp4`) {
				return new Response(init, { status: 200 });
			}
			if (url === `${BASE}/seg00000.m4s`) {
				return new Response(seg0, { status: 200 });
			}
			if (url === `${BASE}/seg00001.m4s`) {
				return new Response(seg1, { status: 200 });
			}
			return new Response('Unexpected', { status: 404 });
		});

		const blob = await fetchDownloadBlob(VIDEO);
		expect(blob).toBeDefined();
		expect(fetchMock).toHaveBeenCalledTimes(5);

		const outBytes = new Uint8Array(await blob!.arrayBuffer());
		const indexer = new FragmentedMp4Indexer();
		const combined = concat(init, seg0, seg1);
		indexer.push(combined);
		const expectedBlob = finalizedMp4Blob(new Blob([combined], { type: 'video/mp4' }), indexer.finish()!, 'video/mp4');
		const expectedBytes = new Uint8Array(await expectedBlob.arrayBuffer());
		expect(Array.from(outBytes)).toEqual(Array.from(expectedBytes));

		const view = new DataView(outBytes.buffer, outBytes.byteOffset, outBytes.byteLength);
		const mvhdDurationOffset = ftyp.length + 8 + 8 + 16;
		expect(view.getUint32(mvhdDurationOffset, false)).toBe(7000);

		const mfroFourCC = String.fromCharCode(
			outBytes[outBytes.length - 12],
			outBytes[outBytes.length - 11],
			outBytes[outBytes.length - 10],
			outBytes[outBytes.length - 9]
		);
		expect(mfroFourCC).toBe('mfro');
	});

	it('returns undefined when original is 404 and playlist is 404', async () => {
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not Found', { status: 404 }));

		await expect(fetchDownloadBlob(VIDEO)).resolves.toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns undefined on 500 without requesting HLS', async () => {
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Server Error', { status: 500 }));

		await expect(fetchDownloadBlob(VIDEO)).resolves.toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('returns undefined when a segment responds with 404', async () => {
		const { init, seg0 } = buildSyntheticHlsFmp4();
		jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
			const url = String(input);
			if (url === VIDEO) {
				return new Response('Not Found', { status: 404 });
			}
			if (url.startsWith(`${PLAYLIST}?probe=`)) {
				return new Response(FINISHED_PLAYLIST, { status: 200 });
			}
			if (url === `${BASE}/init.mp4`) {
				return new Response(init, { status: 200 });
			}
			if (url === `${BASE}/seg00000.m4s`) {
				return new Response(seg0, { status: 200 });
			}
			return new Response('Not Found', { status: 404 });
		});

		await expect(fetchDownloadBlob(VIDEO)).resolves.toBeUndefined();
	});

	it('checks whether a finished HLS playlist exists via hasFinishedHlsCopy', async () => {
		const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(FINISHED_PLAYLIST, { status: 200 }));
		await expect(hasFinishedHlsCopy(VIDEO)).resolves.toBe(true);

		fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));
		await expect(hasFinishedHlsCopy(VIDEO)).resolves.toBe(false);
	});
});
