import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';
import AdminGate from './AdminGate';

type TestInstance = { type: unknown; props: Record<string, unknown> };
type TestRenderer = {
	root: { findAllByType: (type: string) => TestInstance[] };
	unmount: () => void;
};

const { act, create } = jest.requireActual<{
	act: { (callback: () => Promise<void>): Promise<void>; (callback: () => void): void };
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

let mockSession: { token: string; refresh_token: string } | null = null;
let mockEnsurePromise: () => Promise<unknown> = async () => ({ token: 'ok' });
const mockResetSession = jest.fn(() => ({ type: 'auth/resetSession' }));
const mockDispatch = jest.fn((action: { type?: string }) => {
	if (action?.type === 'auth/ensureAdminSession') {
		return { unwrap: () => mockEnsurePromise() };
	}
	return action;
});

jest.mock(
	'@mezon/store',
	() => ({
		authActions: {
			resetSession: () => mockResetSession()
		},
		ensureAdminSession: () => ({ type: 'auth/ensureAdminSession' }),
		isAdminSessionExpiredError: (error: unknown) =>
			Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AdminSessionExpiredError'),
		selectAllSession: () => mockSession,
		useAppDispatch: () => mockDispatch
	}),
	{ virtual: true }
);
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

let replaceMock: jest.Mock;
let localStore: Map<string, string>;
let sessionStore: Map<string, string>;

beforeEach(() => {
	mockSession = { token: 'tok', refresh_token: 'ref' };
	mockEnsurePromise = async () => ({ token: 'tok' });
	mockResetSession.mockClear();
	mockDispatch.mockClear();
	replaceMock = jest.fn();
	localStore = new Map([['persist:auth', JSON.stringify({ session: '{"token":"tok"}', isLogin: 'true' })]]);
	sessionStore = new Map();
	process.env.NX_CHAT_APP_REDIRECT_URI = 'https://mezon.ai';

	Object.defineProperty(globalThis, 'window', {
		value: {
			location: {
				origin: 'https://mezon.ai',
				pathname: '/developers/applications',
				search: '?tab=oauth',
				hash: '#top',
				replace: replaceMock
			}
		},
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

afterEach(() => {
	delete process.env.NX_CHAT_APP_REDIRECT_URI;
});

describe('AdminGate', () => {
	it('renders children when session is valid without redirecting', async () => {
		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(
				<AdminGate>
					<main>Portal</main>
				</AdminGate>
			);
			await Promise.resolve();
		});

		expect(renderer.root.findAllByType('main')).toHaveLength(1);
		expect(replaceMock).not.toHaveBeenCalled();
		renderer.unmount();
	});

	it('clears stale persisted auth, preserves return URL, and redirects to login when session is expired', async () => {
		mockEnsurePromise = async () => {
			const error = new Error('Your session has expired. Please sign in again.');
			error.name = 'AdminSessionExpiredError';
			throw error;
		};

		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(
				<AdminGate>
					<main>Portal</main>
				</AdminGate>
			);
			await Promise.resolve();
		});

		expect(mockResetSession).toHaveBeenCalledTimes(1);
		expect(JSON.parse(localStore.get('persist:auth') ?? '{}')).toEqual({ session: 'null', isLogin: 'false' });
		expect(sessionStore.get('mezon_post_login_redirect')).toBe('/developers/applications?tab=oauth#top');
		expect(replaceMock).toHaveBeenCalledWith('https://mezon.ai/login?redirect=%2Fdevelopers%2Fapplications%3Ftab%3Doauth%23top');
		renderer.unmount();
	});

	it('shows retry UI without clearing session or redirecting on transient errors', async () => {
		let attempt = 0;
		mockEnsurePromise = async () => {
			attempt += 1;
			if (attempt === 1) throw new Error('SessionRefresh HTTP 503');
			return { token: 'tok' };
		};

		let renderer!: TestRenderer;
		await act(async () => {
			renderer = create(
				<AdminGate>
					<main>Portal</main>
				</AdminGate>
			);
			await Promise.resolve();
		});

		expect(replaceMock).not.toHaveBeenCalled();
		expect(mockResetSession).not.toHaveBeenCalled();
		expect(JSON.parse(localStore.get('persist:auth') ?? '{}').isLogin).toBe('true');

		const button = renderer.root.findAllByType('button')[0];
		await act(async () => {
			(button.props.onClick as () => void)();
			await Promise.resolve();
		});

		expect(renderer.root.findAllByType('main')).toHaveLength(1);
		expect(replaceMock).not.toHaveBeenCalled();
		renderer.unmount();
	});
});
