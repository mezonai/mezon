import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import LoginCallback from './index';

type TestRenderer = { unmount: () => void };

const { act, create } = jest.requireActual<{
	act: { (callback: () => Promise<void>): Promise<void>; (callback: () => void): void };
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

let mockIsLogin = false;
let mockRedirectUrl: string | null = null;
let mockCode: string | null = 'auth-code';
const mockNavigate = jest.fn();
const mockSetRedirectUrl = jest.fn((value: string | null) => ({ type: 'auth/setRedirectUrl', payload: value }));
const mockAuthAction = {
	type: 'auth/authenticateMezon/fulfilled',
	payload: { token: 'new-jwt', refresh_token: 'new-refresh' }
};
const mockDispatch = jest.fn(async (action: { type?: string }) => {
	if (action?.type === 'auth/authenticateMezon') return mockAuthAction;
	return action;
});

jest.mock('@mezon/components', () => ({ FailLoginModal: () => null }), { virtual: true });
jest.mock('@mezon/core', () => ({ useAppNavigation: () => ({ navigate: mockNavigate }) }), { virtual: true });
jest.mock(
	'@mezon/store',
	() => {
		const authenticateMezon = Object.assign((code: string) => ({ type: 'auth/authenticateMezon', payload: code }), {
			fulfilled: { match: (action: { type?: string }) => action?.type === 'auth/authenticateMezon/fulfilled' },
			rejected: { match: (action: { type?: string }) => action?.type === 'auth/authenticateMezon/rejected' }
		});
		return {
			authActions: {
				authenticateMezon,
				setRedirectUrl: (value: string | null) => mockSetRedirectUrl(value)
			},
			selectAllAuth: () => ({ redirectUrl: mockRedirectUrl }),
			selectIsLogin: () => mockIsLogin,
			useAppDispatch: () => mockDispatch
		};
	},
	{ virtual: true }
);
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../../libs/utils/src/lib/utils/developerPortalRedirect')
	}),
	{ virtual: true }
);
jest.mock('react-modal-hook', () => ({ useModal: () => [jest.fn()] }), { virtual: true });
jest.mock('react-redux', () => ({ useSelector: (selector: (state: unknown) => unknown) => selector({}) }));
jest.mock('react-router-dom', () => ({
	useSearchParams: () => [{ get: (key: string) => (key === 'code' ? mockCode : null) }]
}));

let replaceMock: jest.Mock;
let localStore: Map<string, string>;
let sessionStore: Map<string, string>;

beforeEach(() => {
	mockIsLogin = false;
	mockRedirectUrl = null;
	mockCode = 'auth-code';
	mockNavigate.mockClear();
	mockSetRedirectUrl.mockClear();
	mockDispatch.mockClear();
	replaceMock = jest.fn();
	localStore = new Map();
	sessionStore = new Map();

	Object.defineProperty(globalThis, 'window', {
		value: { location: { replace: replaceMock } },
		configurable: true,
		writable: true
	});
	Object.defineProperty(globalThis, 'localStorage', {
		value: {
			getItem: (key: string) => localStore.get(key) ?? null,
			setItem: (key: string, value: string) => localStore.set(key, value)
		},
		configurable: true,
		writable: true
	});
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

describe('LoginCallback', () => {
	it('persists session and full-page redirects to saved developer portal path after OAuth login', async () => {
		sessionStore.set('mezon_post_login_redirect', '/developers/applications?tab=oauth');

		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(<LoginCallback />);
			await Promise.resolve();
		});

		const persisted = JSON.parse(localStore.get('persist:auth') ?? '{}');
		expect(persisted.isLogin).toBe('true');
		expect(JSON.parse(persisted.session)).toEqual(mockAuthAction.payload);
		expect(replaceMock).toHaveBeenCalledWith('/developers/applications?tab=oauth');
		expect(mockNavigate).not.toHaveBeenCalled();
		expect(sessionStore.has('mezon_post_login_redirect')).toBe(false);
		renderer.unmount();
	});

	it('navigates to /chat/direct/friends when no developer redirect was saved', async () => {
		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(<LoginCallback />);
			await Promise.resolve();
		});

		expect(replaceMock).not.toHaveBeenCalled();
		expect(mockNavigate).toHaveBeenCalledWith('/chat/direct/friends');
		renderer.unmount();
	});

	it('full-page redirects to saved developer portal path when already logged in', async () => {
		mockIsLogin = true;
		sessionStore.set('mezon_post_login_redirect', '/developers/dashboard');

		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(<LoginCallback />);
			await Promise.resolve();
		});

		expect(replaceMock).toHaveBeenCalledWith('/developers/dashboard');
		expect(mockNavigate).not.toHaveBeenCalled();
		renderer.unmount();
	});
});
