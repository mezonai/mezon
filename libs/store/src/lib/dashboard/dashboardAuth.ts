import type { GetThunkAPI } from '@reduxjs/toolkit';
import type { AUTH_FEATURE_KEY, AuthState, ISession } from '../auth/auth.slice';
import { selectSession } from '../auth/auth.slice';
import { getMezonCtx, isMezonThunk } from '../helpers';
import { getSessionBearerHeaders, refreshMezonSession } from '../sessionAuth';
import type { RootState } from '../store';

export function getDashboardAuthHeaders(session: ISession | null | undefined): Record<string, string> {
	return getSessionBearerHeaders(session);
}

async function refreshDashboardSession(thunkAPI: GetThunkAPI<unknown>): Promise<ISession | null> {
	if (!isMezonThunk(thunkAPI)) {
		return null;
	}

	return refreshMezonSession(getMezonCtx(thunkAPI));
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
