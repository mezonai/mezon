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
	application: any;
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
	if (!currentApp) {
		throw new Error('Application not found');
	}

	dispatch(setCurrentAppId(applicationId));
	await dispatch(getApplicationDetail({ appId: applicationId }));
	await dispatch(fetchMezonOauthClient({ appId: applicationId, appName: currentApp.appname }));

	return {
		applicationId,
		application: currentApp
	} as IBotLoaderData;
};

export const shouldRevalidateApplication = () => {
	return false;
};
