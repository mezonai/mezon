import {
	fetchApplications,
	fetchMezonOauthClient,
	getApplicationDetail,
	getStoreAsync,
	selectAllApps,
	selectApplicationById,
	setCurrentAppId
} from '@mezon/store';
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

	const currentApp = selectApplicationById(store.getState(), applicationId);
	dispatch(setCurrentAppId(applicationId));
	await dispatch(getApplicationDetail({ appId: applicationId }));
	await dispatch(fetchMezonOauthClient({ appId: applicationId, appName: currentApp.appname }));

	return {
		applicationId
	} as IBotLoaderData;
};

export const shouldRevalidateApplication = () => {
	return false;
};
