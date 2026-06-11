import { publishSessionUpdate } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { ApiSession, ApiSessionRefreshRequest } from 'mezon-js';
import { Session, SessionRefreshRequest } from 'mezon-js-protobuf';
import type { AUTH_FEATURE_KEY, AuthState, ISession } from '../auth/auth.slice';
import { authActions, selectSession } from '../auth/auth.slice';
import { getMezonCtx, isMezonThunk } from '../helpers';
import type { RootState } from '../store';

const SESSION_REFRESH_PATH = '/mezon.api.Mezon/SessionRefresh';
const REFRESH_TIMEOUT_MS = 30_000;

let refreshInFlight: Promise<ISession | null> | null = null;

export function getDashboardAuthHeaders(session: ISession | null | undefined): Record<string, string> {
	const token = session?.token?.trim();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveApiBaseUrl(session: ISession | null | undefined): string {
	const fromSession = session?.api_url?.trim();
	if (fromSession) {
		return fromSession.replace(/\/$/, '');
	}

	const ssl = process.env.NX_CHAT_APP_API_SECURE === 'true';
	const scheme = ssl ? 'https' : 'http';
	const host = process.env.NX_CHAT_APP_API_HOST;
	const port = process.env.NX_CHAT_APP_API_PORT;

	if (!host || !port) {
		throw new Error('Missing NX_CHAT_APP_API_HOST or NX_CHAT_APP_API_PORT');
	}

	return `${scheme}://${host}:${port}`;
}

function resolveServerKey(client: { serverkey?: string } | null | undefined): string {
	return client?.serverkey?.trim() || process.env.NX_CHAT_APP_API_KEY?.trim() || '';
}

function basicAuthHeader(serverKey: string): string {
	return `Basic ${btoa(`${serverKey}:`)}`;
}

/** SessionRefresh over HTTP (grpc-gateway) — Not require Mezon socket. */
async function httpSessionRefresh(apiBaseUrl: string, serverKey: string, body: ApiSessionRefreshRequest): Promise<ApiSession> {
	const encodedBody = SessionRefreshRequest.encode(
		SessionRefreshRequest.fromPartial({
			token: body.token,
			is_remember: body.is_remember,
			vars: body.vars ?? {}
		})
	).finish();

	const url = `${apiBaseUrl}${SESSION_REFRESH_PATH}?`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: basicAuthHeader(serverKey),
				Accept: 'application/proto',
				'Content-Type': 'application/proto'
			},
			body: Uint8Array.from(encodedBody),
			signal: controller.signal
		});

		if (response.status === 204) {
			return {} as ApiSession;
		}

		if (!response.ok) {
			throw new Error(`SessionRefresh HTTP ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		return Session.decode(new Uint8Array(buffer)) as ApiSession;
	} finally {
		clearTimeout(timeout);
	}
}

async function refreshDashboardSession(thunkAPI: GetThunkAPI<unknown>): Promise<ISession | null> {
	if (!isMezonThunk(thunkAPI)) {
		return null;
	}

	if (refreshInFlight) {
		return refreshInFlight;
	}

	refreshInFlight = (async () => {
		try {
			const mezon = getMezonCtx(thunkAPI);
			const getState = thunkAPI.getState as () => RootState;
			const current = selectSession(getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });

			if (!current?.refresh_token?.trim()) {
				return null;
			}

			const serverKey = resolveServerKey(mezon.clientRef.current);
			if (!serverKey) {
				return null;
			}

			const apiBaseUrl = resolveApiBaseUrl(current);
			const apiSession = await httpSessionRefresh(apiBaseUrl, serverKey, {
				token: current.refresh_token,
				is_remember: current.is_remember,
				vars: (current.vars as Record<string, string> | undefined) ?? undefined
			});

			const updated: ISession = {
				...current,
				token: apiSession.token || current.token,
				refresh_token: apiSession.refresh_token || current.refresh_token,
				is_remember: apiSession.is_remember ?? current.is_remember
			};

			thunkAPI.dispatch(authActions.updateSession(updated));

			if (mezon.sessionRef.current) {
				mezon.sessionRef.current = { ...mezon.sessionRef.current, ...updated };
			}

			publishSessionUpdate(updated as ApiSession, 'refresh');
			return updated;
		} catch {
			return null;
		} finally {
			refreshInFlight = null;
		}
	})();

	return refreshInFlight;
}

function mergeDashboardHeaders(init: RequestInit | undefined, session: ISession | null | undefined): Headers {
	const headers = new Headers(init?.headers);
	const auth = getDashboardAuthHeaders(session);
	for (const [key, value] of Object.entries(auth)) {
		headers.set(key, value);
	}
	return headers;
}

export async function dashboardFetch(url: string, init: RequestInit | undefined, thunkAPI: GetThunkAPI<unknown>): Promise<Response> {
	const getState = thunkAPI.getState as () => RootState;
	let session = selectSession(getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });

	const doFetch = () =>
		fetch(url, {
			...init,
			headers: mergeDashboardHeaders(init, session)
		});

	let response = await doFetch();

	if (response.status === 401) {
		const refreshed = await refreshDashboardSession(thunkAPI);
		if (refreshed) {
			session = refreshed;
			response = await doFetch();
		}
	}

	return response;
}

export async function readDashboardError(response: Response): Promise<string> {
	return (await response.text().catch(() => '')) || response.statusText;
}
