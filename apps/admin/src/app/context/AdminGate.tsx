import { ensureAdminSession, selectAllSession, useAppDispatch } from '@mezon/store';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function AdminGate({ children }: { children: React.ReactNode }) {
	const session = useSelector(selectAllSession);
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(true);
	const [authorized, setAuthorized] = useState(false);

	useEffect(() => {
		let active = true;
		dispatch(ensureAdminSession())
			.unwrap()
			.then(() => {
				if (active) setAuthorized(true);
			})
			.catch(() => {
				if (active) setAuthorized(false);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [dispatch, session?.token, session?.refresh_token]);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!session || !authorized) {
		window.location.replace(`${process.env.NX_CHAT_APP_REDIRECT_URI}/login`);
		return null;
	}

	return children;
}
