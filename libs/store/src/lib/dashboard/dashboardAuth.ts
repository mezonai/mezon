import { publishSessionUpdate } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { ApiSession, ApiSessionRefreshRequest, Client } from 'mezon-js';
import type { AUTH_FEATURE_KEY, AuthState, ISession } from '../auth/auth.slice';
import { authActions, selectSession } from '../auth/auth.slice';
import { getMezonCtx, isMezonThunk } from '../helpers';
import type { RootState } from '../store';

type RefreshableClient = {
	serverkey: string;
	transport: {
		sessionRefresh: (basicAuthUsername: string, basicAuthPassword: string, body: ApiSessionRefreshRequest) => Promise<ApiSession>;
	};
};

function asRefreshableClient(client: Client): RefreshableClient {
	return client as unknown as RefreshableClient;
}

let refreshInFlight: Promise<ISession | null> | null = null;

export function getDashboardAuthHeaders(session: ISession | null | undefined): Record<string, string> {
	const token = session?.token?.trim();
	return token ? { Authorization: `Bearer ${token}` } : {};
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

			const client = mezon.clientRef.current;
			if (!client) {
				return null;
			}

			const refreshable = asRefreshableClient(client);
			const apiSession = await refreshable.transport.sessionRefresh(refreshable.serverkey, '', {
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
