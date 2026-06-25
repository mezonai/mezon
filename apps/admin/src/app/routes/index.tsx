import { selectInitialPath, useAppDispatch } from '@mezon/store';
import { lazy, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
// Layouts
import AppLayout from '../layouts/AppLayout';
import RootLayout from '../layouts/RootLayout';
//loader
import type { CustomLoaderFunction } from '../loader/appLoader';
// Pages
import { applicationLoader, shouldRevalidateApplication } from '../loader/applicationLoader';
import { authLoader, shouldRevalidateAuth } from '../loader/authLoader';
import InitialRoutes from './InititalRoutes';

const DashboardPage = lazy(() => import('../pages/dashboard'));
const ApplicationsPage = lazy(() => import('../pages/applications'));
const TeamsPage = lazy(() => import('../pages/teams'));
const DocsPage = lazy(() => import('../pages/docs'));
const EmbedsPage = lazy(() => import('../pages/embeds'));
const GeneralInformation = lazy(() => import('../pages/AppGeneralInformation'));
const Installation = lazy(() => import('../pages/installation'));
const Install = lazy(() => import('../pages/install'));
const OAuth2 = lazy(() => import('../pages/OAuth2'));
const TranscriptCallDetailPage = lazy(() => import('../pages/transcript-call-detail'));

export const Routes = () => {
	const dispatch = useAppDispatch();
	const initialPath = useSelector(selectInitialPath);
	const loaderWithStore = useCallback(
		(loaderFunction: CustomLoaderFunction) => {
			return async (props: LoaderFunctionArgs) =>
				await loaderFunction({
					...props,
					dispatch,
					initialPath
				});
		},
		[dispatch, initialPath]
	);

	const routes = useMemo(
		() =>
			createBrowserRouter([
				{
					path: '',
					element: <Navigate to="/developers" replace />
				},
				{
					path: '*',
					element: <Navigate to="/developers" replace />
				},
				{
					path: '/developers',
					element: <AppLayout />,
					children: [
						{
							path: '',
							loader: loaderWithStore(authLoader),
							shouldRevalidate: shouldRevalidateAuth,
							element: <RootLayout />,
							children: [
								{
									path: '*',
									element: <Navigate to="/developers/dashboard" replace />
								},
								{
									path: '',
									element: <InitialRoutes />
								},
								{
									path: 'applications',
									element: <ApplicationsPage />
								},
								{
									path: 'dashboard',
									element: <DashboardPage />
								},
								{
									path: 'transcript-calls/:callId',
									element: <TranscriptCallDetailPage />
								},
								{
									path: 'applications/:applicationId',
									element: (
										<div>
											<Outlet />
										</div>
									),
									loader: loaderWithStore(applicationLoader),
									shouldRevalidate: shouldRevalidateApplication,
									children: [
										{
											path: '*',
											element: <Navigate to="/developers/applications" replace />
										},
										{
											path: '',
											element: <Navigate to="information" replace />
										},
										{
											path: 'information',
											element: <GeneralInformation />
										},
										{
											path: 'installation',
											element: <Installation />
										},
										{
											path: 'oauth2',
											element: <OAuth2 />
										}
									]
								},
								{
									path: 'teams',
									element: <TeamsPage />
								},
								{
									path: 'embeds',
									element: <EmbedsPage />
								},
								{
									path: 'docs',
									element: <DocsPage />
								}
							]
						},
						{
							path: ':modalType/install/:applicationId',
							loader: loaderWithStore(authLoader),
							element: <Install />
						}
					]
				}
			]),
		[loaderWithStore]
	);

	return <RouterProvider router={routes} />;
};
