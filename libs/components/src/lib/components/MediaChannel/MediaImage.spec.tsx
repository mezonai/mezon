import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ChannelTimelineAttachment } from '@mezon/store';
import type { ReactElement } from 'react';
import { MediaImage } from './MediaImage';
import { MediaImageModal } from './MediaImageModal';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByType: (type: string) => TestInstance[] };
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
			signCdnUrl: (url?: string) => url ?? '',
			isAwaitingSignature: () => false
		})
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
			mzFileImage: {},
			mzPlay: {},
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
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/videoSource'),
		ETypeLinkMedia: { VIDEO_PREFIX: 'video', VIDEO_TS_FILE: 'vnd.dlna.mpeg-tts' },
		createImgproxyUrl: (url: string) => `proxy:${url}`,
		handleSaveImage: jest.fn()
	}),
	{ virtual: true }
);
jest.mock('../MessageWithUser/useVideoSource', () => ({
	useVideoSource: () => ({ failed: false, handleError: jest.fn() })
}));

beforeEach(() => {
	Object.assign(globalThis, { window: { addEventListener: () => undefined, removeEventListener: () => undefined } });
});

describe('MediaImage and MediaImageModal video extension handling', () => {
	it('renders flv, m2ts, and mts as video elements and keeps avif, ts, and non-video filenames as images', () => {
		for (const src of [
			'https://cdn.mezon.ai/1/clip.flv?sig=1',
			'https://cdn.mezon.ai/1/clip.m2ts?sig=1',
			'https://cdn.mezon.ai/1/clip.mts#t=2'
		]) {
			let renderer!: TestRenderer;
			act(() => {
				renderer = create(<MediaImage src={src} />);
			});
			expect(renderer.root.findAllByType('video')).toHaveLength(1);
			expect(renderer.root.findAllByType('img')).toHaveLength(0);
			renderer.unmount();
		}

		for (const src of [
			'https://cdn.mezon.ai/1/example.ts',
			'https://cdn.mezon.ai/1/photo.avif',
			'https://cdn.mezon.ai/1/remove.png',
			'https://cdn.mezon.ai/1/movie.avi.png'
		]) {
			let renderer!: TestRenderer;
			act(() => {
				renderer = create(<MediaImage src={src} />);
			});
			expect(renderer.root.findAllByType('video')).toHaveLength(0);
			expect(renderer.root.findAllByType('img')).toHaveLength(1);
			renderer.unmount();
		}
	});

	it('classifies modal main media and thumbnails accurately for m2ts/mts/flv vs ts/avif', () => {
		const attachments = [
			{ id: '1', file_url: 'https://cdn.mezon.ai/1/clip.m2ts?sig=1', file_type: 'application', file_name: 'clip.m2ts' },
			{ id: '2', file_url: 'https://cdn.mezon.ai/1/clip.flv', file_type: 'application', file_name: 'clip.flv' },
			{ id: '3', file_url: 'https://cdn.mezon.ai/1/example.ts', file_type: 'video/vnd.dlna.mpeg-tts', file_name: 'example.ts' },
			{ id: '4', file_url: 'https://cdn.mezon.ai/1/photo.avif', file_type: 'image/avif', file_name: 'photo.avif' }
		] as ChannelTimelineAttachment[];

		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<MediaImageModal attachments={attachments} initialIndex={0} onClose={jest.fn()} />);
		});
		expect(renderer.root.findAllByType('video')).toHaveLength(3);
		expect(renderer.root.findAllByType('img')).toHaveLength(2);
		renderer.unmount();

		act(() => {
			renderer = create(<MediaImageModal attachments={attachments} initialIndex={2} onClose={jest.fn()} />);
		});
		expect(renderer.root.findAllByType('video')).toHaveLength(2);
		expect(renderer.root.findAllByType('img')).toHaveLength(3);
		renderer.unmount();
	});
});
