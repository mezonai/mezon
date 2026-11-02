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
const prepared = (filename: string, filetype: string, size: number, host?: string) => {
	const uploadName = `0000000000031031/1846031000000002001_${filename}`;
	return { filename, filetype, size, url: `https://cdn-dev.nccsoft.vn/${uploadName}`, uploadName, uploadPath: presigned(filename, host) };
};

beforeEach(() => {
	process.env.NX_CHAT_APP_FILE_INGEST = 'cdn-api-dev.nccsoft.vn=https://streaming.nccsoft.vn';
	jest.clearAllMocks();
});

afterEach(() => {
	delete process.env.NX_CHAT_APP_FILE_INGEST;
});

describe('the presign_ingest marker', () => {
	it('names the videos whose presigned URL is on an ingest host, with the key form of presign_finish', () => {
		expect(
			getPresignIngestKeys([
				prepared('clip.mp4', 'video', 20 * MiB),
				prepared('IMG_0001.MOV', 'doc', 5),
				prepared('photo.png', 'image', 5),
				prepared('huge.mp4', 'video', 1024 * MiB + 1),
				prepared('empty.mp4', 'video', 0),
				prepared('r2.mp4', 'video', 5, 'bucket.r2.cloudflarestorage.com')
			])
		).toEqual(['1846031000000002001_clip', '1846031000000002001_IMG_0001']);
	});

	it('is empty while the feature is off', () => {
		process.env.NX_CHAT_APP_FILE_INGEST = '';
		expect(getPresignIngestKeys([prepared('clip.mp4', 'video', 20 * MiB)])).toEqual([]);
		expect(getPresignIngestKeys(undefined)).toEqual([]);
	});
});

describe('generatePathAttachments', () => {
	const presign = async (attachment: { filename: string; filetype: string; size: number }) => {
		const client = {
			uploadAttachmentFile: jest.fn(async () => ({
				filename: `0000000000031031/1_${attachment.filename}`,
				url: presigned(attachment.filename),
				type_cdn: 1
			}))
		};
		await generatePathAttachments(client as unknown as Client, {} as ApiSession, [{ ...attachment, url: 'blob:https://mezon.ai/1' }], 'channel');
		return client.uploadAttachmentFile.mock.calls[0] as unknown as [ApiSession, { transcode_hls?: boolean }];
	};

	it('asks no transcode for a video that may go through the ingest', async () => {
		const [, request] = await presign({ filename: 'clip.mp4', filetype: 'video/mp4', size: 20 * MiB });
		expect(request.transcode_hls).toBe(false);
	});

	it('asks for the transcode as before when the feature is off or the video is too large for the ingest', async () => {
		process.env.NX_CHAT_APP_FILE_INGEST = '';
		expect((await presign({ filename: 'clip.mp4', filetype: 'video/mp4', size: 20 * MiB }))[1].transcode_hls).toBe(true);
		process.env.NX_CHAT_APP_FILE_INGEST = 'cdn-api-dev.nccsoft.vn=https://streaming.nccsoft.vn';
		expect((await presign({ filename: 'clip.mp4', filetype: 'video/mp4', size: 1024 * MiB + 1 }))[1].transcode_hls).toBe(true);
	});
});

describe('putAttachmentFile', () => {
	const file = new Blob([new Uint8Array(4)]);

	it('sends an ingest video through the ingest, reporting its progress under its key and when it is sent', async () => {
		const attachment = prepared('clip.mp4', 'video', 4);
		const onProgress = jest.fn();
		const onSent = jest.fn();
		jest.mocked(uploadToFileIngest).mockImplementation(async (_file, _presigned, _ingest, report, sent) => {
			report?.(0.5);
			report?.(1);
			sent?.();
		});

		await expect(putAttachmentFile(attachment, file, attachment.uploadPath, onProgress, onSent)).resolves.toBe(true);

		expect(uploadToFileIngest).toHaveBeenCalledWith(
			file,
			attachment.uploadPath,
			`https://streaming.nccsoft.vn/dev-mezon/0000000000031031/clip.mp4?${QUERY}`,
			expect.any(Function),
			onSent
		);
		expect(onProgress.mock.calls).toEqual([
			['1846031000000002001_clip', 0.5],
			['1846031000000002001_clip', 1]
		]);
		expect(onSent).toHaveBeenCalledTimes(1);
		expect(uploadFileToPath).not.toHaveBeenCalled();
	});

	it('keeps the direct PUT for other files, other hosts, and when the feature is off', async () => {
		const photo = prepared('photo.png', 'image', 4);
		await expect(putAttachmentFile(photo, file, photo.uploadPath)).resolves.toBe(true);
		expect(uploadFileToPath).toHaveBeenLastCalledWith(photo.uploadPath, file, 4);

		const r2 = prepared('clip.mp4', 'video', 4, 'bucket.r2.cloudflarestorage.com');
		await putAttachmentFile(r2, file, r2.uploadPath);
		expect(uploadFileToPath).toHaveBeenLastCalledWith(r2.uploadPath, file, 4);

		process.env.NX_CHAT_APP_FILE_INGEST = '';
		const video = prepared('clip.mp4', 'video', 4);
		await putAttachmentFile(video, file, video.uploadPath);
		expect(uploadFileToPath).toHaveBeenLastCalledWith(video.uploadPath, file, 4);
		expect(uploadToFileIngest).not.toHaveBeenCalled();
	});

	it('reports a failed direct PUT as false and lets an ingest failure through', async () => {
		const photo = prepared('photo.png', 'image', 4);
		jest.mocked(uploadFileToPath).mockResolvedValueOnce(false);
		await expect(putAttachmentFile(photo, file, photo.uploadPath)).resolves.toBe(false);

		const video = prepared('clip.mp4', 'video', 4);
		jest.mocked(uploadToFileIngest).mockRejectedValueOnce(new Error('The file ingest answered 409'));
		await expect(putAttachmentFile(video, file, video.uploadPath)).rejects.toThrow('409');
	});
});
