import type { MezonContextValue } from '@mezon/transport';
import { isOnline, socketState } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { ApiSession, Client } from 'mezon-js';
import type { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import type { GetThunkAPIWithMezon } from './typings';

export { socketState };

export const getMezonCtx = (thunkAPI: GetThunkAPI<unknown>) => {
	if (!isMezonThunk(thunkAPI)) {
		throw new Error('Not Mezon Thunk');
	}
	return thunkAPI.extra.mezon;
};

export type MezonValueContext = MezonContextValue & {
	client: Client;
	session: ApiSession;
	zkClient: ZkClient | null;
	mmnClient: MmnClient | null;
	dongClient: DongClient | null;
	indexerClient: IndexerClient | null;
	getLatestSession: () => ApiSession | null;
};

const SESSION_TRANSPORT_TIMEOUT_MS = 60000;

export function sessionHasCredentials(s: ApiSession | null | undefined, options?: { requireSessionId?: boolean }): boolean {
	if (!s) return false;
	const token = !!s.token?.trim();
	const sid = !!s.session_id?.trim();
	const refreshToken = !!s.refresh_token?.trim();
	if (!token && !sid) return false;
	if (options?.requireSessionId === false) {
		return token && refreshToken;
	}
	if (token && !sid) return false;
	return true;
}

async function awaitMezonClient(mezon: MezonContextValue, deadline: number): Promise<void> {
	while (!mezon.clientRef?.current) {
		if (Date.now() > deadline) {
			throw new Error('Timed out waiting for Mezon client');
		}
		await sleep(100);
	}
}

export async function ensureSession(mezon: MezonContextValue): Promise<MezonValueContext> {
	const deadline = Date.now() + SESSION_TRANSPORT_TIMEOUT_MS;
	await awaitMezonClient(mezon, deadline);
	return ensureClient(mezon);
}

const SOCKET_READY_TIMEOUT_MS = 60000;

export async function ensureSocket(mezon: MezonContextValue): Promise<MezonValueContext> {
	const deadline = Date.now() + SOCKET_READY_TIMEOUT_MS;
	await awaitMezonClient(mezon, deadline);

	const client = mezon.clientRef.current as Client;

	let waitIterations = 0;
	while (typeof client.isOpen !== 'function' || !client.isOpen()) {
		waitIterations += 1;
		if (Date.now() > deadline) {
			throw new Error('Socket connection has not been established yet.');
		}
		await sleep(100);
	}
	return ensureClient(mezon);
}

export async function ensureClientAsync(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (mezon?.clientRef?.current) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
}

export function ensureClient(mezon: MezonContextValue): MezonValueContext {
	if (!mezon?.clientRef?.current) {
		throw new Error('Error');
	}

	return {
		...mezon,
		client: mezon?.clientRef?.current,
		session: mezon.sessionRef.current,
		zkClient: mezon.zkRef.current,
		mmnClient: mezon.mmnRef?.current || null,
		dongClient: mezon.dongRef?.current || null,
		indexerClient: mezon.indexerRef?.current || null,
		getLatestSession: () => mezon.sessionRef.current
	} as MezonValueContext;
}

export function isMezonThunk(thunkAPI: GetThunkAPI<unknown>): thunkAPI is GetThunkAPIWithMezon {
	if (thunkAPI === undefined || thunkAPI.extra === undefined) {
		return false;
	}
	if ('extra' in thunkAPI === false || typeof thunkAPI.extra !== 'object' || thunkAPI.extra === null) {
		return false;
	}
	if ('mezon' in thunkAPI.extra === false) {
		return false;
	}
	return typeof thunkAPI?.extra?.mezon !== 'undefined';
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryableError {
	code?: string;
	status?: number;
	message?: string;
}

export interface RetryConfig {
	maxRetries?: number;
	initialDelay?: number;
	maxDelay?: number;
	backoffMultiplier?: number;
	useExponentialBackoff?: boolean;
	timeout?: number;
	checkOnlineStatus?: boolean;
	shouldRetry?: (error: RetryableError, attemptNumber: number) => boolean;
	onRetry?: (error: RetryableError, attemptNumber: number, nextDelay: number) => void;
	signal?: AbortSignal;
	scope?: string;
	mezon?: MezonValueContext;
	requireMezonSocket?: boolean;
}

const activeScopeControllers = new Map<string, AbortController>();

export function cancelPreviousRequestsInScope(scope: string): void {
	const existingController = activeScopeControllers.get(scope);
	if (existingController) {
		existingController.abort();
		activeScopeControllers.delete(scope);
	}
}

export function createScopeAbortController(scope?: string): AbortController | undefined {
	if (!scope) return undefined;

	cancelPreviousRequestsInScope(scope);

	const controller = new AbortController();
	activeScopeControllers.set(scope, controller);

	return controller;
}

export function checkInternetConnectionCached(): boolean {
	return isOnline();
}

export function isMezonClientSocketOpen(mezon: MezonValueContext): boolean {
	return socketState.isConnected;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs))
	]);
}

