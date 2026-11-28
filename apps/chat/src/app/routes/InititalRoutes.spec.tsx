import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import InitialRoutes from './InititalRoutes';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByProps: (props: Record<string, unknown>) => TestInstance[] };
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: (callback: () => void) => void;
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

let mockIsLogin = false;

jest.mock('@mezon/store', () => ({ selectIsLogin: () => mockIsLogin }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../libs/utils/src/lib/utils/developerPortalRedirect')
	}),
	{ virtual: true }
);
jest.mock('react-redux', () => ({
	useSelector: (selector: (state: unknown) => unknown) => selector({})
}));
jest.mock('react-router-dom', () => ({
	Navigate: ({ to }: { to: string }) => <div data-navigate={to} />
}));
jest.mock('../layouts/OpenInDesktopAppPrompt', () => ({
	OpenInDesktopAppPage: () => <div data-desktop-prompt="true" />,
	landingDesktopAppLink: 'mezon://open'
}));

let replaceMock: jest.Mock;
let sessionStore: Map<string, string>;

const setLocation = (search: string) => {
	Object.defineProperty(globalThis, 'window', {
		value: {
			location: {
				pathname: '/login',
				search,
				hash: '',
				replace: replaceMock
			}
		},
		configurable: true,
		writable: true
	});
};

beforeEach(() => {
	mockIsLogin = false;
	replaceMock = jest.fn();
	sessionStore = new Map();
	process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL = 'https://oauth2.mezon.ai/oauth2/auth';
	process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID = 'client-1';
	process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI = 'https://mezon.ai/login/callback';
	process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE = 'code';
	process.env.NX_CHAT_APP_OAUTH2_SCOPE = 'openid';

	setLocation('');
	Object.defineProperty(globalThis, 'sessionStorage', {
		value: {
			getItem: (key: string) => sessionStore.get(key) ?? null,
			setItem: (key: string, value: string) => sessionStore.set(key, value),
			removeItem: (key: string) => sessionStore.delete(key)
		},
		configurable: true,
		writable: true
	});
});

describe('InitialRoutes', () => {
	it('saves developer return URL, skips desktop prompt, and redirects to OAuth2 when logged out', () => {
		setLocation('?redirect=%2Fdevelopers%2Fapplications');

		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<InitialRoutes />);
		});

		expect(sessionStore.get('mezon_post_login_redirect')).toBe('/developers/applications');
		expect(renderer.root.findAllByProps({ 'data-desktop-prompt': 'true' })).toHaveLength(0);
		expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('https://oauth2.mezon.ai/oauth2/auth?client_id=client-1'));
		renderer.unmount();
	});

	it('performs full-page redirect back to /developers when already logged in with developer redirect param', () => {
		mockIsLogin = true;
		setLocation('?redirect=%2Fdevelopers%2Fapplications%3Ftab%3D1');

		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<InitialRoutes />);
		});

		expect(replaceMock).toHaveBeenCalledWith('/developers/applications?tab=1');
		expect(renderer.root.findAllByProps({ 'data-navigate': '/chat/direct/friends' })).toHaveLength(0);
		renderer.unmount();
	});

	it('navigates to /chat/direct/friends when already logged in without developer redirect', () => {
		mockIsLogin = true;

		let renderer!: TestRenderer;
		act(() => {
			renderer = create(<InitialRoutes />);
		});

		expect(replaceMock).not.toHaveBeenCalled();
		expect(renderer.root.findAllByProps({ 'data-navigate': '/chat/direct/friends' })).toHaveLength(1);
		renderer.unmount();
	});
});
