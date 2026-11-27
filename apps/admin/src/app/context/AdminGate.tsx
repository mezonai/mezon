import { authActions, ensureAdminSession, isAdminSessionExpiredError, selectAllSession, useAppDispatch } from '@mezon/store';
import { sanitizePostLoginRedirect, savePostLoginRedirect } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function clearPersistedAuthSession(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const raw = localStorage.getItem('persist:auth');
		if (!raw) return;
		const outer = JSON.parse(raw);
		outer.session = 'null';
		outer.isLogin = 'false';
		localStorage.setItem('persist:auth', JSON.stringify(outer));
	} catch {
		return;
	}
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
	const session = useSelector(selectAllSession);
	const dispatch = useAppDispatch();
	const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthenticated' | 'error'>('loading');
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		let active = true;
		dispatch(ensureAdminSession())
			.unwrap()
			.then(() => {
				if (active) setStatus('authorized');
			})
			.catch((error) => {
				if (!active) return;
				setStatus(isAdminSessionExpiredError(error) ? 'unauthenticated' : 'error');
			});

		return () => {
			active = false;
		};
	}, [dispatch, session?.token, session?.refresh_token, retryCount]);

	useEffect(() => {
		if (status !== 'unauthenticated' && !(status === 'authorized' && !session)) return;
		const returnTo = sanitizePostLoginRedirect(`${window.location.pathname}${window.location.search}${window.location.hash}`);
		savePostLoginRedirect(returnTo);
		dispatch(authActions.resetSession());
		clearPersistedAuthSession();
		const redirectOrigin = (process.env.NX_CHAT_APP_REDIRECT_URI || window.location.origin).replace(/\/+$/, '');
		const loginUrl = returnTo ? `${redirectOrigin}/login?redirect=${encodeURIComponent(returnTo)}` : `${redirectOrigin}/login`;
		window.location.replace(loginUrl);
	}, [status, session, dispatch]);

	if (status === 'loading') {
		return <div>Loading...</div>;
	}

	if (status === 'error') {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
				<div>Unable to verify your session. Please try again.</div>
				<button
					className="px-4 py-2 rounded bg-buttonPrimary text-white cursor-pointer"
					onClick={() => {
						setStatus('loading');
						setRetryCount((count) => count + 1);
					}}
				>
					Retry
				</button>
			</div>
		);
	}

	if (!session || status !== 'authorized') {
		return null;
	}

	return children;
}
