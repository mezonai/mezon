import {
	fetchApplications,
	fetchMezonOauthClient,
	getApplicationDetail,
	getStoreAsync,
	selectAllApps,
	selectApplicationById,
	setCurrentAppId
} from '@mezon/store';
import type { CustomLoaderFunction } from './appLoader';

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
	const detailResult = await dispatch(getApplicationDetail({ appId: applicationId }));
	if (getApplicationDetail.rejected.match(detailResult)) {
		throw new Error('Failed to load application details');
	}

	const oauthResult = await dispatch(fetchMezonOauthClient({ appId: applicationId, appName: currentApp.appname }));
	if (fetchMezonOauthClient.rejected.match(oauthResult)) {
		console.warn('[Admin] OAuth client not available for app', applicationId, oauthResult.payload);
	}

	return {
		applicationId,
		application: currentApp
	} as IBotLoaderData;
};

export const shouldRevalidateApplication = () => {
	return false;
};
