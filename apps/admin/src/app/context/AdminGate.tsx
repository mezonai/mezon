import { authActions, selectAllSession } from '@mezon/store';
import { useAdminMezon } from '@mezon/transport';
import type { ApiSession } from 'mezon-js';
import { Session, SessionRefreshRequest } from 'mezon-js-protobuf';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function isTokenExpired(token: string) {
	try {
		const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

		const expiresAt = payload.exp * 1000;
		const now = Date.now();

		return expiresAt >= now;
	} catch {
		return false;
	}
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
	const session = useSelector(selectAllSession);
	const admin = useAdminMezon();
	const dispatch = useDispatch();
	const isValidToken = useMemo(() => {
		const token = session?.token;

		return token ? isTokenExpired(token) : false;
	}, [session?.token]);
	const [loading, setLoading] = useState(true);
	const [authorized, setAuthorized] = useState(isValidToken);

	useEffect(() => {
		async function checkAuth() {
			try {
				// Access token còn hạn
				if (isValidToken) {
					setAuthorized(true);
					return;
				}

				// Hết hạn -> refresh
				if (!isValidToken && session?.refresh_token) {
					const encodedBody = SessionRefreshRequest.encode(
						SessionRefreshRequest.fromPartial({
							token: session.refresh_token,
							is_remember: session.is_remember
						})
					).finish();

					try {
						const url = `https://${admin.client.host}:${admin.client.port}/mezon.api.Mezon/SessionRefresh`;

						const response = await fetch(url, {
							method: 'POST',
							headers: {
								Authorization: `Basic ${btoa(`${admin.client?.serverkey?.trim() || ''}:`)}`,
								Accept: 'application/proto',
								'Content-Type': 'application/proto'
							},
							body: Uint8Array.from(encodedBody)
						});
						if (!response.ok) {
							throw new Error(`SessionRefresh HTTP ${response.status}`);
						}

						const buffer = await response.arrayBuffer();
						const session = Session.decode(new Uint8Array(buffer)) as ApiSession;
						dispatch(
							authActions.setSessionToken({
								token: session.token || '',
								refresh_token: session.refresh_token || '',
								api_url: session.api_url || '',
								created: !!session.created,
								created_at: Date.now()
							})
						);
						setAuthorized(true);
						return;
					} catch (error) {
						console.error('error: ', error);
						setAuthorized(false);
						return;
					}
				}

				setAuthorized(false);
			} catch {
				setAuthorized(false);
			} finally {
				setLoading(false);
			}
		}

		checkAuth();
	}, [isValidToken, session?.refresh_token]);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!authorized) {
		window.location.replace(`${process.env.NX_CHAT_APP_REDIRECT_URI}/login`);
		return null;
	}

	return <>{children}</>;
}
