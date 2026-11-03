import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { uploadFileToPath } from '../minio';
import { FILE_INGEST_CHUNK_SIZE, getFileIngestUrl, isFileIngestCandidate, moovAfterMdat, nextFileIngestChunk, uploadToFileIngest } from './index';

jest.mock('../minio', () => ({ uploadFileToPath: jest.fn() }));

const MiB = 1024 * 1024;
const QUERY =
	'X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=testkey%2F20261031%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261031T120000Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=0123abcd';
const KEY_PATH = '/dev-mezon/0000000000031031/1846031000000002001_clip.mp4';
const PRESIGNED = `https://cdn-api-dev.nccsoft.vn${KEY_PATH}?${QUERY}`;
const INGEST = `https://streaming.nccsoft.vn${KEY_PATH}?${QUERY}`;
const SIGNED_AT = Date.UTC(2026, 9, 31, 12, 0, 0);
const VIDEO = { type: 'video', name: 'clip.mp4', size: 20 * MiB };

type Box = [type: string, length: number, header?: 'large' | 'zero' | number];

function mp4(...boxes: Box[]): Blob {
	return new Blob(
		boxes.map(([type, length, header]) => {
			const bytes = new Uint8Array(length);
			const view = new DataView(bytes.buffer);
			if (header === 'large') {
				view.setUint32(0, 1);
				if (length >= 16) view.setBigUint64(8, BigInt(length));
			} else {
				view.setUint32(0, header === 'zero' ? 0 : (header ?? length));
			}
			for (let i = 0; i < 4; i += 1) bytes[4 + i] = type.charCodeAt(i);
			return bytes;
		})
	);
}

type Range = [number, number];
type Step = Response | 'drop';
type Request = { method: string; url: string; range?: string; at: number; init?: RequestInit };

const status = (size: number, received: Range[], stored = false) =>
	new Response(JSON.stringify({ size, received, stored, hls: 'playable' }), { status: 200 });
const answer = (code: number) => new Response(JSON.stringify({ error: 'test' }), { status: code });

let fetchMock: jest.SpiedFunction<typeof fetch>;

function serve(...steps: Step[]): Request[] {
	const log: Request[] = [];
	fetchMock.mockImplementation(async (input, init) => {
		log.push({
			method: init?.method ?? 'GET',
			url: String(input),
			range: (init?.headers as Record<string, string> | undefined)?.['Content-Range'],
			at: Date.now(),
			init
		});
		const step = steps.shift();
		if (!step) throw new Error(`unexpected request ${init?.method ?? 'GET'} ${String(input)}`);
		if (step === 'drop') throw new TypeError('Failed to fetch');
		return step;
	});
	return log;
}

async function run<T>(promise: Promise<T>): Promise<T> {
	const settled = promise.then(
		(value) => ({ value }),
		(error: unknown) => ({ error })
	);
	await jest.runAllTimersAsync();
	const result = (await settled) as { value?: T; error?: unknown };
	if ('error' in result) throw result.error;
	return result.value as T;
}

const ranges = (log: Request[]) => log.map(({ method, range }) => (method === 'PUT' ? range : method));

beforeEach(() => {
	process.env.NX_CHAT_APP_FILE_INGEST = 'cdn-api-dev.nccsoft.vn=https://streaming.nccsoft.vn';
	jest.useFakeTimers({ now: SIGNED_AT + 60_000 });
	fetchMock = jest.spyOn(globalThis, 'fetch');
	jest.mocked(uploadFileToPath).mockReset();
});

