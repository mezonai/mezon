import { accountActions, authActions, fetchApplications } from '@mezon/store';
import { IWithError } from '@mezon/utils';
import { CustomLoaderFunction } from './appLoader';

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
		const response = await dispatch(authActions.refreshSession());
		if ((response as unknown as IWithError).error) {
			throw new Error('Session expired');
		}

		const profileResponse = await dispatch(accountActions.getUserProfile());
		await dispatch(fetchApplications({}));
		if ((profileResponse as unknown as IWithError).error) {
			throw new Error('Session expired');
		}
		return {
			isLogin: true
		} as IAuthLoaderData;
	} catch (error) {
		const redirectTo = getRedirectTo(initialPath);
		const redirect = redirectTo ? `/login?redirect=${redirectTo}` : '';
		return {
			isLogin: false,
			redirect: redirect
		} as IAuthLoaderData;
	}
};

export const shouldRevalidateAuth = () => {
	return false;
};
