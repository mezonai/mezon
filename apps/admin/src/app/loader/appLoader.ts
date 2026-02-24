import type { AppDispatch } from '@mezon/store';
import { appActions } from '@mezon/store';
import type { LoaderFunctionArgs } from 'react-router-dom';

export interface IAppLoaderData {
	pathname: string;
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

	dispatch(appActions.setInitialPath(pathname));
	return {
		pathname
	} as IAppLoaderData;
};

export const shouldRevalidateApp = () => {
	return false;
};
