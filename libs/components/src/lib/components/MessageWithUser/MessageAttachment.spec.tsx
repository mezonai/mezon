import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { IMessageWithUser } from '@mezon/utils';
import type { ReactElement } from 'react';
import MessageAttachment from './MessageAttachment';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByProps: (props: Record<string, unknown>) => TestInstance[] };
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

jest.mock(
	'@mezon/core',
	() => ({
		useCdnUrlSigner: () => ({
			signCdnUrl: (url?: string) => url,
			isAwaitingSignature: () => false
		})
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/store',
	() => ({
		attachmentActions: {},
		buildTopicAttachmentList: () => [],
		getStore: () => ({ getState: () => ({}) }),
		selectCurrentChannel: () => undefined,
		selectCurrentClanId: () => 'clan',
		selectCurrentDM: () => undefined,
		selectCurrentTopicId: () => undefined,
		selectFirstMessageOfCurrentTopic: () => undefined,
		selectMessageByMessageId: () => undefined,
		selectMessageEntitiesByChannelId: () => ({}),
		selectMessageIdsByChannelId: () => [],
		useAppDispatch: () => jest.fn(),
		useAppSelector: (selector: (state: unknown) => unknown) => selector({})
	}),
	{ virtual: true }
);
jest.mock('@mezon/ui', () => ({ MezonIcon: () => null, MzIcons40: { mzFile: {} } }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/videoSource'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/file'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/presignFinish'),
		EMimeTypes: { mp4: 'mp4', mov: 'quicktime', png: 'png', jpeg: 'jpeg', sticker: 'sticker', heic: 'heic', audio: 'audio', tenor: 'tenor' },
		ETypeLinkMedia: { IMAGE_PREFIX: 'image', VIDEO_PREFIX: 'video', VIDEO_TS_FILE: 'vnd.dlna.mpeg-tts' },
		calculateAlbumLayout: () => null,
		generateAttachmentId: (att: { url?: string }) => att.url ?? 'id',
		isRealClanId: () => true,
		useAppLayout: () => ({ isMobile: false })
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse, NotificationType: {} }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('./Album', () => ({ __esModule: true, default: () => null }));
jest.mock('./MessageAudio/MessageAudio', () => ({ MessageAudio: () => null }));
jest.mock('./MessageLinkFile', () => ({
	__esModule: true,
	default: ({ attachmentData }: { attachmentData: { url?: string } }) => <div data-kind="document" data-url={attachmentData.url} />
}));
jest.mock('./MessageVideo', () => ({
	__esModule: true,
	default: ({ attachmentData }: { attachmentData: { url?: string } }) => <div data-kind="video" data-url={attachmentData.url} />
}));
jest.mock('./Photo', () => ({ __esModule: true, default: () => null }));
jest.mock('./usePresignRefresh', () => ({ usePresignRefresh: () => undefined }));

const makeMessage = (attachments: IMessageWithUser['attachments']): IMessageWithUser =>
	({
		id: 'm1',
		channel_id: 'c1',
		clan_id: 'clan',
		sender_id: 'u1',
		content: { t: '' },
		attachments
	}) as IMessageWithUser;

beforeEach(() => {
	process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
});

describe('MessageAttachment video container classification', () => {
	it('renders m2ts, mts, mkv, and flv on CDN hosts as videos even with mpeg-tts or doc MIME', () => {
		const attachments = [
			{ filename: 'clip.m2ts', filetype: 'video/vnd.dlna.mpeg-tts', url: 'https://cdn.mezon.ai/1/100_clip.m2ts' },
			{ filename: 'clip.mts', filetype: 'application', url: 'https://cdn-dev.nccsoft.vn/1/101_clip.mts' },
			{ filename: 'movie.mkv', filetype: 'doc', url: 'https://cdn.mezon.ai/1/102_movie.mkv' },
			{ filename: 'movie.flv', filetype: 'application', url: 'https://cdn-dev.nccsoft.vn/1/103_movie.flv' }
		];
		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<MessageAttachment message={makeMessage(attachments)} mode={2} />);
		});

		expect(renderer.root.findAllByProps({ 'data-kind': 'video' }).map((node) => node.props['data-url'])).toEqual(
			attachments.map((att) => att.url)
		);
		expect(renderer.root.findAllByProps({ 'data-kind': 'document' })).toHaveLength(0);
		renderer.unmount();
	});

	it('keeps TypeScript source files as document cards even with Windows mpeg-tts MIME', () => {
		const attachments = [
			{ filename: 'example.ts', filetype: 'video/vnd.dlna.mpeg-tts', url: 'https://cdn.mezon.ai/1/200_example.ts' },
			{ filename: 'app.ts', filetype: 'doc', url: 'https://cdn-dev.nccsoft.vn/1/201_app.ts' },
			{ filename: 'remote.m2ts', filetype: 'video/mp2t', url: 'https://cdn.komu.vn/1/202_remote.m2ts' }
		];
		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<MessageAttachment message={makeMessage(attachments)} mode={2} />);
		});

		expect(renderer.root.findAllByProps({ 'data-kind': 'video' })).toHaveLength(0);
		expect(renderer.root.findAllByProps({ 'data-kind': 'document' }).map((node) => node.props['data-url'])).toEqual(
			attachments.map((att) => att.url)
		);
		renderer.unmount();
	});
});
