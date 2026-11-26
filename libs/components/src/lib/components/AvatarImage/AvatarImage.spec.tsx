import { describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import { AvatarImage } from './AvatarImage';

type TestInstance = { type: unknown; props: Record<string, unknown> & { onError?: () => void } };
type Query = {
	findAllByType: (type: string) => TestInstance[];
	findAll: (predicate: (node: TestInstance) => boolean) => TestInstance[];
};
type TestRenderer = { root: Query; update: (element: ReactElement) => void; unmount: () => void };
const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

jest.mock(
	'@mezon/ui',
	() => ({
		MezonIcon: ({ icon }: { icon: string }) => `icon:${icon}`,
		MzIcons20: { mzUserCircle: 'mzUserCircle' },
		MzIcons24: { mzUser: 'mzUser' },
		MzIcons32: { mzAnonymous: 'mzAnonymous' }
	}),
	{ virtual: true }
);
jest.mock('@mezon/utils', () => ({ generateE2eId: (id: string) => id }), { virtual: true });

const PROXY = 'https://imgproxy.example/avatar.png@webp';
const RAW = 'https://cdn.example/avatar.png';

const render = (element: ReactElement) => {
	let renderer: TestRenderer | undefined;
	act(() => {
		renderer = create(element);
	});
	return renderer as TestRenderer;
};

const images = (renderer: TestRenderer) => renderer.root.findAllByType('img');
const placeholders = (renderer: TestRenderer) =>
	renderer.root.findAll((node) => node.type === 'div' && String(node.props.className ?? '').includes('bg-bgDisable'));
const fail = (renderer: TestRenderer) => {
	const [img] = images(renderer);
	act(() => {
		img.props.onError?.();
	});
};

describe('AvatarImage', () => {
	it('retries the original url when the proxied avatar fails', () => {
		const renderer = render(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={PROXY} />);
		expect(images(renderer)[0].props.src).toBe(PROXY);

		fail(renderer);

		expect(images(renderer)).toHaveLength(1);
		expect(images(renderer)[0].props.src).toBe(RAW);
		expect(placeholders(renderer)).toHaveLength(0);
	});

	it('shows the default avatar when the original url fails too', () => {
		const renderer = render(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={PROXY} />);

		fail(renderer);
		fail(renderer);

		expect(images(renderer)).toHaveLength(0);
		expect(placeholders(renderer)).toHaveLength(1);
	});

	it('shows the default avatar when an unproxied avatar url fails', () => {
		const renderer = render(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={RAW} />);

		fail(renderer);

		expect(images(renderer)).toHaveLength(0);
		expect(placeholders(renderer)).toHaveLength(1);
	});

	it('loads the proxied url of a new avatar after the previous one failed', () => {
		const renderer = render(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={PROXY} />);
		fail(renderer);
		fail(renderer);

		const next = 'https://cdn.example/new-avatar.png';
		act(() => {
			renderer.update(<AvatarImage alt="bot" username="komu" src={next} srcImgProxy={`${next}@webp`} />);
		});

		expect(images(renderer)).toHaveLength(1);
		expect(images(renderer)[0].props.src).toBe(`${next}@webp`);
	});

	it('does not refetch an avatar url that already failed when the same props come back', () => {
		const renderer = render(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={RAW} />);
		fail(renderer);

		act(() => {
			renderer.update(<AvatarImage alt="bot" username="komu" src={RAW} srcImgProxy={RAW} />);
		});

		expect(images(renderer)).toHaveLength(0);
		expect(placeholders(renderer)).toHaveLength(1);
	});

	it('keeps the anonymous avatar for anonymous senders without an avatar', () => {
		const renderer = render(<AvatarImage alt="anonymous" isAnonymous src="" srcImgProxy="" />);

		expect(images(renderer)).toHaveLength(0);
		expect(placeholders(renderer)).toHaveLength(0);
		expect(renderer.root.findAll((node) => node.props.icon === 'mzAnonymous')).toHaveLength(1);
	});
});
