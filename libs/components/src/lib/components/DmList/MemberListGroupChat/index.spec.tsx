import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement, ReactNode } from 'react';
import { BaseMemberProfile } from '../../MemberProfile/MemberProfile';
import MemberListGroupChat from './index';

type ImgElement = { type: string; props: { src?: string } };
type RenderResult = {
	root: { findAllByType: (type: string) => ImgElement[] };
	unmount: () => void;
};

const { create } = jest.requireActual<{
	create: (element: ReactElement) => RenderResult;
}>('react-test-renderer');

type MockMemberRow = {
	id: string;
	user: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string;
		pro_plan?: boolean;
	};
};

type MockStoreState = {
	account: {
		userProfile?: {
			pro_plan?: boolean;
			user?: { id?: string; pro_plan?: boolean };
		};
	};
	usersClan: {
		byClans: Record<
			string,
			{
				entities?: {
					entities?: Record<string, { user?: { pro_plan?: boolean } }>;
				};
			}
		>;
	};
	decorations: {
		frames: Record<string, number | undefined>;
	};
	clans: { currentClanId: string };
	groupMembers: MockMemberRow[];
};

let mockStoreState: MockStoreState = {
	account: {},
	usersClan: { byClans: {} },
	decorations: { frames: {} },
	clans: { currentClanId: 'clan-1' },
	groupMembers: []
};

jest.mock(
	'@mezon/core',
	() => ({
		useAppParams: () => ({ directId: 'dm-group-1' }),
		useAuth: () => ({ userId: 'self-user-1' }),
		useColorsRoleById: () => ({ highestPermissionRoleColor: '' }),
		useMemberStatus: () => ({ online: true, status: 'Online', user_status: '' })
	}),
	{ virtual: true }
);

jest.mock(
	'@mezon/store',
	() => ({
		selectAccountCustomStatus: () => '',
		selectCurrentChannelId: () => '',
		selectCurrentDmChannelId: () => 'dm-group-1',
		selectIsProUser: (state: MockStoreState, userId?: string) => {
			if (!userId) return false;
			const accountProfile = state.account?.userProfile;
			if (accountProfile?.user?.id === userId) {
				return Boolean(accountProfile.pro_plan || accountProfile.user?.pro_plan);
			}
			const byClans = state.usersClan?.byClans;
			if (!byClans) return false;
			const currentClanId = state.clans?.currentClanId;
			if (currentClanId) {
				const currentPro = byClans[currentClanId]?.entities?.entities?.[userId]?.user?.pro_plan;
				if (currentPro !== undefined) return Boolean(currentPro);
			}
			for (const clanId of Object.keys(byClans)) {
				if (byClans[clanId]?.entities?.entities?.[userId]?.user?.pro_plan) return true;
			}
			return false;
		},
		selectMemberByGroupId: (state: MockStoreState) => state.groupMembers,
		selectTheme: () => 'dark',
		selectUserDecorationFrame: (state: MockStoreState, userId?: string) => (userId ? state.decorations?.frames?.[userId] : undefined),
		useAppSelector: (selector: (state: MockStoreState) => unknown) => selector(mockStoreState)
	}),
	{ virtual: true }
);

jest.mock('@mezon/ui', () => ({ MezonIcon: () => null, MzIcons16: { mzOwner: 'owner' } }), { virtual: true });

jest.mock(
	'@mezon/utils',
	() => {
		const frames = jest.requireActual<Record<string, unknown>>('../../../../../../utils/src/lib/utils/avatarFrames');
		return {
			...frames,
			EUserStatus: { ONLINE: 'Online', INVISIBLE: 'Invisible' },
			createImgproxyUrl: (url: string) => url,
			generateE2eId: (id: string) => id
		};
	},
	{ virtual: true }
);

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('react-redux', () => {
	const actual = jest.requireActual<Record<string, unknown>>('react-redux');
	return {
		...actual,
		useSelector: (selector: (state: MockStoreState) => unknown) => selector(mockStoreState)
	};
});

