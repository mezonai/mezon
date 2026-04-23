import { CustomLoaderFunction } from './appLoader';

export interface ILoginLoaderData {
	initialPath: string;
	redirectTo?: string;
}

function isSafeRelativePath(path: string | null | undefined): path is string {
	if (!path) return false;
	if (!path.startsWith('/')) return false;
	if (path.startsWith('//') || path.startsWith('/\\')) return false;
	if (/^\s*(javascript|data|vbscript):/i.test(path)) return false;
	return true;
}

function getRedirectTo(initialPath?: string): string {
	const searchParams = new URLSearchParams(window.location.search);
	const redirectParam = searchParams.get('redirect');

	if (isSafeRelativePath(redirectParam)) {
		return redirectParam;
	}

	if (initialPath && !initialPath.startsWith('/desktop') && isSafeRelativePath(initialPath)) {
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
