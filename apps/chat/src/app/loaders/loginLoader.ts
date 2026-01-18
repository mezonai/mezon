import type { CustomLoaderFunction } from './appLoader';

export interface ILoginLoaderData {
	initialPath: string;
	redirectTo?: string;
}

function getRedirectTo(initialPath?: string): string {
	const searchParams = new URLSearchParams(window.location.search);
	const redirectParam = searchParams.get('redirect');

	if (redirectParam) {
		return redirectParam;
	}

	if (initialPath && !initialPath.startsWith('/desktop')) {
		return initialPath;
	}

	return '/chat/direct/friends';
}

export const loginLoader: CustomLoaderFunction = async ({ initialPath }) => {
	const redirectTo = getRedirectTo(initialPath);

	return {
		initialPath,
		redirectTo
	} as ILoginLoaderData;
};

export const shouldRevalidateLogin = () => {
	return false;
};
