import type { MezonContextValue } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { Client, Session } from 'mezon-js';
import type { ApiFriend } from 'mezon-js/api.gen';
import type { IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import type { GetThunkAPIWithMezon } from './typings';

export const getMezonCtx = (thunkAPI: GetThunkAPI<unknown>) => {
	if (!isMezonThunk(thunkAPI)) {
		throw new Error('Not Mezon Thunk');
	}
	return thunkAPI.extra.mezon;
};

export type MezonValueContext = MezonContextValue & {
	client: Client;
	session: Session;
	zkClient: ZkClient | null;
	mmnClient: MmnClient | null;
	indexerClient: IndexerClient | null;
	getLatestSession: () => Session | null;
};

export async function ensureSession(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (mezon?.clientRef?.current && mezon?.sessionRef?.current) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
}

export async function ensureSocket(mezon: MezonContextValue): Promise<MezonValueContext> {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (mezon.socketRef.current && (mezon.socketRef.current as any).adapter && (mezon.socketRef.current as any).adapter.isOpen()) {
				clearInterval(interval);
				resolve(ensureClient(mezon));
			}
		}, 100);
	});
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
}

let sharedConnectionCheckPromise: Promise<boolean> | null = null;
let lastConnectionCheckTime = 0;
const CONNECTION_CHECK_CACHE_MS = 2000;

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

async function checkInternetConnectionCached(): Promise<boolean> {
	const now = Date.now();

	if (now - lastConnectionCheckTime < CONNECTION_CHECK_CACHE_MS) {
		if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') {
			return navigator.onLine;
		}
	}

	if (sharedConnectionCheckPromise) {
		return sharedConnectionCheckPromise;
	}

	sharedConnectionCheckPromise = (async () => {
		try {
			const response = await fetch(`${window.origin}/assets/favicon.ico`, {
				method: 'HEAD',
				cache: 'no-cache',
				signal: AbortSignal.timeout(5000)
			});
			lastConnectionCheckTime = Date.now();
			return response.ok;
		} catch {
			lastConnectionCheckTime = Date.now();
			return false;
		} finally {
			setTimeout(() => {
				sharedConnectionCheckPromise = null;
			}, 100);
		}
	})();

	return sharedConnectionCheckPromise;
}

type RequiredRetryConfig = Required<Omit<RetryConfig, 'signal' | 'scope' | 'mezon'>>;

const DEFAULT_RETRY_CONFIG: RequiredRetryConfig = {
	maxRetries: 3,
	initialDelay: 1000,
	maxDelay: 10000,
	backoffMultiplier: 2,
	useExponentialBackoff: true,
	timeout: 30000,
	checkOnlineStatus: true,
	shouldRetry: (error: RetryableError) => {
		if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error')) {
			return true;
		}
		if (error?.status && error.status >= 500 && error.status < 600) {
			return true;
		}
		const transientErrorPatterns = ['timeout', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'socket hang up', 'Failed to fetch'];
		const errorMessage = String(error?.message || '').toLowerCase();
		return transientErrorPatterns.some((pattern) => errorMessage.includes(pattern.toLowerCase()));
	},
	onRetry: () => {
		// Default: no-op
	}
};

function calculateRetryDelay(attemptNumber: number, config: RequiredRetryConfig): number {
	if (!config.useExponentialBackoff) {
		return config.initialDelay;
	}

	const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
	const jitter = Math.random() * 0.3 * exponentialDelay;
	return Math.min(exponentialDelay + jitter, config.maxDelay);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs))
	]);
}

export async function withRetry<T>(fn: (() => Promise<T>) | ((session: Session) => Promise<T>), config: RetryConfig = {}): Promise<T> {
	const mergedConfig: RequiredRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
	let lastError: RetryableError | undefined;

	const scopeController = createScopeAbortController(config.scope);
	const signal = config.signal || scopeController?.signal;

	if (signal?.aborted) {
		throw new Error('Request cancelled');
	}

	const executeCall = (): Promise<T> => {
		if (config.mezon) {
			const latestSession = config.mezon.getLatestSession();
			if (!latestSession) {
				throw new Error('No session available');
			}
			return (fn as (session: Session) => Promise<T>)(latestSession);
		}
		return (fn as () => Promise<T>)();
	};

	try {
		for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
			if (signal?.aborted) {
				throw new Error('Request cancelled');
			}

			try {
				const result = await withTimeout(executeCall(), mergedConfig.timeout);

				if (config.scope && scopeController) {
					activeScopeControllers.delete(config.scope);
				}

				return result;
			} catch (error) {
				if (signal?.aborted) {
					throw new Error('Request cancelled');
				}

				const retryableError = error as RetryableError;
				lastError = retryableError;

				if (attempt >= mergedConfig.maxRetries) {
					break;
				}

				if (!mergedConfig.shouldRetry(retryableError, attempt + 1)) {
					throw error;
				}

				let delay = calculateRetryDelay(attempt + 1, mergedConfig);

				if (mergedConfig.checkOnlineStatus) {
					const hasConnection = await checkInternetConnectionCached();
					if (!hasConnection) {
						delay = Math.min(5000, mergedConfig.maxDelay);
					}
				}

				mergedConfig.onRetry(retryableError, attempt + 1, delay);

				await Promise.race([
					sleep(delay),
					new Promise((_, reject) => {
						if (signal) {
							signal.addEventListener('abort', () => reject(new Error('Request cancelled')), { once: true });
						}
					})
				]);
			}
		}
	} finally {
		if (config.scope && scopeController) {
			activeScopeControllers.delete(config.scope);
		}
	}

	throw lastError || new Error('All retries failed');
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
	restApiFallback: (session: Session) => Promise<T>,
	responseKey?: string,
	retryConfig?: RetryConfig
): Promise<T> {
	const socket = mezon.socketRef?.current;
	let response: T | undefined;

	if (socket?.isOpen()) {
		try {
			const data = await socket.listDataSocket(socketRequest);

			if (socketRequest.api_name === 'ListFriends') {
				if (responseKey && data?.[responseKey]?.friends) {
					data[responseKey].friends = data[responseKey]?.friends?.map((item: ApiFriend) => ({
						...item
					}));
				}

				// refactor later
			}

			if (socketRequest.api_name === 'ListClanUsers') {
				if (responseKey && data?.[responseKey]?.clan_users) {
					data[responseKey].clan_users = data[responseKey]?.clan_users?.map((item: ApiFriend) => ({
						...item
					}));
				}

				// refactor later
			}

			response = responseKey ? data?.[responseKey] : data;

			// if (socketRequest.api_name === 'ListClanDescs') {
			// }
		} catch (err) {
			console.error(err, socketRequest);
			// ignore socket errors and fallback to REST API
		}
	}

	if (!response) {
		response = await withRetry(restApiFallback, { ...retryConfig, scope: socketRequest.api_name, mezon });
	}
	return response;
}
