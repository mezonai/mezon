import type { AppDispatch } from '@mezon/store';
import { appActions, authActions } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import type { LoaderFunctionArgs } from 'react-router-dom';

export interface IAppLoaderData {
	pathname: string;
	redirectTo?: string;
}

type DataFunctionValue = Response | NonNullable<unknown> | null;
type DataFunctionReturnValue = Promise<DataFunctionValue> | DataFunctionValue;

// this any type is from lib itself
export type CustomLoaderFunction<Context = any> = {
	(
		args: LoaderFunctionArgs<Context> & {
			dispatch: AppDispatch;
			initialPath?: string;
		},
		handlerCtx?: unknown
	): DataFunctionReturnValue;
} & {
	hydrate?: boolean;
};

export const appLoader: CustomLoaderFunction = async ({ dispatch }) => {
	const { pathname } = window.location;
	let redirectTo = '';
	const paramString = window.location.href.split('?')[1];
	const params = new URLSearchParams(paramString);
	const result = Object.fromEntries(params.entries());
	const { deepLinkUrl, notificationPath } = result;
	if (deepLinkUrl) {
		redirectTo = `/desktop/login?deepLinkUrl=${encodeURIComponent(deepLinkUrl)}`;
		try {
			const session = deepLinkUrl.split('#')[0];
			const parsed = safeJSONParse(decodeURIComponent(session));
			if (parsed && typeof parsed === 'object' && typeof (parsed as any).token === 'string') {
				await dispatch(authActions.setSession(parsed));
				window.history.replaceState({}, document.title, pathname);
			} else {
				console.warn('Ignoring deepLinkUrl with unexpected session shape');
			}
		} catch (error) {
			console.error('Invalid JSON in deepLinkUrl:', error);
		}
	}

	if (notificationPath && typeof notificationPath === 'string' && notificationPath.startsWith('/') && !notificationPath.startsWith('//')) {
		redirectTo = notificationPath;
	}
	dispatch(appActions.setInitialParams(params));
	return {
		pathname,
		redirectTo
	} as IAppLoaderData;
};

export const shouldRevalidateApp = () => {
	return false;
};
