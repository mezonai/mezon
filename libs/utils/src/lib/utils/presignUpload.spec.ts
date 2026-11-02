import { uploadFileToPath, uploadToFileIngest } from '@mezon/transport';
import type { ApiSession, Client } from 'mezon-js';
import { generatePathAttachments, getPresignIngestKeys, putAttachmentFile } from './presignUpload';

jest.mock(
	'@mezon/transport',
	() => ({
		...jest.requireActual('../../../../transport/src/lib/ingest'),
		uploadFileToPath: jest.fn(async () => new Response(null, { status: 200 })),
		uploadToFileIngest: jest.fn(async () => undefined)
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ NotificationType: {} }));

const MiB = 1024 * 1024;
const QUERY = 'X-Amz-Date=20261031T120000Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=0123abcd';
const presigned = (name: string, host = 'cdn-api-dev.nccsoft.vn') => `https://${host}/dev-mezon/0000000000031031/${name}?${QUERY}`;
const prepared = (filename: string, filetype: string, size: number, ingest = false) => {
	const uploadName = `0000000000031031/1846031000000002001_${filename}`;
	return {
		filename,
		filetype,
		size,
		url: `https://cdn-dev.nccsoft.vn/${uploadName}`,
		uploadName,
		uploadPath: presigned(filename),
		ingestUrl: ingest ? `https://streaming.nccsoft.vn/dev-mezon/0000000000031031/${filename}?${QUERY}` : undefined
	};
};

const prepare = async (attachments: { filename: string; filetype: string; size: number }[], ingest?: boolean, host?: string) => {
	const client = {
		uploadAttachmentFile: jest.fn(async (_session: ApiSession, request: { filename: string }) => ({
			filename: `0000000000031031/1846031000000002001_${request.filename}`,
			url: presigned(request.filename, host),
			type_cdn: 1
		}))
	};
	const result = await generatePathAttachments(
		client as unknown as Client,
		{} as ApiSession,
		attachments.map((attachment) => ({ ...attachment, url: 'blob:https://mezon.ai/1' })),
		'channel',
		ingest
	);
	const requests = client.uploadAttachmentFile.mock.calls.map(([, request]) => request as { transcode_hls?: boolean });
	return { result, requests };
};

beforeEach(() => {
	process.env.NX_CHAT_APP_FILE_INGEST = 'cdn-api-dev.nccsoft.vn=https://streaming.nccsoft.vn';
	jest.clearAllMocks();
});

afterEach(() => {
	delete process.env.NX_CHAT_APP_FILE_INGEST;
});

describe('generatePathAttachments', () => {
	const clip = { filename: 'clip.mp4', filetype: 'video/mp4', size: 20 * MiB };

	it('prepares a video for the ingest, without a transcode, when the send asks for the ingest', async () => {
		const { result, requests } = await prepare([clip], true);
		expect(requests[0].transcode_hls).toBe(false);
		expect(result[0].ingestUrl).toBe(`https://streaming.nccsoft.vn/dev-mezon/0000000000031031/clip.mp4?${QUERY}`);
	});

	it('asks for the transcode as before, with no ingest, when the send does not ask for the ingest', async () => {
		const { result, requests } = await prepare([clip]);
		expect(requests[0].transcode_hls).toBe(true);
		expect(result[0].ingestUrl).toBeUndefined();
	});

	it('asks for the transcode as before when the feature is off or the video is too large for the ingest', async () => {
		process.env.NX_CHAT_APP_FILE_INGEST = '';
		expect((await prepare([clip], true)).requests[0].transcode_hls).toBe(true);
		process.env.NX_CHAT_APP_FILE_INGEST = 'cdn-api-dev.nccsoft.vn=https://streaming.nccsoft.vn';
		expect((await prepare([{ ...clip, size: 1024 * MiB + 1 }], true)).requests[0].transcode_hls).toBe(true);
	});
});

describe('the presign_ingest marker', () => {
	it('names the videos prepared for the ingest, with the key form of presign_finish', async () => {
		const { result } = await prepare(
			[
				{ filename: 'clip.mp4', filetype: 'video/mp4', size: 20 * MiB },
				{ filename: 'IMG_0001.MOV', filetype: 'application/octet-stream', size: 5 },
				{ filename: 'photo.png', filetype: 'image/png', size: 5 },
				{ filename: 'huge.mp4', filetype: 'video/mp4', size: 1024 * MiB + 1 },
				{ filename: 'empty.mp4', filetype: 'video/mp4', size: 0 }
			],
			true
		);
		expect(getPresignIngestKeys(result)).toEqual(['1846031000000002001_clip', '1846031000000002001_IMG_0001']);
	});

	it('is empty when the send does not ask for the ingest, for another host, and while the feature is off', async () => {
		const clip = { filename: 'clip.mp4', filetype: 'video/mp4', size: 20 * MiB };
		expect(getPresignIngestKeys((await prepare([clip])).result)).toEqual([]);
		expect(getPresignIngestKeys((await prepare([clip], true, 'bucket.r2.cloudflarestorage.com')).result)).toEqual([]);
		process.env.NX_CHAT_APP_FILE_INGEST = '';
		expect(getPresignIngestKeys((await prepare([clip], true)).result)).toEqual([]);
		expect(getPresignIngestKeys(undefined)).toEqual([]);
	});
});

describe('putAttachmentFile', () => {
	const file = new Blob([new Uint8Array(4)]);

	it('sends a video prepared for the ingest through it, reporting its progress under its key and when it is sent', async () => {
		const attachment = prepared('clip.mp4', 'video', 4, true);
		const onProgress = jest.fn();
		const onSent = jest.fn();
		jest.mocked(uploadToFileIngest).mockImplementation(async (_file, _presigned, _ingest, report, sent) => {
			report?.(0.5);
			report?.(1);
			sent?.();
		});

		await expect(putAttachmentFile(attachment, file, attachment.uploadPath, onProgress, onSent)).resolves.toBe(true);

		expect(uploadToFileIngest).toHaveBeenCalledWith(file, attachment.uploadPath, attachment.ingestUrl, expect.any(Function), onSent);
		expect(onProgress.mock.calls).toEqual([
			['1846031000000002001_clip', 0.5],
			['1846031000000002001_clip', 1]
		]);
		expect(onSent).toHaveBeenCalledTimes(1);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('PUTs straight to the presigned URL whatever was not prepared for the ingest, videos included', async () => {
		const photo = prepared('photo.png', 'image', 4);
		await expect(putAttachmentFile(photo, file, photo.uploadPath)).resolves.toBe(true);
		expect(uploadFileToPath).toHaveBeenLastCalledWith(photo.uploadPath, file, 4);

		const video = prepared('clip.mp4', 'video', 4);
		await putAttachmentFile(video, file, video.uploadPath);
		expect(uploadFileToPath).toHaveBeenLastCalledWith(video.uploadPath, file, 4);
		expect(uploadToFileIngest).not.toHaveBeenCalled();
	});

	it('reports a failed direct PUT as false and lets an ingest failure through', async () => {
		const photo = prepared('photo.png', 'image', 4);
		jest.mocked(uploadFileToPath).mockResolvedValueOnce(false);
		await expect(putAttachmentFile(photo, file, photo.uploadPath)).resolves.toBe(false);

		const video = prepared('clip.mp4', 'video', 4, true);
		jest.mocked(uploadToFileIngest).mockRejectedValueOnce(new Error('The file ingest answered 409'));
		await expect(putAttachmentFile(video, file, video.uploadPath)).rejects.toThrow('409');
	});
});
