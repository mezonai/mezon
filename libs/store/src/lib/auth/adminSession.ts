import { fetchSessionRefresh, isJwtExpired, isRefreshRefused, publishSessionUpdate } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { AuthState, ISession } from './auth.slice';
import { authActions } from './auth.slice';

export type AdminSessionContext = Pick<GetThunkAPI<unknown>, 'getState' | 'dispatch'>;

export const ADMIN_SESSION_EXPIRED_ERROR = 'AdminSessionExpiredError';

const pendingRefreshes = new WeakMap<AdminSessionContext['getState'], { session: ISession; promise: Promise<ISession> }>();
// Trust a token just issued by the server despite local clock skew, as the chat recovery path does.
const SERVER_TOKEN_TRUST_MS = 5 * 60 * 1000;
const REFRESH_REFUSAL_CONFIRM_MS = 1000;
const serverTokens = new WeakMap<AdminSessionContext['getState'], { token: string; receivedAt: number }>();

const readSession = (context: AdminSessionContext) => (context.getState() as { auth: AuthState }).auth.session;

function createSessionExpiredError(message = 'Your session has expired. Please sign in again.'): Error {
	const error = new Error(message);
	error.name = ADMIN_SESSION_EXPIRED_ERROR;
	return error;
}

export function isAdminSessionExpiredError(error: unknown): boolean {
	return Boolean(error && typeof error === 'object' && (error as { name?: string }).name === ADMIN_SESSION_EXPIRED_ERROR);
}

function isSameAdminSession(candidate: ISession | null | undefined, session: ISession): candidate is ISession {
	return Boolean(
		candidate &&
			session.user_id &&
			candidate.user_id === session.user_id &&
			candidate.created_at === session.created_at &&
			candidate.session_id === session.session_id
	);
}

function readStoredAdminSession(): ISession | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem('persist:auth');
		if (!raw) return null;
		const parsed = safeJSONParse(raw);
		const stored = parsed?.session ? safeJSONParse(parsed.session) : null;
		return stored && typeof stored === 'object' ? (stored as ISession) : null;
	} catch {
		return null;
	}
}

function hasFreshToken(context: AdminSessionContext, session: ISession): boolean {
	const issued = serverTokens.get(context.getState);
	return (
		!!session.token &&
		((issued?.token === session.token && Date.now() - issued.receivedAt < SERVER_TOKEN_TRUST_MS) || !isJwtExpired(session.token))
	);
}

export async function getAdminSession(context: AdminSessionContext): Promise<ISession> {
	const session = readSession(context);
	if (!session) {
		throw createSessionExpiredError();
	}
	if (hasFreshToken(context, session)) {
		return session;
	}
	if (!session.refresh_token) {
		throw createSessionExpiredError();
	}

	const pending = pendingRefreshes.get(context.getState);
	if (pending?.session.token === session.token && pending.session.refresh_token === session.refresh_token) {
		return pending.promise;
	}

	const promise = (async () => {
		const apiUrl = `https://${process.env.NX_CHAT_APP_API_HOST}:${process.env.NX_CHAT_APP_API_PORT}`;
		const serverKey = process.env.NX_CHAT_APP_API_KEY?.trim() || '';
		let { status, tokens } = await fetchSessionRefresh(apiUrl, serverKey, session.refresh_token, !!session.is_remember);

		if (!tokens && isRefreshRefused(status) && !isJwtExpired(session.refresh_token)) {
			await new Promise((resolve) => setTimeout(resolve, REFRESH_REFUSAL_CONFIRM_MS));
			const stored = readStoredAdminSession();
			if (isSameAdminSession(stored, session) && hasFreshToken(context, stored)) {
				context.dispatch(authActions.updateSession(stored));
				return stored;
			}
			const latestRefreshToken =
				isSameAdminSession(stored, session) && stored.refresh_token?.trim() ? stored.refresh_token.trim() : session.refresh_token;
			({ status, tokens } = await fetchSessionRefresh(apiUrl, serverKey, latestRefreshToken, !!session.is_remember));
		}

		const current = readSession(context);
		if (current?.token !== session.token || current?.refresh_token !== session.refresh_token) {
			if (isSameAdminSession(current, session) && hasFreshToken(context, current)) {
				return current;
			}
			throw new Error('Your session has changed. Please try again.');
		}
		if (!tokens) {
			if (isRefreshRefused(status)) {
				throw createSessionExpiredError(`SessionRefresh HTTP ${status}`);
			}
			throw new Error(status === 200 ? 'SessionRefresh returned an invalid access token' : `SessionRefresh HTTP ${status}`);
		}
		const nextSession: ISession = {
			...current,
			...tokens
		};
		serverTokens.set(context.getState, { token: tokens.token, receivedAt: Date.now() });
		context.dispatch(authActions.updateSession(nextSession));
		publishSessionUpdate(nextSession, 'refresh');
		return nextSession;
	})();
	pendingRefreshes.set(context.getState, { session, promise });
	try {
		return await promise;
	} finally {
		if (pendingRefreshes.get(context.getState)?.promise === promise) {
			pendingRefreshes.delete(context.getState);
		}
	}
}

export const ensureAdminSession = createAsyncThunk('auth/ensureAdminSession', async (_, context) => getAdminSession(context));
