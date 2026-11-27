import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AttachmentEntity } from '@mezon/store';
import type { ReactElement } from 'react';
import MessageModalImage from './index';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByType: (type: string) => TestInstance[] };
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

let mockCurrentAttachment: Partial<AttachmentEntity> | undefined;
let mockAttachmentUrl = '';

jest.mock(
	'@mezon/core',
	() => ({
		useAppParams: () => ({ directId: undefined }),
		useAttachments: () => ({ setOpenModalAttachment: jest.fn() }),
		useCdnUrlSigner: () => ({ signCdnUrl: (url?: string) => url ?? '' })
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/store',
	() => ({
		attachmentActions: {
			removeCurrentAttachment: jest.fn(),
			setAttachmentLoading: jest.fn(),
			setCurrentAttachment: jest.fn(),
			fetchChannelAttachments: jest.fn()
		},
		getStore: () => ({ getState: () => ({}) }),
		selectAllListAttachmentByChannel: () => [],
		selectAttachment: () => mockAttachmentUrl,
		selectAttachmentListChannelId: () => undefined,
		selectAttachmentPaginationByChannel: () => ({ isLoading: false, limit: 50, hasMoreBefore: false, hasMoreAfter: false }),
		selectCurrentAttachmentShowImage: () => mockCurrentAttachment,
		selectCurrentChannelId: () => 'c1',
		selectCurrentChannelLabel: () => 'general',
		selectCurrentClanId: () => 'clan',
		selectDmChannelLabelById: () => '',
		selectMemberClanByUserId: () => undefined,
		selectMemberGroupByUserId: () => undefined,
		selectMessageByMessageId: () => undefined,
		selectMessageIdAttachment: () => 'm1',
		selectModeAttachment: () => 2,
		selectModeResponsive: () => 'CLAN',
		selectOpenModalAttachment: () => true,
		useAppDispatch: () => jest.fn(),
		useAppSelector: (selector: (state: unknown) => unknown) => selector({})
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/ui',
	() => ({
		Icons: { StraightLineIcon: () => null },
		MezonIcon: () => null,
		MzIcons16: { mzClose: {} },
		MzIcons20: {
			mzChevronDown: {},
			mzDownload: {},
			mzRotateLeft: {},
			mzRotateRight: {},
			mzZoomIn: {},
			mzAspectRatio: {},
			mzSidebar: {}
		},
		MzIcons48: { mzImage: {} }
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../../utils/src/lib/utils/videoSource'),
		ETypeLinkMedia: { VIDEO_PREFIX: 'video', VIDEO_TS_FILE: 'vnd.dlna.mpeg-tts' },
		ModeResponsive: { MODE_CLAN: 'CLAN' },
		SHOW_POSITION: { NONE: 'NONE', IN_VIEWER: 'IN_VIEWER' },
		createImgproxyUrl: (url: string) => `proxy:${url}`,
		formatDateI18n: () => '27/11/2026',
		handleSaveImage: jest.fn(),
		isAttachmentPresignPendingForMessage: () => false,
		normalizeClanId: (id: string) => id
	}),
	{ virtual: true }
);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../AvatarImage/AvatarImage', () => ({ AvatarImage: () => null }));
jest.mock('../../ContextMenu', () => ({
	useMessageContextMenu: () => ({
		showMessageContextMenu: jest.fn(),
		setPositionShow: jest.fn(),
		setImageURL: jest.fn()
	})
}));
jest.mock('../useVideoSource', () => ({
	useVideoSource: () => ({ failed: false, handleError: jest.fn() })
}));
jest.mock('./listAttachment', () => ({ __esModule: true, default: () => null }));

beforeEach(() => {
	mockCurrentAttachment = undefined;
	mockAttachmentUrl = '';
	Object.assign(globalThis, { window: { addEventListener: () => undefined, removeEventListener: () => undefined } });
});

describe('MessageModalImage video detection', () => {
	it('renders video player for m2ts, mts, and flv URLs with query or fragment even when filetype is application or mpeg-tts', () => {
		for (const attachment of [
			{ id: '1', url: 'https://cdn.mezon.ai/1/clip.m2ts?sig=1', filetype: 'video/vnd.dlna.mpeg-tts' },
			{ id: '2', url: 'https://cdn-dev.nccsoft.vn/1/clip.mts#t=1', filetype: 'application' },
			{ id: '3', url: 'https://cdn.mezon.ai/1/clip.flv?download=photo.png', filetype: 'doc' }
		]) {
			mockCurrentAttachment = attachment;
			let renderer!: TestRenderer;
			act(() => {
				renderer = create(<MessageModalImage />);
			});
			expect(renderer.root.findAllByType('video')).toHaveLength(1);
			expect(renderer.root.findAllByType('img')).toHaveLength(0);
			renderer.unmount();
		}
	});

	it('does not treat TypeScript files, avif images, or filenames containing video substrings as videos', () => {
		for (const attachment of [
			{ id: '4', url: 'https://cdn.mezon.ai/1/example.ts', filetype: 'video/vnd.dlna.mpeg-tts' },
			{ id: '5', url: 'https://cdn.mezon.ai/1/photo.avif', filetype: 'image/avif' },
			{ id: '6', url: 'https://cdn.mezon.ai/1/remove.png', filetype: 'image/png' },
			{ id: '7', url: 'https://cdn.mezon.ai/1/movie.avi.png', filetype: 'image/png' }
		]) {
			mockCurrentAttachment = attachment;
			let renderer!: TestRenderer;
			act(() => {
				renderer = create(<MessageModalImage />);
			});
			expect(renderer.root.findAllByType('video')).toHaveLength(0);
			expect(renderer.root.findAllByType('img')).toHaveLength(1);
			renderer.unmount();
		}
	});
});