afterEach(() => {
	delete process.env.NX_CHAT_APP_FILE_INGEST;
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('which uploads go through the ingest', () => {
	it('is off while the environment lists no ingest host', () => {
		for (const config of [
			undefined,
			'',
			' , ',
			'cdn-api-dev.nccsoft.vn',
			'=https://streaming.nccsoft.vn',
			'cdn-api-dev.nccsoft.vn=streaming.nccsoft.vn'
		]) {
			if (config === undefined) delete process.env.NX_CHAT_APP_FILE_INGEST;
			else process.env.NX_CHAT_APP_FILE_INGEST = config;
			expect(isFileIngestCandidate(VIDEO)).toBe(false);
			expect(getFileIngestUrl(PRESIGNED, VIDEO)).toBeUndefined();
		}
	});

	it('takes videos by type or extension, from 1 byte to 1 GiB', () => {
		for (const file of [
			{ type: 'video', name: 'clip.mp4', size: 1 },
			{ type: 'video/quicktime', name: 'IMG_0001.MOV', size: 1024 * MiB },
			{ type: 'doc', name: 'IMG_0001.MOV', size: 5 },
			{ type: '', name: 'movie.mkv', size: 5 }
		]) {
			expect(isFileIngestCandidate(file)).toBe(true);
		}
		for (const file of [
			{ type: 'video', name: 'clip.mp4', size: 0 },
			{ type: 'video', name: 'clip.mp4', size: 1024 * MiB + 1 },
			{ type: 'image', name: 'photo.png', size: 5 },
			{ type: 'doc', name: 'notes.pdf', size: 5 },
			{ type: 'doc', name: 'mp4', size: 5 },
			{ type: 'audio', name: 'song.mp3', size: 5 }
		]) {
			expect(isFileIngestCandidate(file)).toBe(false);
		}
	});

	it('swaps only the scheme and host of a presigned URL on a listed host, keeping its path and query byte for byte', () => {
		process.env.NX_CHAT_APP_FILE_INGEST = ' other.example=https://ingest.example/ , CDN-API-DEV.nccsoft.vn = https://streaming.nccsoft.vn/ ';
		expect(getFileIngestUrl(PRESIGNED, VIDEO)).toBe(INGEST);
		const odd = 'https://cdn-api-dev.nccsoft.vn/dev-mezon/0000000000031031/1_a%20b%2Bc.mp4?X-Amz-Date=20261031T120000Z&x=%2F%3D';
		expect(getFileIngestUrl(odd, VIDEO)).toBe(
			'https://streaming.nccsoft.vn/dev-mezon/0000000000031031/1_a%20b%2Bc.mp4?X-Amz-Date=20261031T120000Z&x=%2F%3D'
		);
		expect(getFileIngestUrl('https://other.example/b/k.mp4?q=1', VIDEO)).toBe('https://ingest.example/b/k.mp4?q=1');
	});

	it('keeps the direct PUT for other hosts, such as R2', () => {
		expect(getFileIngestUrl(`https://bucket.r2.cloudflarestorage.com${KEY_PATH}?${QUERY}`, VIDEO)).toBeUndefined();
		expect(getFileIngestUrl(`https://cdn-api-dev.nccsoft.vn.evil.example${KEY_PATH}`, VIDEO)).toBeUndefined();
		expect(getFileIngestUrl('https://cdn-api-dev.nccsoft.vn', VIDEO)).toBeUndefined();
		expect(getFileIngestUrl(undefined, VIDEO)).toBeUndefined();
		expect(getFileIngestUrl(PRESIGNED, { type: 'image', name: 'photo.png', size: 5 })).toBeUndefined();
	});
});

describe('moovAfterMdat', () => {
	it('finds moov after mdat, as phones record', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['wide', 8], ['mdat', 1000], ['moov', 100]))).resolves.toBe(1032);
	});

	it('is -1 when moov comes first', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['moov', 100], ['mdat', 1000]))).resolves.toBe(-1);
	});

	it('reads a 64-bit size', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 1000, 'large'], ['moov', 100]))).resolves.toBe(1024);
	});

	it('reads size 0 as a box that runs to the end of the file', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 1000], ['moov', 100, 'zero']))).resolves.toBe(1024);
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 1000, 'zero'], ['moov', 100]))).resolves.toBe(-1);
	});

	it('gives up on a box smaller than its header', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 1000, 4], ['moov', 100]))).resolves.toBe(-1);
		const tinyLarge = new Uint8Array(await mp4(['free', 16, 'large']).arrayBuffer());
		new DataView(tinyLarge.buffer).setBigUint64(8, BigInt(4));
		await expect(moovAfterMdat(new Blob([mp4(['mdat', 100]), tinyLarge, mp4(['moov', 100])]))).resolves.toBe(-1);
	});

	it('is -1 for a truncated file, whatever its last header', async () => {
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 8, 1000]))).resolves.toBe(-1);
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 8, 'large']))).resolves.toBe(-1);
		await expect(moovAfterMdat(mp4(['ftyp', 24], ['mdat', 100], ['moov', 4, 8]))).resolves.toBe(-1);
		await expect(moovAfterMdat(new Blob([new Uint8Array(7)]))).resolves.toBe(-1);
	});

	it('is -1 for other containers', async () => {
		await expect(moovAfterMdat(new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 1, 2, 3, 4])]))).resolves.toBe(-1);
		await expect(moovAfterMdat(new Blob(['RIFF....AVI LIST'.repeat(4)]))).resolves.toBe(-1);
	});
});