export async function withRetry<T>(fn: (() => Promise<T>) | ((session: ApiSession) => Promise<T>), config: RetryConfig = {}): Promise<T> {
	const timeoutMs = config.timeout ?? 30000;
	const mezonCtx = config.mezon;
	const enforceMezonSocket = !!mezonCtx && config.requireMezonSocket !== false && mezonCtx.requireSocket !== false;

	const scopeController = createScopeAbortController(config.scope);
	const signal = config.signal || scopeController?.signal;

	if (signal?.aborted) {
		throw new Error('Request cancelled');
	}

	const executeCall = (): Promise<T> => {
		if (config.mezon) {
			const latestSession = config.mezon.sessionRef.current;
			const requireSessionId = config.mezon.requireSocket !== false;
			if (!sessionHasCredentials(latestSession, { requireSessionId })) {
				throw new Error('Mezon API called without session credentials');
			}
			return (fn as (session: ApiSession) => Promise<T>)(latestSession as ApiSession);
		}
		return (fn as () => Promise<T>)();
	};

	try {
		if (signal?.aborted) {
			throw new Error('Request cancelled');
		}

		if (enforceMezonSocket && mezonCtx && !isMezonClientSocketOpen(mezonCtx)) {
			throw new Error('Socket connection has not been established yet.');
		}

		return await withTimeout(executeCall(), timeoutMs);
	} finally {
		if (config.scope && scopeController) {
			activeScopeControllers.delete(config.scope);
		}
	}
}

export const restoreLocalStorage = (keys: string[]) => {
	const data: Record<string, string | null> = {};
	keys.forEach((key) => {
		data[key] = localStorage.getItem(key);
	});
	localStorage.clear();
	keys.forEach((key) => {
		if (data[key]) {
			localStorage.setItem(key, data[key]!);
		}
	});
};

export interface SocketDataRequest {
	api_name: string;
	[key: string]: unknown;
}

export async function fetchDataWithSocketFallback<T>(
	mezon: MezonValueContext,
	socketRequest: SocketDataRequest,
	restApiFallback: (session: ApiSession) => Promise<T>,
	_responseKey?: string
): Promise<T> {
	const scope = socketRequest.api_name;
	const scopeController = createScopeAbortController(scope);
	const signal = scopeController?.signal;

	if (signal?.aborted) {
		throw new Error('Request cancelled');
	}

	try {
		const latestSession = mezon.sessionRef.current;
		const requireSessionId = mezon.requireSocket !== false;
		if (!sessionHasCredentials(latestSession, { requireSessionId })) {
			throw new Error('Mezon API called without session credentials');
		}
		if (mezon.requireSocket !== false && !isMezonClientSocketOpen(mezon)) {
			throw new Error('Socket connection not open.');
		}
		if (signal?.aborted) {
			throw new Error('Request cancelled');
		}
		return await restApiFallback(latestSession as ApiSession);
	} finally {
		if (scope && scopeController) {
			activeScopeControllers.delete(scope);
		}
	}
}
