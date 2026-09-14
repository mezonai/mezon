import { createLocalPreviewUrl, forgetLocalPreview, revokePreSendAttachmentUrls } from './file';

jest.mock('../constant', () => ({ MAX_FILE_ATTACHMENTS: 10 }));
jest.mock('../helper/videoPoster', () => ({ captureVideoPosterFromUrl: jest.fn() }));

it('creates a video poster URL independent of composer cleanup without retaining the video file', () => {
	const poster = new Blob(['poster'], { type: 'image/png' });
	const video = new Blob(['video'], { type: 'video/mp4' });
	const createUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:message-poster');
	const revokeUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
	const attachment = {
		filename: 'video.mp4',
		filetype: 'video',
		url: 'blob:composer-video',
		thumbnail: 'blob:composer-poster',
		_sourceFile: video as File,
		_thumbnailBlob: poster
	};
	try {
		expect(createLocalPreviewUrl(attachment)).toBe('blob:message-poster');
		expect(createUrl).toHaveBeenCalledWith(poster);
		revokePreSendAttachmentUrls(attachment);
		expect(revokeUrl).not.toHaveBeenCalledWith('blob:message-poster');
		expect(revokeUrl).toHaveBeenCalledWith('blob:composer-poster');
	} finally {
		forgetLocalPreview('blob:message-poster');
		createUrl.mockRestore();
		revokeUrl.mockRestore();
	}
});

it('does not create an image preview from the video itself when no poster was captured', () => {
	const createUrl = jest.spyOn(URL, 'createObjectURL');
	try {
		expect(createLocalPreviewUrl({ filetype: 'video/mp4' })).toBeUndefined();
		expect(createUrl).not.toHaveBeenCalled();
	} finally {
		createUrl.mockRestore();
	}
});
