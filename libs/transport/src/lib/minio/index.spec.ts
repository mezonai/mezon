import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiSession, Client } from 'mezon-js';
import { handleUploadFile, type CustomFile } from './index';

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
