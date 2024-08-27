import loadable from '@loadable/component';
import { selectInitialPath, useAppDispatch } from '@mezon/store';
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
import InitialRoutes from './InititalRoutes';
const Login = loadable(() => import('../pages/login'));
const ApplicationsPage = loadable(() => import('../pages/applications'));
const TeamsPage = loadable(() => import('../pages/teams'));
const DocsPage = loadable(() => import('../pages/docs'));
const EmbedsPage = loadable(() => import('../pages/embeds'));
const GeneralInformation = loadable(() => import('../pages/AppGeneralInformation'));
const Installation = loadable(() => import('../pages/installation'));
const Install = loadable(() => import('../pages/install'));

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
							path: 'admin',
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
