import { useMemo } from 'react';

export function useAppParams() {
	// const { pathname: currentURL, search } = useLocation();
	const currentURL = '';
	// const query = useMemo(() => new URLSearchParams(search), [search]);

	// const messageId = query.get('messageId');

	return useMemo(() => ({}), []);
}