describe('the chunk order', () => {
	it('starts at byte 0 and goes up in 8 MiB chunks', () => {
		const size = 20 * MiB;
		expect(nextFileIngestChunk(size, [], -1)).toEqual([0, 8 * MiB - 1]);
		expect(nextFileIngestChunk(size, [[0, 8 * MiB - 1]], -1)).toEqual([8 * MiB, 16 * MiB - 1]);
		expect(nextFileIngestChunk(size, [[0, 16 * MiB - 1]], -1)).toEqual([16 * MiB, size - 1]);
		expect(nextFileIngestChunk(size, [[0, size - 1]], -1)).toBeUndefined();
	});

	it('sends the tail from moov first, then from byte 0 up to moov', () => {
		const size = 20 * MiB;
		const moov = 15 * MiB;
		expect(nextFileIngestChunk(size, [], moov)).toEqual([moov, size - 1]);
		expect(nextFileIngestChunk(size, [[moov, size - 1]], moov)).toEqual([0, 8 * MiB - 1]);
		expect(
			nextFileIngestChunk(
				size,
				[
					[0, 8 * MiB - 1],
					[moov, size - 1]
				],
				moov
			)
		).toEqual([8 * MiB, moov - 1]);
		expect(nextFileIngestChunk(size, [[0, size - 1]], moov)).toBeUndefined();
	});

	it('sends only what the ingest misses, in the same order', () => {
		const size = 20 * MiB;
		const received: Range[] = [
			[0, 3 * MiB - 1],
			[5 * MiB, 6 * MiB - 1],
			[18 * MiB, 19 * MiB - 1]
		];
		expect(nextFileIngestChunk(size, received, -1)).toEqual([3 * MiB, 5 * MiB - 1]);
		expect(nextFileIngestChunk(size, received, 17 * MiB)).toEqual([17 * MiB, 18 * MiB - 1]);
		const afterTail: Range[] = [
			[0, 3 * MiB - 1],
			[5 * MiB, 6 * MiB - 1],
			[17 * MiB, 19 * MiB - 1]
		];
		expect(nextFileIngestChunk(size, afterTail, 17 * MiB)).toEqual([19 * MiB, size - 1]);
		expect(nextFileIngestChunk(size, [...afterTail.slice(0, 2), [17 * MiB, size - 1]], 17 * MiB)).toEqual([3 * MiB, 5 * MiB - 1]);
	});
});

