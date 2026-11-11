import { expect, it, jest } from '@jest/globals';
import type { ApiSession, Client } from 'mezon-js';
import { handleUploadFile, type CustomFile } from './index';

const MiB = 1024 * 1024;

it('sends parts of one size for a 60 MiB file that is not a video', async () => {
	const partBytes: number[] = [];
	jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
		partBytes.push((init?.body as Blob).size / MiB);
		return new Response(null, { status: 200, headers: { ETag: '"etag"' } });
	});
	const client = {
		multipartUploadAttachmentFile: jest.fn(async (_session: ApiSession, request: { part_count: number }) => ({
			upload_id: 'upload',
			urls: Array.from({ length: request.part_count }, (_, index) => `https://storage.example/part/${index + 1}`)
		})),
		multipartUploadAttachmentFileFinish: jest.fn(async () => ({}))
	};
	const file = new File([new Uint8Array(60 * MiB)], 'archive.zip', { type: 'application/zip' }) as CustomFile;

	await handleUploadFile(client as unknown as Client, {} as ApiSession, 'archive.zip', file, 0, '123');

	expect(partBytes).toEqual([10, 10, 10, 10, 10, 10]);
});
