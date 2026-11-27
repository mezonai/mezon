import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import AvatarProfile from './AvatarProfile';

type ImgElement = { type: string; props: { src?: string } };
type RenderResult = {
	root: { findAllByType: (type: string) => ImgElement[] };
	unmount: () => void;
};

const { create } = jest.requireActual<{
	create: (element: ReactElement) => RenderResult;
}>('react-test-renderer');

let mockStoreState: { decorations: { frames: Record<string, number | undefined> } } = { decorations: { frames: {} } };
const mockSelectUserDecorationFrame = jest.fn((state: { decorations: { frames: Record<string, number | undefined> } }, userId?: string) =>
	userId ? state.decorations.frames[userId] : undefined
);

jest.mock(
	'@mezon/store',
	() => ({
		channelMembersActions: {},
		selectCurrentClanId: () => 'clan-1',
		selectUserDecorationFrame: (state: { decorations: { frames: Record<string, number | undefined> } }, userId?: string) =>
			mockSelectUserDecorationFrame(state, userId),
		useAppDispatch: () => jest.fn(),
		useAppSelector: (selector: (state: { decorations: { frames: Record<string, number | undefined> } }) => unknown) => selector(mockStoreState),
		userClanProfileActions: {}
	}),
	{ virtual: true }
);
jest.mock('@mezon/ui', () => ({ MezonIcon: () => null, MzIcons16: { mzEdit: 'edit', mzTrash: 'trash' } }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => {
		const frames = jest.requireActual<Record<string, unknown>>('../../../../../utils/src/lib/utils/avatarFrames');
		return {
			...frames,
			ActivitiesType: { VISUAL_STUDIO_CODE: 1, SPOTIFY: 2, LOL: 3 },
			createImgproxyUrl: (url: string) => url,
			generateE2eId: (id: string) => id
		};
	},
	{ virtual: true }
);
jest.mock('react-redux', () => ({ useSelector: (selector: () => unknown) => selector() }));
jest.mock('../AvatarImage/AvatarImage', () => ({ AvatarImage: () => null }));
jest.mock('../MemberProfile/IconStatus', () => ({ UserStatusIcon: () => null }));

const USER_ID = '1775731111020111872';

const renderAvatarProfile = (frameProp?: number, isPro = true) =>
	create(<AvatarProfile avatar="https://cdn/avt.png" username="alice" userToDisplay={null} userID={USER_ID} isPro={isPro} frame={frameProp} />);

const getFrameImages = (rendered: RenderResult) =>
	rendered.root.findAllByType('img').filter((img) => img.props.src?.includes('/assets/images/avatar-frames/'));

describe('AvatarProfile frame rendering', () => {
	beforeEach(() => {
		mockStoreState = { decorations: { frames: {} } };
		mockSelectUserDecorationFrame.mockClear();
	});

	it('renders no frame image when a Pro user has stored frame -1', () => {
		mockStoreState = { decorations: { frames: { [USER_ID]: -1 } } };
		const r = renderAvatarProfile();
		expect(mockSelectUserDecorationFrame).toHaveBeenCalledWith(mockStoreState, USER_ID);
		expect(getFrameImages(r)).toHaveLength(0);
		r.unmount();
	});

	it('renders no frame image when draft frame prop overrides a stored frame with -1 without calling selector', () => {
		mockStoreState = { decorations: { frames: { [USER_ID]: 5 } } };
		const r = renderAvatarProfile(-1);
		expect(mockSelectUserDecorationFrame).not.toHaveBeenCalled();
		expect(getFrameImages(r)).toHaveLength(0);
		r.unmount();
	});

	it('renders the automatic frame when stored frame is 0 or unfetched', () => {
		mockStoreState = { decorations: { frames: { [USER_ID]: 0 } } };
		const r = renderAvatarProfile();
		const imgs = getFrameImages(r);
		expect(imgs).toHaveLength(1);
		expect(imgs[0].props.src).toBe('/assets/images/avatar-frames/mascot_2.webp');
		r.unmount();

		mockStoreState = { decorations: { frames: {} } };
		const unfetched = renderAvatarProfile();
		const unfetchedImgs = getFrameImages(unfetched);
		expect(unfetchedImgs).toHaveLength(1);
		expect(unfetchedImgs[0].props.src).toBe('/assets/images/avatar-frames/mascot_2.webp');
		unfetched.unmount();
	});

	it('renders the chosen frame when stored frame is 5', () => {
		mockStoreState = { decorations: { frames: { [USER_ID]: 5 } } };
		const r = renderAvatarProfile();
		const imgs = getFrameImages(r);
		expect(imgs).toHaveLength(1);
		expect(imgs[0].props.src).toBe('/assets/images/avatar-frames/tech_1.webp');
		r.unmount();
	});

	it('renders no frame image when the user is not Pro even if frame is 5', () => {
		mockStoreState = { decorations: { frames: { [USER_ID]: 5 } } };
		const r = renderAvatarProfile(undefined, false);
		expect(getFrameImages(r)).toHaveLength(0);
		r.unmount();
	});
});
