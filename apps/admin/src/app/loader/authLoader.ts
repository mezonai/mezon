import { accountActions, fetchApplications, getStore } from '@mezon/store';
import type { IWithError } from '@mezon/utils';
import type { CustomLoaderFunction } from './appLoader';

function hasPersistedToken(): boolean {
	try {
		const state = getStore().getState();
		return Boolean(state.auth?.session?.token);
	} catch {
		return false;
	}
}

export interface IAuthLoaderData {
	isLogin: boolean;
	redirect?: string;
}

function getRedirectTo(initialPath?: string): string {
	const searchParams = new URLSearchParams(window.location.search);
	const redirectParam = searchParams.get('redirect');

	if (redirectParam) {
		return redirectParam;
	}

	if (initialPath && !initialPath.startsWith('/')) {
		return initialPath;
	}

	return '';
}

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
	try {
		const profileResponse = await dispatch(accountActions.getUserProfile());
		await dispatch(fetchApplications({}));
		if ((profileResponse as unknown as IWithError).error) {
			throw new Error('Session expired');
		}
		return {
			isLogin: true
		} as IAuthLoaderData;
	} catch (error) {
		if (hasPersistedToken()) {
			return {
				isLogin: true
			} as IAuthLoaderData;
		}

		const redirectTo = getRedirectTo(initialPath);
		const redirect = redirectTo ? `/login?redirect=${redirectTo}` : '';
		return {
			isLogin: false,
			redirect
		} as IAuthLoaderData;
	}
};

export const shouldRevalidateAuth = () => {
	return false;
};
