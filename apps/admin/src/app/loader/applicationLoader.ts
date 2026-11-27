import {
	fetchApplications,
	fetchMezonOauthClient,
	getApplicationDetail,
	getStoreAdminAsync,
	selectApplicationById,
	setCurrentAppId
} from '@mezon/store';
import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

interface IBotLoaderData {
	applicationId: string;
	application: any;
}

export const applicationLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { applicationId } = params;
	if (!applicationId) {
		throw new Response('Application not found', { status: 404 });
	}

	const store = await getStoreAdminAsync();

	const appsAction = await dispatch(fetchApplications({}));
	if (fetchApplications.rejected.match(appsAction)) {
		throw new Error('Failed to load applications');
	}
	const currentApp = selectApplicationById(store.getState(), applicationId);
	if (!currentApp) {
		throw new Response('Application not found', { status: 404 });
	}

	dispatch(setCurrentAppId(applicationId));
	await dispatch(getApplicationDetail({ appId: applicationId }));
	await dispatch(fetchMezonOauthClient({ appId: applicationId, appName: currentApp.appname }));

	return {
		applicationId,
		application: currentApp
	} as IBotLoaderData;
};

export const shouldRevalidateApplication: ShouldRevalidateFunction = ({ currentParams, nextParams }) => {
	return currentParams.applicationId !== nextParams.applicationId;
};
