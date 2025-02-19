import loadable from '@loadable/component';
import { selectInitialPath, useAppDispatch } from '@mezon/store';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createBrowserRouter, LoaderFunctionArgs, Navigate, Outlet, RouterProvider } from 'react-router-dom';
// Layouts
import AppLayout from '../layouts/AppLayout';
import RootLayout from '../layouts/RootLayout';
//loader
import { appLoader, CustomLoaderFunction } from '../loader/appLoader';
import { authLoader } from '../loader/authLoader';
// Pages
import { applicationLoader } from '../loader/applicationLoader';
import { oAuth2Loader } from '../loader/oauthLoader';
import FlowExamples from '../pages/flowExamples';
import Flows from '../pages/flows';
import Flow from '../pages/flows/Flow';
import InitialRoutes from './InititalRoutes';

const Login = loadable(() => import('../pages/login'));
const ApplicationsPage = loadable(() => import('../pages/applications'));
const TeamsPage = loadable(() => import('../pages/teams'));
const DocsPage = loadable(() => import('../pages/docs'));
const EmbedsPage = loadable(() => import('../pages/embeds'));
const GeneralInformation = loadable(() => import('../pages/AppGeneralInformation'));
const Installation = loadable(() => import('../pages/installation'));
const Install = loadable(() => import('../pages/install'));
const OAuth2 = loadable(() => import('../pages/OAuth2'));

export const Routes = () => {
	const dispatch = useAppDispatch();
	const initialPath = useSelector(selectInitialPath);

	const loaderWithStore = useCallback(
		(loaderFunction: CustomLoaderFunction) => {
			return async (props: LoaderFunctionArgs) =>
				await loaderFunction({
					...props,
					dispatch,
					initialPath: initialPath
				});
		},
		[dispatch, initialPath]
	);

	const routes = useMemo(
		() =>
			createBrowserRouter([
				{
					path: '',
					loader: loaderWithStore(appLoader),
					element: <AppLayout />,
					children: [
						{
							path: '',
							element: <InitialRoutes />
						},
						{
							path: 'login',
							element: <Login />
						},
						{
							path: '',
							loader: loaderWithStore(authLoader),
							element: <RootLayout />,
							children: [
								{
									path: '',
									element: <InitialRoutes />
								},
								{
									path: 'applications',
									element: <ApplicationsPage />
								},
								{
									path: 'applications/:applicationId',
									element: (
										<div>
											<Outlet />
										</div>
									),
									loader: loaderWithStore(applicationLoader),
									children: [
										{
											path: '*',
											element: <Navigate to="information" />
										},
										{
											path: '',
											element: <Navigate to="information" />
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
											loader: loaderWithStore(oAuth2Loader),
											element: <OAuth2 />
										},
										{
											path: 'flow',
											element: <Flows />
										},
										{
											path: 'add-flow',
											element: (
												<ReactFlowProvider>
													<Flow />
												</ReactFlowProvider>
											)
										},
										{
											path: 'flow/:flowId',
											element: (
												<ReactFlowProvider>
													<Flow />
												</ReactFlowProvider>
											)
										},
										{
											path: 'flow-examples',
											element: <FlowExamples />
										},
										{
											path: 'use-flow-example/:exampleFlowId',
											element: (
												<ReactFlowProvider>
													<Flow />
												</ReactFlowProvider>
											)
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
							path: 'install/:applicationId',
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
