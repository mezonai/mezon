import {
	fetchApplications,
	fetchMezonOauthClient,
	getApplicationDetail,
	getStoreAdminAsync,
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

	const store = await getStoreAdminAsync();

	await dispatch(fetchApplications({}));
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