describe('uploadToFileIngest', () => {
	const flat = (size: number) => new Blob([new Uint8Array(size)]);

	it('PUTs one chunk at a time to the ingest URL, the tail from moov first, without credentials', async () => {
		const file = mp4(['ftyp', 24], ['mdat', 12 * MiB], ['moov', MiB]);
		const size = file.size;
		const moov = 24 + 12 * MiB;
		const log = serve(
			status(size, [[moov, size - 1]]),
			status(size, [
				[0, 8 * MiB - 1],
				[moov, size - 1]
			]),
			status(size, [[0, size - 1]], true)
		);

		await run(uploadToFileIngest(file, PRESIGNED, INGEST));

		expect(ranges(log)).toEqual([`bytes ${moov}-${size - 1}/${size}`, `bytes 0-${8 * MiB - 1}/${size}`, `bytes ${8 * MiB}-${moov - 1}/${size}`]);
		for (const { url, init } of log) {
			expect(url).toBe(INGEST);
			expect(init?.credentials).toBe('omit');
			expect(Object.keys(init?.headers ?? {})).toEqual(['Content-Range']);
			expect((init?.body as Blob).type).toBe('');
		}
		expect((log[0].init?.body as Blob).size).toBe(MiB);
		expect((log[1].init?.body as Blob).size).toBe(FILE_INGEST_CHUNK_SIZE);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('starts at byte 0 for a file whose moov does not follow mdat', async () => {
		const file = mp4(['ftyp', 24], ['moov', MiB], ['mdat', 9 * MiB]);
		const size = file.size;
		const log = serve(status(size, [[0, 8 * MiB - 1]]), status(size, [[0, size - 1]], true));

		await run(uploadToFileIngest(file, PRESIGNED, INGEST));

		expect(ranges(log)).toEqual([`bytes 0-${8 * MiB - 1}/${size}`, `bytes ${8 * MiB}-${size - 1}/${size}`]);
	});

	it('polls the status every 2 s until the original is stored, reporting the share held, then 1 while it finishes', async () => {
		const size = 10 * MiB;
		const progress: number[] = [];
		const log = serve(
			status(size, [[0, 8 * MiB - 1]]),
			status(size, [[0, size - 1]]),
			status(size, [[0, size - 1]]),
			status(size, [[0, size - 1]]),
			status(size, [[0, size - 1]], true)
		);

		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST, (fraction) => progress.push(fraction)));

		expect(ranges(log)).toEqual([`bytes 0-${8 * MiB - 1}/${size}`, `bytes ${8 * MiB}-${size - 1}/${size}`, 'GET', 'GET', 'GET']);
		expect(log[3].at - log[2].at).toBe(2000);
		expect(log[4].at - log[3].at).toBe(2000);
		expect(log[2].init?.credentials).toBe('omit');
		expect(log[2].init?.body).toBeUndefined();
		expect(progress).toEqual([0.8, 1, 1, 1, 1]);
	});

	it('reports the file sent once the ingest holds every byte, before the original is stored', async () => {
		const size = 10 * MiB;
		const events: string[] = [];
		const log = serve(status(size, [[0, 8 * MiB - 1]]), status(size, [[0, size - 1]]), status(size, [[0, size - 1]], true));

		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST, undefined, () => events.push(`sent after ${log.length} requests`)));

		expect(ranges(log)).toEqual([`bytes 0-${8 * MiB - 1}/${size}`, `bytes ${8 * MiB}-${size - 1}/${size}`, 'GET']);
		expect(events[0]).toBe('sent after 2 requests');
	});

	it('resolves at once when the last chunk already finds the original stored', async () => {
		const size = MiB;
		const log = serve(status(size, [[0, size - 1]], true));
		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST));
		expect(ranges(log)).toEqual([`bytes 0-${size - 1}/${size}`]);
	});

	it.each([503, 413])('PUTs the whole file straight to the presigned URL when the first chunk gets %i', async (code) => {
		const file = flat(20 * MiB);
		jest.mocked(uploadFileToPath).mockResolvedValue(new Response(null, { status: 200 }));
		const log = serve(answer(code));

		await run(uploadToFileIngest(file, PRESIGNED, INGEST));

		expect(log).toHaveLength(1);
		expect(uploadFileToPath).toHaveBeenCalledWith(PRESIGNED, file, file.size);
	});

	it('fails when the direct PUT after a full ingest fails too', async () => {
		jest.mocked(uploadFileToPath).mockResolvedValue(false);
		serve(answer(503));
		await expect(run(uploadToFileIngest(flat(MiB), PRESIGNED, INGEST))).rejects.toThrow('direct upload failed');
	});

	it('uses the direct PUT on 403, since a new presigned URL would name another key', async () => {
		const file = flat(MiB);
		jest.mocked(uploadFileToPath).mockResolvedValue(new Response(null, { status: 200 }));
		serve(answer(403));
		await run(uploadToFileIngest(file, PRESIGNED, INGEST));
		expect(uploadFileToPath).toHaveBeenCalledWith(PRESIGNED, file, file.size);
	});

	it('reports a 409 as a failure', async () => {
		const size = 20 * MiB;
		const log = serve(status(size, [[0, 8 * MiB - 1]]), answer(409));
		await expect(run(uploadToFileIngest(flat(size), PRESIGNED, INGEST))).rejects.toThrow('409');
		expect(log).toHaveLength(2);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it.each([400, 405, 411, 413, 417, 431])('reports a %i on a started upload as a failure', async (code) => {
		const size = 20 * MiB;
		serve(status(size, [[0, 8 * MiB - 1]]), answer(code));
		await expect(run(uploadToFileIngest(flat(size), PRESIGNED, INGEST))).rejects.toThrow(String(code));
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it.each<[string, Step]>([
		['500', answer(500)],
		['503 on a started upload', answer(503)],
		['408', answer(408)],
		['a dropped connection', 'drop']
	])('waits after %s, then sends only what the status says is missing', async (_name, failure) => {
		const size = 20 * MiB;
		const log = serve(status(size, [[0, 8 * MiB - 1]]), failure, status(size, [[0, 12 * MiB - 1]]), status(size, [[0, size - 1]], true));

		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST));

		expect(ranges(log)).toEqual([
			`bytes 0-${8 * MiB - 1}/${size}`,
			`bytes ${8 * MiB}-${16 * MiB - 1}/${size}`,
			'GET',
			`bytes ${12 * MiB}-${size - 1}/${size}`
		]);
		expect(log[2].at - log[1].at).toBe(1000);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('backs off longer after each failure and gives up after ten', async () => {
		const size = MiB;
		const log = serve('drop', ...Array.from({ length: 10 }, (): Step => answer(503)));
		await expect(run(uploadToFileIngest(flat(size), PRESIGNED, INGEST))).rejects.toThrow('unreachable');
		const waits = log.slice(1).map((request, index) => request.at - log[index].at);
		expect(waits).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000]);
	});

	it('starts again from byte 0 when the ingest lost a started upload and the URL is still valid', async () => {
		const file = mp4(['ftyp', 24], ['mdat', 12 * MiB], ['moov', MiB]);
		const size = file.size;
		const moov = 24 + 12 * MiB;
		const log = serve(
			status(size, [[moov, size - 1]]),
			'drop',
			answer(404),
			status(size, [[moov, size - 1]]),
			status(size, [
				[0, 8 * MiB - 1],
				[moov, size - 1]
			]),
			status(size, [[0, size - 1]], true)
		);

		await run(uploadToFileIngest(file, PRESIGNED, INGEST));

		expect(ranges(log)).toEqual([
			`bytes ${moov}-${size - 1}/${size}`,
			`bytes 0-${8 * MiB - 1}/${size}`,
			'GET',
			`bytes ${moov}-${size - 1}/${size}`,
			`bytes 0-${8 * MiB - 1}/${size}`,
			`bytes ${8 * MiB}-${moov - 1}/${size}`
		]);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('takes a 503 on the first chunk of the restarted upload as a new upload', async () => {
		const size = 20 * MiB;
		jest.mocked(uploadFileToPath).mockResolvedValue(new Response(null, { status: 200 }));
		const log = serve(status(size, [[0, 8 * MiB - 1]]), answer(500), answer(404), answer(503));
		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST));
		expect(ranges(log)).toEqual([
			`bytes 0-${8 * MiB - 1}/${size}`,
			`bytes ${8 * MiB}-${16 * MiB - 1}/${size}`,
			'GET',
			`bytes 0-${8 * MiB - 1}/${size}`
		]);
		expect(uploadFileToPath).toHaveBeenCalledTimes(1);
	});

	it('reports the failure when the ingest lost the upload after its URL expired', async () => {
		const size = 20 * MiB;
		const log = serve(status(size, [[0, 8 * MiB - 1]]), 'drop', answer(404));
		const upload = uploadToFileIngest(flat(size), PRESIGNED, INGEST);
		jest.setSystemTime(SIGNED_AT + 900_000);
		await expect(run(upload)).rejects.toThrow('expired');
		expect(log).toHaveLength(3);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('uploads again when the ingest loses the file while storing it', async () => {
		const size = MiB;
		const log = serve(status(size, [[0, size - 1]]), answer(404), status(size, [[0, size - 1]], true));
		await run(uploadToFileIngest(flat(size), PRESIGNED, INGEST));
		expect(ranges(log)).toEqual([`bytes 0-${size - 1}/${size}`, 'GET', `bytes 0-${size - 1}/${size}`]);
	});
});
