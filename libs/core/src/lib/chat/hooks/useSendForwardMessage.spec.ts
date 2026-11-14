import { linkForwardAttachment } from './useSendForwardMessage';

jest.mock(
	'@mezon/store',
	() => ({
		getStore: () => ({ getState: () => ({}) }),
		selectCurrentClanId: () => 'clan',
		toastActions: { addToast: jest.fn() },
		useAppDispatch: () => jest.fn()
	}),
	{ virtual: true }
);

jest.mock('@mezon/transport', () => ({ useMezon: () => ({ clientRef: { current: null }, sessionRef: { current: null } }) }), { virtual: true });

jest.mock(
	'@mezon/utils',
	() => ({
		E_ERROR_CHANNEL: { NOT_FOUND: 5, ALREADY_EXISTS: 6 },
		MAX_FORWARD_MESSAGE_LENGTH: 4000,
		getCdnSignatureChannelId: (url: string) => {
			const hex = /\/([0-9a-fA-F]{16})\/[^/]+$/.exec(new URL(url).pathname)?.[1];
			return hex ? BigInt(`0x${hex}`).toString() : undefined;
		},
		hasFinishedHlsCopy: jest.fn(),
		withoutPresignMarkers: (content: unknown) => content
	}),
	{ virtual: true }
);

jest.mock('mezon-js', () => ({ ChannelStreamMode: {}, ChannelType: {}, safeJSONParse: JSON.parse }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }), { virtual: true });
jest.mock('react-redux', () => ({ useSelector: jest.fn() }), { virtual: true });

const SOURCE = '1d6beecf9ec01000';
const DEST_CHANNEL = '2120050625096978432';
const DEST = BigInt(DEST_CHANNEL).toString(16);
const video = {
	url: `https://cdn.mezon.ai/${SOURCE}/2121_clip.mp4`,
	thumbnail: `https://cdn.mezon.ai/${SOURCE}/2121_clip_thumb.jpg`,
	filetype: 'video/mp4'
};

const linked = { linked: true as const };
const failed = (code: unknown) => ({ linked: false as const, code });

describe('linkForwardAttachment', () => {
	it('moves the video and its thumbnail into the destination folder', async () => {
		const link = jest.fn().mockResolvedValue(linked);
		const result = await linkForwardAttachment(video, DEST_CHANNEL, link, jest.fn());

		expect(result.failure).toBeUndefined();
		expect(result.attachment.url).toBe(`https://cdn.mezon.ai/${DEST}/2121_clip.mp4`);
		expect(result.attachment.thumbnail).toBe(`https://cdn.mezon.ai/${DEST}/2121_clip_thumb.jpg`);
		expect(link).toHaveBeenCalledWith(video.thumbnail, `https://cdn.mezon.ai/${DEST}/2121_clip_thumb.jpg`);
	});

	it('still links the thumbnail when only the HLS copy of the video is left', async () => {
		const link = jest.fn((src: string) => Promise.resolve(src === video.url ? failed(5) : linked));
		const hasHlsCopy = jest.fn().mockResolvedValue(true);
		const result = await linkForwardAttachment(video, DEST_CHANNEL, link, hasHlsCopy);

		expect(result.failure).toBeUndefined();
		expect(result.attachment.url).toBe(video.url);
		expect(result.attachment.thumbnail).toBe(`https://cdn.mezon.ai/${DEST}/2121_clip_thumb.jpg`);
		expect(hasHlsCopy).toHaveBeenCalledWith(video.url);
	});

	it('reports the failure but keeps a linked thumbnail when the video is gone without an HLS copy', async () => {
		const link = jest.fn((src: string) => Promise.resolve(src === video.url ? failed(5) : linked));
		const result = await linkForwardAttachment(video, DEST_CHANNEL, link, jest.fn().mockResolvedValue(false));

		expect(result.failure).toEqual({ code: 5 });
		expect(result.attachment.url).toBe(video.url);
		expect(result.attachment.thumbnail).toBe(`https://cdn.mezon.ai/${DEST}/2121_clip_thumb.jpg`);
	});

	it('keeps the original thumbnail when linking it fails', async () => {
		const link = jest.fn((src: string) => Promise.resolve(src === video.url ? linked : failed(13)));
		const result = await linkForwardAttachment(video, DEST_CHANNEL, link, jest.fn());

		expect(result.failure).toBeUndefined();
		expect(result.attachment.url).toBe(`https://cdn.mezon.ai/${DEST}/2121_clip.mp4`);
		expect(result.attachment.thumbnail).toBe(video.thumbnail);
	});

	it('leaves an attachment without a url untouched', async () => {
		const link = jest.fn();
		const attachment = { filename: 'note.txt' };
		const result = await linkForwardAttachment(attachment, DEST_CHANNEL, link, jest.fn());

		expect(result).toEqual({ attachment });
		expect(link).not.toHaveBeenCalled();
	});
});
