import type { ApiSession, Client } from 'mezon-js';
import type { MutableRefObject } from 'react';
import { firstValueFrom, timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { waitForOnline$ } from './network';
import { socketState } from './socketState';

const MAX_WEBSOCKET_FAILS = 6;
const MIN_WEBSOCKET_RETRY_TIME = 1000;
const MAX_WEBSOCKET_RETRY_TIME = 30000;
const JITTER_RANGE = 1000;
const FAST_RETRY_ATTEMPTS = 5;

let connectInFlight: Promise<ApiSession | null> | null = null;
let reconnectInFlight = false;

export function resetMezonSocketReconnectInFlight(): void {
	reconnectInFlight = false;
}

export function resetMezonConnectInFlight(): void {
	connectInFlight = null;
}

const waitForNetworkAndDelay = (delayMs: number): Promise<void> => {
	return firstValueFrom(
		waitForOnline$().pipe(
			switchMap(() => timer(delayMs)),
			take(1)
		)
	).then(() => undefined);
};

export type ReconnectMezonSocketResult = void | null | 'RECONNECTING';

export type ConnectMezonSocketOptions = {
	client: Client;
	sessionRef: MutableRefObject<ApiSession | null>;
	resolveWsUrl: (session: Pick<ApiSession, 'ws_url'>) => string;
	persistSession?: (effectiveSession: ApiSession) => void;
	onSessionRefreshed?: (sessionNew: ApiSession, effectiveSession: ApiSession) => void;
	createStatus?: boolean;
	verbose?: boolean;
};


export function connectMezonSocketOnce(opts: ConnectMezonSocketOptions): Promise<ApiSession | null> {
	const { client, sessionRef } = opts;

	if (!sessionRef.current) {
		return Promise.resolve(null);
	}

	if (client.isOpen?.()) {
		return Promise.resolve(sessionRef.current);
	}

	if (connectInFlight) {
		return connectInFlight;
	}

	connectInFlight = (async () => {
		const sr = sessionRef.current as ApiSession;
		const wsUrl = opts.resolveWsUrl(sr);
		const effectiveSession: ApiSession = { ...sr, ws_url: wsUrl };
		sessionRef.current = effectiveSession;
		opts.persistSession?.(effectiveSession);

		await client.connect(
			effectiveSession.session_id || effectiveSession.token || '',
			wsUrl,
			opts.createStatus ?? true,
			opts.verbose ?? false
		);

		client.onrefreshsession = (sessionNew: ApiSession) => {
			if (opts.onSessionRefreshed) {
				opts.onSessionRefreshed(sessionNew, effectiveSession);
				return;
			}
			sessionRef.current = {
				...effectiveSession,
				session_id: sessionNew.session_id
			};
			const authData = JSON.stringify(sessionRef.current as ApiSession);
			localStorage.setItem('persist:auth', authData);
		};
		socketState.status = 'connected';
		return effectiveSession;
	})().finally(() => {
		connectInFlight = null;
	});

	return connectInFlight;
}

export async function reconnectMezonSocketWithRetry(options: {
	client: Client;
	sessionRef: MutableRefObject<ApiSession | null>;
	isFromMobile: boolean;
	resolveWsUrl: (session: Pick<ApiSession, 'ws_url'>) => string;
	persistSession?: (effectiveSession: ApiSession) => void;
	onSessionRefreshed?: (sessionNew: ApiSession, effectiveSession: ApiSession) => void;
}): Promise<ReconnectMezonSocketResult> {
	if (reconnectInFlight) {
		return 'RECONNECTING';
	}

	const { client, sessionRef, isFromMobile, resolveWsUrl, persistSession, onSessionRefreshed } = options;

	if (!sessionRef.current) {
		return null;
	}

	reconnectInFlight = true;

	try {
		let failCount = 0;

		while (failCount < MAX_WEBSOCKET_FAILS) {
			try {
				if (!sessionRef.current) {
					return null;
				}

				const result = await connectMezonSocketOnce({
					client,
					sessionRef,
					resolveWsUrl,
					persistSession,
					onSessionRefreshed
				});

				if (result === null) {
					return null;
				}
				return;
			} catch {
				failCount++;

				if (failCount >= MAX_WEBSOCKET_FAILS) {
					throw new Error('Socket reconnection failed');
				}

				let retryTime: number;

				if (isFromMobile) {
					retryTime = 1000;
				} else if (failCount <= FAST_RETRY_ATTEMPTS) {
					retryTime = MIN_WEBSOCKET_RETRY_TIME + Math.random() * JITTER_RANGE;
				} else {
					const exponentialTime = MIN_WEBSOCKET_RETRY_TIME * Math.pow(2, failCount - FAST_RETRY_ATTEMPTS);
					retryTime = Math.min(exponentialTime, MAX_WEBSOCKET_RETRY_TIME) + Math.random() * JITTER_RANGE;
				}

				await waitForNetworkAndDelay(retryTime);
			}
		}

		throw new Error('Max reconnection attempts reached');
	} finally {
		reconnectInFlight = false;
	}
}
