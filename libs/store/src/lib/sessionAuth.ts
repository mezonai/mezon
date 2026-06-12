import type { MezonContextValue } from '@mezon/transport';
import { isMezonUnauthorizedError, publishSessionUpdate } from '@mezon/transport';
import type { ApiSession, ApiSessionRefreshRequest } from 'mezon-js';
import { Session, SessionRefreshRequest } from 'mezon-js-protobuf';
import type { AUTH_FEATURE_KEY, AuthState, ISession } from './auth/auth.slice';
import { authActions, selectSession } from './auth/auth.slice';
import { resolveMezonApiBaseUrl } from './mezonHttpRpc';
import type { Store } from './store';

const SESSION_REFRESH_PATH = '/mezon.api.Mezon/SessionRefresh';
const REFRESH_TIMEOUT_MS = 30_000;
let refreshInFlight: Promise<ISession | null> | null = null;

export { isMezonUnauthorizedError };

function getAppStore(): Store {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require('./store').getStore() as Store;
}

export function getSessionBearerHeaders(session: ISession | null | undefined): Record<string, string> {
	const token = session?.token?.trim();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveServerKey(client: { serverkey?: string } | null | undefined): string {
	return client?.serverkey?.trim() || process.env.NX_CHAT_APP_API_KEY?.trim() || '';
}

function basicAuthHeader(serverKey: string): string {
	return `Basic ${btoa(`${serverKey}:`)}`;
}

/** SessionRefresh over HTTP (grpc-gateway) — does not require Mezon socket. */
async function httpSessionRefresh(apiBaseUrl: string, serverKey: string, body: ApiSessionRefreshRequest): Promise<ApiSession> {
	const encodedBody = SessionRefreshRequest.encode(
		SessionRefreshRequest.fromPartial({
			token: body.token,
			is_remember: body.is_remember,
			vars: body.vars ?? {}
		})
	).finish();

	const url = `${apiBaseUrl}${SESSION_REFRESH_PATH}`;
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

export async function refreshMezonSession(mezon: MezonContextValue): Promise<ISession | null> {
	if (refreshInFlight) {
		return refreshInFlight;
	}

	refreshInFlight = (async () => {
		try {
			const state = getAppStore().getState();
			const current = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });

			if (!current?.refresh_token?.trim()) {
				return null;
			}

			const serverKey = resolveServerKey(mezon.clientRef.current);
			if (!serverKey) {
				return null;
			}

			const apiBaseUrl = resolveMezonApiBaseUrl(current);
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

			getAppStore().dispatch(authActions.updateSession(updated));

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
