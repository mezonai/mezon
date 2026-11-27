import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AttachmentEntity } from '@mezon/store';
import type { ReactElement } from 'react';
import ItemAttachment from './itemAttachment';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByType: (type: string) => TestInstance[] };
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

jest.mock('@mezon/core', () => ({ useCdnUrlSigner: () => ({ signCdnUrl: (url?: string) => url ?? '' }) }), { virtual: true });
jest.mock(
	'@mezon/store',
	() => ({
		attachmentActions: { setCurrentAttachment: jest.fn() },
		selectMessageByMessageId: () => undefined,
		useAppDispatch: () => jest.fn(),
		useAppSelector: () => undefined
	}),
	{ virtual: true }
);
jest.mock('@mezon/ui', () => ({ MezonIcon: () => null, MzIcons24: { mzPlay: {} } }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../../utils/src/lib/utils/videoSource'),
		EMimeTypes: { mp4: 'mp4', mov: 'quicktime' },
		ETypeLinkMedia: { VIDEO_PREFIX: 'video', VIDEO_TS_FILE: 'vnd.dlna.mpeg-tts' },
		createImgproxyUrl: (url: string) => `proxy:${url}`,
		isAttachmentPresignPendingForMessage: () => false
	}),
	{ virtual: true }
);

const renderItem = (attachment: Partial<AttachmentEntity>) => {
	let renderer!: TestRenderer;
	act(() => {
		renderer = create(
			<ItemAttachment
				attachment={attachment as AttachmentEntity}
				channelId="c1"
				previousDate="27/11/2026"
				selectedImageRef={{ current: null }}
				showDate={false}
				handleDrag={() => undefined}
				index={0}
				setCurrentIndexAtt={jest.fn()}
				currentIndexAtt={0}
			/>
		);
	});
	return renderer;
};

beforeEach(() => {
	process.env.NX_MEZON_CDN_URL = 'https://cdn-dev.nccsoft.vn';
});

describe('ItemAttachment video detection', () => {
	it('renders transcoded containers with application or mpeg-tts MIME as video thumbnails', () => {
		for (const attachment of [
			{ id: '1', url: 'https://cdn.mezon.ai/1/100_clip.m2ts', filetype: 'application' },
			{ id: '2', url: 'https://cdn-dev.nccsoft.vn/1/101_clip.mts', filetype: 'video/vnd.dlna.mpeg-tts' },
			{ id: '3', url: 'https://cdn.mezon.ai/1/102_clip.flv', filetype: 'doc' }
		]) {
			const renderer = renderItem(attachment);
			expect(renderer.root.findAllByType('video')).toHaveLength(1);
			expect(renderer.root.findAllByType('img')).toHaveLength(0);
			renderer.unmount();
		}
	});

	it('does not treat TypeScript files with mpeg-tts MIME as video thumbnails', () => {
		const renderer = renderItem({
			id: '4',
			url: 'https://cdn.mezon.ai/1/200_example.ts',
			filetype: 'video/vnd.dlna.mpeg-tts'
		});
		expect(renderer.root.findAllByType('video')).toHaveLength(0);
		expect(renderer.root.findAllByType('img')).toHaveLength(1);
		renderer.unmount();
	});
});
