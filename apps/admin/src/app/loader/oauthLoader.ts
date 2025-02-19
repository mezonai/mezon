import { fetchMezonOauthClient } from '@mezon/store';
import { CustomLoaderFunction } from './appLoader';

interface IOAuth2LoaderData {
	applicationId: string;
}

export const oAuth2Loader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { applicationId } = params;
	if (!applicationId) {
		throw new Error('Application ID null');
	}

	await dispatch(fetchMezonOauthClient());

	return {
		applicationId
	} as IOAuth2LoaderData;
};
