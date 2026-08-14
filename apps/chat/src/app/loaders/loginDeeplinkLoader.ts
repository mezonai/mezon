import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

export const loginDeeplinkLoader: CustomLoaderFunction = async ({ params }) => {
	const { loginId } = params;
	if (loginId) {
		try {
			window.location.href = `mezon.ai://login/${loginId}`;
		} catch (e) {
			console.error('log  => login deeplink redirect error', e);
		}
	}
	return null;
};

export const shouldRevalidateLoginDeeplink: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	return currentParams.loginId !== nextParams.loginId;
};
