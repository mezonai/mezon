import type { ApiMessageAttachment } from 'mezon-js';
import { getWebUploadedAttachments } from './index';
import { putAttachmentFile } from './presignUpload';

jest.mock('@mezon/transport', () => ({ CustomFile: class {} }), { virtual: true });
jest.mock('mezon-js', () => ({ NotificationType: {}, ChannelStreamMode: {}, ChannelType: {} }));
jest.mock('./windowEnvironment', () => ({}));
jest.mock('./windowSize', () => ({}));
jest.mock('./launchMediaWorkers', () => ({}));
jest.mock('../e2ee/e2ee', () => ({}));
jest.mock('../helper/mediaDimensions', () => ({}));
jest.mock('../hooks/useBackgroundMode', () => ({}));
jest.mock('./presignUpload', () => ({ ...jest.requireActual('./presignUpload'), putAttachmentFile: jest.fn() }));

const attachment = (filename: string, filetype: string) =>
	({
		filename,
		filetype,
		url: `blob:https://mezon.ai/${filename}`,
		uploadName: `0000000000031031/1846031000000002001_${filename}`,
		uploadPath: `https://cdn-api-dev.nccsoft.vn/dev-mezon/0000000000031031/${filename}?X-Amz-Signature=0123abcd`,
		_sourceFile: new Blob([new Uint8Array(4)])
	}) as unknown as ApiMessageAttachment;

it('frees the upload worker once an ingest video is sent, so later uploads do not wait for it to be stored', async () => {
	let store = () => undefined as void;
	const stored = new Promise<void>((resolve) => (store = resolve));
	const started: string[] = [];
	jest.mocked(putAttachmentFile).mockImplementation(async (prepared, _file, _presignedUrl, _onProgress, onSent) => {
		started.push(prepared.filename as string);
		if (prepared.filetype === 'image') return true;
		onSent?.();
		await stored;
		return true;
	});

	const videos = ['1.mp4', '2.mp4', '3.mp4', '4.mp4'].map((name) => attachment(name, 'video'));
	const upload = getWebUploadedAttachments({ attachments: [...videos, attachment('photo.png', 'image')] });
	await new Promise(setImmediate);

	expect(started).toEqual(['1.mp4', '2.mp4', '3.mp4', '4.mp4', 'photo.png']);
	store();
	await expect(upload).resolves.toEqual([
		'1846031000000002001_1',
		'1846031000000002001_2',
		'1846031000000002001_3',
		'1846031000000002001_4',
		'1846031000000002001_photo'
	]);
});
