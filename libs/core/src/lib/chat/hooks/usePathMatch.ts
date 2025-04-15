import { useMemo } from 'react';
// import { useLocation } from 'react-router-dom';

export function usePathMatch(paths: { [key: string]: string }) {
	const currentURL = '';
	return useMemo(() => {
		const matches: { [key: string]: boolean } = {};
		for (const key in paths) {
			if (Object.prototype.hasOwnProperty.call(paths, key)) {
				matches[key] = paths[key] === currentURL;
			}
		}
		return matches;
	}, [paths, currentURL]);
}
