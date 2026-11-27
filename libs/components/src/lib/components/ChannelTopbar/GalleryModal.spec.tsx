import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AttachmentEntity } from '@mezon/store';
import type { ReactElement } from 'react';
import { GalleryModal } from './GalleryModal';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: {
		findAllByType: (type: string) => TestInstance[];
		findByProps: (props: Record<string, unknown>) => TestInstance;
	};
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

let mockGalleryAttachments: AttachmentEntity[] = [];

jest.mock(
	'@floating-ui/react',
	() => ({
		FloatingFocusManager: ({ children }: { children: ReactElement }) => children,
		FloatingPortal: ({ children }: { children: ReactElement }) => children,
		autoUpdate: jest.fn(),
		flip: jest.fn(),
		offset: jest.fn(),
		shift: jest.fn(),
		useClick: () => ({}),
		useDismiss: () => ({}),
		useFloating: () => ({
			refs: { setReference: jest.fn(), setFloating: jest.fn(), reference: { current: null }, floating: { current: null } },
			floatingStyles: {},
			context: {}
		}),
		useInteractions: () => ({ getReferenceProps: () => ({}), getFloatingProps: () => ({}) }),
		useRole: () => ({})
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/core',
	() => ({
		useCdnUrlSigner: () => ({ signCdnUrl: (url?: string) => url ?? '' }),
		useEscapeKeyClose: () => undefined
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/store',
	() => ({
		attachmentActions: {
			setCurrentAttachment: jest.fn(),
			setOpenModalAttachment: jest.fn(),
			setAttachment: jest.fn(),
			setChannelAttachments: jest.fn()
		},
		galleryActions: { fetchGalleryAttachments: jest.fn(), setGalleryLoading: jest.fn() },
		getStore: () => ({ getState: () => ({}) }),
		mapChannelAttachmentsToEntity: (att: unknown) => att,
		selectCurrentChannelId: () => 'c1',
		selectCurrentClanId: () => 'clan',
		selectCurrentDM: () => undefined,
		selectGalleryAttachmentsByChannel: () => mockGalleryAttachments,
		selectGalleryPaginationByChannel: () => ({ isLoading: false, limit: 50, hasMoreBefore: false, hasMoreAfter: false }),
		selectMessageByMessageId: () => undefined,
		selectMessageEntitiesByChannelId: () => ({}),
		useAppDispatch: () => jest.fn(),
		useAppSelector: (selector: (state: unknown) => unknown) => selector({})
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/ui',
	() => ({
		MezonIcon: () => null,
		MzIcons16: { mzClose: {}, mzChevronDown: {} },
		MzIcons20: { mzFileImage: {} },
		MzIcons32: { mzImage: {}, mzWarning: {}, mzPlay: {} },
		MzIcons48: { mzFileImage: {} }
	}),
	{ virtual: true }
);
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/videoSource'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/file'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/presignFinish'),
		EMimeTypes: { sticker: 'sticker' },
		ETypeLinkMedia: { IMAGE_PREFIX: 'image', VIDEO_PREFIX: 'video', VIDEO_TS_FILE: 'vnd.dlna.mpeg-tts' },
		LoadMoreDirection: { Backwards: 'Backwards' },
		convertDateStringI18n: () => '27/11/2026',
		createImgproxyUrl: (url: string) => `proxy:${url}`,
		generateAttachmentId: (att: { id?: string }) => att.id ?? 'id',
		generateE2eId: (id: string) => id,
		isRealClanId: () => true
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse, NotificationType: {} }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }) }));
jest.mock('react-redux', () => ({ useSelector: (selector: (state: unknown) => unknown) => selector({}) }));
jest.mock('../MessageWithUser/useVideoSource', () => ({
	useVideoSource: () => ({ failed: false, handleError: jest.fn() })
}));
jest.mock('./InfiniteScroll', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactElement }) => <div>{children}</div>
}));

beforeEach(() => {
	process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
	mockGalleryAttachments = [];
	Object.assign(globalThis, {
		document: { addEventListener: () => undefined, removeEventListener: () => undefined },
		IntersectionObserver: class {
			observe() {
				return undefined;
			}
			disconnect() {
				return undefined;
			}
		}
	});
});

describe('GalleryModal video classification', () => {
	it('shows m2ts, mts, and flv transcoded containers in the video tab and excludes TypeScript files with mpeg-tts MIME', () => {
		const createTime = '2026-11-27T09:00:00.000Z';
		mockGalleryAttachments = [
			{ id: '1', url: 'https://cdn.mezon.ai/1/100_clip.m2ts', filetype: 'application', filename: 'clip.m2ts', create_time: createTime },
			{
				id: '2',
				url: 'https://cdn-dev.nccsoft.vn/1/101_clip.mts',
				filetype: 'video/vnd.dlna.mpeg-tts',
				filename: 'clip.mts',
				create_time: createTime
			},
			{ id: '3', url: 'https://cdn.mezon.ai/1/102_clip.flv', filetype: 'doc', filename: 'clip.flv', create_time: createTime },
			{
				id: '4',
				url: 'https://cdn.mezon.ai/1/200_example.ts',
				filetype: 'video/vnd.dlna.mpeg-tts',
				filename: 'example.ts',
				create_time: createTime
			}
		] as AttachmentEntity[];

		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<GalleryModal onClose={jest.fn()} />);
		});

		const videoTab = renderer.root.findByProps({ 'data-e2e': 'clan_page.modal.gallery.tab.video' });
		act(() => {
			(videoTab.props.onClick as () => void)();
		});

		expect(renderer.root.findAllByType('img')).toHaveLength(0);
		expect(renderer.root.findAllByType('div').filter((node) => node.props.className === 'relative w-full h-full bg-gray-900')).toHaveLength(3);
		renderer.unmount();
	});
});