jest.mock('../../../contexts', () => ({
	MemberContextMenuProvider: ({ children }: { children: ReactNode }) => children,
	useDirectMessageContextMenu: () => ({
		showContextMenu: jest.fn(),
		setCurrentUser: jest.fn(),
		openProfileItem: jest.fn()
	})
}));

jest.mock('../../../components', () => ({
	AvatarImage: () => null
}));

jest.mock('../../MemberProfile/IconStatus', () => ({
	UserStatusIconClan: () => null
}));

const PEER_ID = '1775731111020111872';

const getFrameImages = (rendered: RenderResult) =>
	rendered.root.findAllByType('img').filter((img) => img.props.src?.includes('/assets/images/avatar-frames/'));

describe('MemberListGroupChat user decoration resolution', () => {
	beforeEach(() => {
		mockStoreState = {
			account: {},
			usersClan: { byClans: {} },
			decorations: { frames: {} },
			clans: { currentClanId: 'clan-1' },
			groupMembers: []
		};
	});

	it('renders no frame image for a Pro group member whose decoration frame is -1 even though the DM row lacks pro_plan', () => {
		mockStoreState = {
			account: {},
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								[PEER_ID]: { user: { pro_plan: true } }
							}
						}
					}
				}
			},
			decorations: { frames: { [PEER_ID]: -1 } },
			clans: { currentClanId: 'clan-1' },
			groupMembers: [
				{
					id: PEER_ID,
					user: {
						id: PEER_ID,
						username: 'alice',
						display_name: 'Alice',
						avatar_url: 'https://cdn/avt.png'
					}
				}
			]
		};

		const r = create(<MemberListGroupChat directMessageId="dm-group-1" />);
		expect(getFrameImages(r)).toHaveLength(0);
		r.unmount();
	});

	it('renders the chosen frame for a Pro group member whose decoration frame is 5 even though the DM row lacks pro_plan', () => {
		mockStoreState = {
			account: {},
			usersClan: {
				byClans: {
					'clan-1': {
						entities: {
							entities: {
								[PEER_ID]: { user: { pro_plan: true } }
							}
						}
					}
				}
			},
			decorations: { frames: { [PEER_ID]: 5 } },
			clans: { currentClanId: 'clan-1' },
			groupMembers: [
				{
					id: PEER_ID,
					user: {
						id: PEER_ID,
						username: 'alice',
						display_name: 'Alice',
						avatar_url: 'https://cdn/avt.png'
					}
				}
			]
		};

		const r = create(<MemberListGroupChat directMessageId="dm-group-1" />);
		const imgs = getFrameImages(r);
		expect(imgs).toHaveLength(1);
		expect(imgs[0].props.src).toBe('/assets/images/avatar-frames/tech_1.png');
		r.unmount();
	});

	it('reads BaseMemberProfile frame from decorations slice and lets explicit frame prop override it', () => {
		mockStoreState.decorations.frames[PEER_ID] = 5;

		const storeReadRender = create(
			<BaseMemberProfile
				id={PEER_ID}
				user={
					{
						id: PEER_ID,
						user: { id: PEER_ID, username: 'alice', pro_plan: true }
					} as never
				}
				avatar="https://cdn/avt.png"
				username="Alice"
				userMeta={{ online: true }}
				isPro
				onContextMenu={jest.fn()}
				onClick={jest.fn()}
			/>
		);
		const imgs = getFrameImages(storeReadRender);
		expect(imgs).toHaveLength(1);
		expect(imgs[0].props.src).toBe('/assets/images/avatar-frames/tech_1.png');
		storeReadRender.unmount();

		const hiddenPropRender = create(
			<BaseMemberProfile
				id={PEER_ID}
				user={
					{
						id: PEER_ID,
						user: { id: PEER_ID, username: 'alice', pro_plan: true }
					} as never
				}
				avatar="https://cdn/avt.png"
				username="Alice"
				userMeta={{ online: true }}
				isPro
				frame={-1}
				onContextMenu={jest.fn()}
				onClick={jest.fn()}
			/>
		);
		expect(getFrameImages(hiddenPropRender)).toHaveLength(0);
		hiddenPropRender.unmount();
	});
});
