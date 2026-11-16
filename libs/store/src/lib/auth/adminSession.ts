import { fetchSessionRefresh, isJwtExpired, publishSessionUpdate } from '@mezon/transport';
import type { GetThunkAPI } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, ISession } from './auth.slice';
import { authActions } from './auth.slice';

export type AdminSessionContext = Pick<GetThunkAPI<unknown>, 'getState' | 'dispatch'>;

const pendingRefreshes = new WeakMap<AdminSessionContext['getState'], { session: ISession; promise: Promise<ISession> }>();
// Trust a token just issued by the server despite local clock skew, as the chat recovery path does.
const SERVER_TOKEN_TRUST_MS = 5 * 60 * 1000;
const serverTokens = new WeakMap<AdminSessionContext['getState'], { token: string; receivedAt: number }>();

const readSession = (context: AdminSessionContext) => (context.getState() as { auth: AuthState }).auth.session;

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
		throw new Error('Your session has expired. Please sign in again.');
	}
	if (hasFreshToken(context, session)) {
		return session;
	}
	if (!session.refresh_token) {
		throw new Error('Your session has expired. Please sign in again.');
	}

	const pending = pendingRefreshes.get(context.getState);
	if (pending?.session.token === session.token && pending.session.refresh_token === session.refresh_token) {
		return pending.promise;
	}

	const promise = (async () => {
		const { status, tokens } = await fetchSessionRefresh(
			`https://${process.env.NX_CHAT_APP_API_HOST}:${process.env.NX_CHAT_APP_API_PORT}`,
			process.env.NX_CHAT_APP_API_KEY?.trim() || '',
			session.refresh_token,
			!!session.is_remember
		);

		// A response arriving after logout or an account change must not restore the old session.
		const current = readSession(context);
		if (current?.token !== session.token || current?.refresh_token !== session.refresh_token) {
			// Another tab may have already rotated these credentials, including when our refresh was refused.
			if (
				current &&
				session.user_id &&
				current.user_id === session.user_id &&
				current.created_at === session.created_at &&
				current.session_id === session.session_id &&
				hasFreshToken(context, current)
			) {
				return current;
			}
			throw new Error('Your session has changed. Please try again.');
		}
		if (!tokens) {
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
