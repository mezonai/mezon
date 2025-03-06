import { fetchApplications, fetchMezonOauthClient, getApplicationDetail, getStoreAsync, selectAllApps, setCurrentAppId } from '@mezon/store';
import { CustomLoaderFunction } from './appLoader';

interface IBotLoaderData {
	applicationId: string;
}

export const applicationLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { applicationId } = params;
	if (!applicationId) {
		throw new Error('Application ID null');
	}

	const store = await getStoreAsync();
	const appState = selectAllApps(store.getState());

	if (!appState.apps || appState.apps.length === 0) {
		await dispatch(fetchApplications({}));
	}

	dispatch(setCurrentAppId(applicationId));
	await dispatch(getApplicationDetail({ appId: applicationId }));
	await dispatch(fetchMezonOauthClient({ appId: applicationId }));

	return {
		applicationId
	} as IBotLoaderData;
};

export const shouldRevalidateApplication = () => {
	return false;
};
