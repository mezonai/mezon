import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiSession, Client } from 'mezon-js';
import { handleUploadFile, uploadFileToPath, type CustomFile } from './index';

const MiB = 1024 * 1024;
const session = {} as ApiSession;
const fetchMock = jest.spyOn(globalThis, 'fetch');

function makeFile(size: number, name: string, type: string) {
	return new File([new Uint8Array(size)], name, { type }) as CustomFile;
}

function makeClient() {
	return {
		uploadAttachmentFile: jest.fn(async () => ({ filename: 'stored', url: 'https://storage.example/stored', type_cdn: 1 })),
		multipartUploadAttachmentFile: jest.fn(async (_session: ApiSession, request: { part_count: number }) => ({
			upload_id: 'upload',
			urls: Array.from({ length: request.part_count }, (_, index) => `https://storage.example/part/${index + 1}`)
		})),
		multipartUploadAttachmentFileFinish: jest.fn(async () => ({}))
	};
}

function upload(client: ReturnType<typeof makeClient>, filename: string, file: CustomFile) {
	return handleUploadFile(client as unknown as Client, session, filename, file, 0, '123');
}

beforeEach(() => {
	fetchMock.mockReset();
	fetchMock.mockImplementation(async () => new Response(null, { status: 200, headers: { ETag: '"etag"' } }));
});

describe('handleUploadFile', () => {
	it.each([50 * MiB + 1, 60 * MiB])('sends a video of %i bytes in one PUT without starting a multipart upload', async (size) => {
		const client = makeClient();

		const result = await upload(client, 'clip.mp4', makeFile(size, 'clip.mp4', 'video/mp4'));

		expect(client.multipartUploadAttachmentFile).not.toHaveBeenCalled();
		expect(client.uploadAttachmentFile).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect((fetchMock.mock.calls[0][1]?.body as Blob).size).toBe(size);
		expect(result.size).toBe(size);
	});

	it('fails when the PUT of a large video is refused', async () => {
		fetchMock.mockImplementation(async () => new Response(null, { status: 403 }));
		const client = makeClient();

		await expect(upload(client, 'clip.mp4', makeFile(60 * MiB, 'clip.mp4', 'video/mp4'))).rejects.toThrow('Failed to upload file to MinIO.');
		expect(client.multipartUploadAttachmentFile).not.toHaveBeenCalled();
	});

	it('still uses a multipart upload for a large file that is not a video', async () => {
		const client = makeClient();

		await upload(client, 'archive.zip', makeFile(60 * MiB, 'archive.zip', 'application/zip'));

		expect(client.multipartUploadAttachmentFile).toHaveBeenCalledTimes(1);
		expect(client.multipartUploadAttachmentFileFinish).toHaveBeenCalledTimes(1);
		expect(client.uploadAttachmentFile).not.toHaveBeenCalled();
	});
});

class FakeXMLHttpRequest {
	static instances: FakeXMLHttpRequest[] = [];
	static onSend?: (xhr: FakeXMLHttpRequest) => void;

	method = '';
	url = '';
	body: unknown;
	status = 0;
	upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onabort: (() => void) | null = null;
	ontimeout: (() => void) | null = null;

	open(method: string, url: string) {
		this.method = method;
		this.url = url;
	}

	send(body: unknown) {
		this.body = body;
		FakeXMLHttpRequest.instances.push(this);
		FakeXMLHttpRequest.onSend?.(this);
	}

	emitProgress(loaded: number, total: number, lengthComputable = true) {
		this.upload.onprogress?.({ loaded, total, lengthComputable } as ProgressEvent);
	}

	finish(status: number) {
		this.status = status;
		this.onload?.();
	}

	fail(kind: 'error' | 'abort' | 'timeout') {
		if (kind === 'error') this.onerror?.();
		else if (kind === 'abort') this.onabort?.();
		else this.ontimeout?.();
	}
}

describe('uploadFileToPath', () => {
	let originalXHR: typeof XMLHttpRequest | undefined;
	let errorSpy: jest.SpiedFunction<typeof console.error>;

	beforeEach(() => {
		originalXHR = globalThis.XMLHttpRequest;
		globalThis.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
		FakeXMLHttpRequest.instances = [];
		FakeXMLHttpRequest.onSend = undefined;
		errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		if (originalXHR === undefined) {
			delete (globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest;
		} else {
			globalThis.XMLHttpRequest = originalXHR;
		}
		errorSpy.mockRestore();
	});

	it('throttles progress to whole-percent changes and emits 1 on a 200 load without using fetch', async () => {
		const progress: number[] = [];
		const file = makeFile(1000, 'clip.mp4', 'video/mp4');
		FakeXMLHttpRequest.onSend = (xhr) => {
			xhr.emitProgress(100, 1000, false);
			xhr.emitProgress(10, 1000);
			xhr.emitProgress(15, 1000);
			xhr.emitProgress(19, 1000);
			xhr.emitProgress(20, 1000);
			xhr.emitProgress(500, 1000);
			xhr.finish(200);
		};

		const result = await uploadFileToPath('https://storage.example/clip.mp4', file, file.size, (fraction) => progress.push(fraction));

		expect(fetchMock).not.toHaveBeenCalled();
		expect(FakeXMLHttpRequest.instances).toHaveLength(1);
		const [xhr] = FakeXMLHttpRequest.instances;
		expect(xhr.method).toBe('PUT');
		expect(xhr.url).toBe('https://storage.example/clip.mp4');
		expect((xhr.body as Blob).type).toBe('');
		expect((xhr.body as Blob).size).toBe(1000);
		expect(progress).toEqual([0.01, 0.02, 0.5, 1]);
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(200);
	});

	it('does not duplicate 1 on a 200 load when progress already reached 100%', async () => {
		const progress: number[] = [];
		const file = makeFile(1000, 'clip.mp4', 'video/mp4');
		FakeXMLHttpRequest.onSend = (xhr) => {
			xhr.emitProgress(500, 1000);
			xhr.emitProgress(1000, 1000);
			xhr.finish(200);
		};

		const result = await uploadFileToPath('https://storage.example/clip.mp4', file, file.size, (fraction) => progress.push(fraction));

		expect(progress).toEqual([0.5, 1]);
		expect((result as Response).status).toBe(200);
	});

	it('returns false on a 403 load without emitting 1', async () => {
		const progress: number[] = [];
		const file = makeFile(1000, 'clip.mp4', 'video/mp4');
		FakeXMLHttpRequest.onSend = (xhr) => {
			xhr.emitProgress(500, 1000);
			xhr.finish(403);
		};

		const result = await uploadFileToPath('https://storage.example/clip.mp4', file, file.size, (fraction) => progress.push(fraction));

		expect(progress).toEqual([0.5]);
		expect(result).toBe(false);
	});

	it.each(['error', 'abort', 'timeout'] as const)('returns false on %s', async (kind) => {
		const file = makeFile(1000, 'clip.mp4', 'video/mp4');
		FakeXMLHttpRequest.onSend = (xhr) => {
			xhr.fail(kind);
		};

		const result = await uploadFileToPath('https://storage.example/clip.mp4', file, file.size, () => undefined);

		expect(result).toBe(false);
	});

	it('keeps the fetch path when no progress callback is provided', async () => {
		const file = makeFile(1000, 'clip.mp4', 'video/mp4');

		const result = await uploadFileToPath('https://storage.example/clip.mp4', file, file.size);

		expect(FakeXMLHttpRequest.instances).toHaveLength(0);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(200);
	});
});
