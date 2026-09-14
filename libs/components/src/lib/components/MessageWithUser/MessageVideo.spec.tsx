import { act, create } from 'react-test-renderer';
import MessageVideo from './MessageVideo';

let mockIsIntersecting = true;
jest.mock('@mezon/ui', () => ({ Icons: { PlayButton: () => null } }), { virtual: true });
jest.mock('@mezon/utils', () => ({
	calculateMediaDimensions: () => ({ width: 320, height: 180 }),
	createImgproxyUrl: (url: string) => `proxy:${url}`,
	useIsIntersecting: () => mockIsIntersecting,
	useResizeObserver: () => undefined
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('use-debounce', () => ({ useDebouncedCallback: (callback: unknown) => callback }));
jest.mock('mp4box', () => ({}));

const attachment = {
	filename: 'movie.mp4',
	filetype: 'video',
	url: 'https://cdn/video.mp4',
	thumbnail: 'https://cdn/poster.png',
	local_source: 'blob:independent-poster',
	width: 320,
	height: 180
};

beforeEach(() => {
	mockIsIntersecting = true;
});

it('keeps the same poster through acknowledgement and upload completion, including a remount', () => {
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<MessageVideo attachmentData={attachment} isSending />);
	});
	const poster = renderer.root.findByType('img');
	expect(poster.props.src).toBe(attachment.local_source);
	act(() => {
		renderer.update(<MessageVideo attachmentData={attachment} isPresignPending />);
	});
	expect(renderer.root.findByType('img')).toBe(poster);
	expect(poster.props.src).toBe(attachment.local_source);
	mockIsIntersecting = false;
	act(() => {
		renderer.update(<MessageVideo attachmentData={attachment} />);
	});
	expect(renderer.root.findByType('img')).toBe(poster);
	expect(poster.props.src).toBe(attachment.local_source);
	expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
	act(() => {
		renderer.update(<MessageVideo key="confirmed" attachmentData={attachment} />);
	});
	expect(renderer.root.findByType('img').props.src).toBe(attachment.local_source);
	act(() => renderer.unmount());
});

it('falls back to the remote poster if the local preview is evicted', () => {
	let renderer!: ReturnType<typeof create>;
	act(() => {
		renderer = create(<MessageVideo attachmentData={attachment} />);
	});
	act(() => renderer.root.findByType('img').props.onError());
	expect(renderer.root.findByType('img').props.src).toBe(`proxy:${attachment.thumbnail}`);
	act(() => renderer.unmount());
});

it('keeps remote-only pending videos gated until upload completes', () => {
	let renderer!: ReturnType<typeof create>;
	const remote = { ...attachment, local_source: undefined };
	act(() => {
		renderer = create(<MessageVideo attachmentData={remote} isPresignPending />);
	});
	expect(renderer.root.findAllByType('img')).toHaveLength(0);
	act(() => {
		renderer.update(<MessageVideo attachmentData={remote} />);
	});
	expect(renderer.root.findByType('img').props.src).toBe(`proxy:${remote.thumbnail}`);
	act(() => renderer.unmount());
});
