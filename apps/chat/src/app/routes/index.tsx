import isElectron from 'is-electron';
import { Suspense, lazy, memo, useCallback, useEffect, useMemo } from 'react';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { Navigate, Outlet, RouterProvider, createBrowserRouter, createHashRouter, useNavigation } from 'react-router-dom';

import type { CustomLoaderFunction } from '../loaders/appLoader';
import { appLoader, shouldRevalidateApp } from '../loaders/appLoader';
import { authLoader, shouldRevalidateAuth } from '../loaders/authLoader';
import { channelLoader, shouldRevalidateChannel } from '../loaders/channelLoader';
import { clanLoader, shouldRevalidateServer } from '../loaders/clanLoader';
import { directLoader } from '../loaders/directLoader';
import { directMessageLoader, shouldRevalidateDirect } from '../loaders/directMessageLoader';
import { friendsLoader } from '../loaders/friendsLoader';
import { loginLoader } from '../loaders/loginLoader';
import { mainLoader, shouldRevalidateMain } from '../loaders/mainLoader';

import { MemberProvider } from '@mezon/core';
import { appActions, useAppDispatch } from '@mezon/store';
import { canvasLoader, shouldRevalidateCanvas } from '../loaders/canvasLoader';
import { inviteLoader, shouldRevalidateInvite } from '../loaders/inviteLoader';

import { useLoading } from '../app';
import CanvasRoutes from './CanvasRoutes';
import ClansRoutes from './ClanRoutes';
import DMRoutes from './DMRoutes';
import ErrorRoutes from './ErrorRoutes';
import InitialRoutes from './InititalRoutes';
import ProtectedRoutes from './ProtectedRoutes';
import ThreadsRoutes from './ThreadsRoutes';

import { Canvas } from '@mezon/components';

const AppLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/AppLayout'));
const GuessLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/GuessLayout'));
const MainLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/MainLayout'));
const CanvasLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/CanvasLayout'));
const ChannelLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/ChannelLayout'));
const ClanLayout = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/ClanLayout'));
const ClanIndex = lazy(() => import(/* webpackChunkName: "clan-index" */ '../pages/clan/ClanIndex'));
const ChannelIndex = lazy(() => import(/* webpackChunkName: "channel-index" */ '../pages/channel/ChannelIndex'));
const DirectMessageIndex = lazy(() => import(/* webpackChunkName: "dm-index" */ '../pages/directMessage/DirectMessageIndex'));
const ChannelAppLayoutMobile = lazy(() => import(/* webpackChunkName: "layouts" */ '../layouts/ChannelAppLayoutMobile'));
const PreJoinCalling = lazy(() => import(/* webpackChunkName: "ui-components" */ '../pages/meeting'));

const AppDirectory = lazy(() => import(/* webpackChunkName: "app-pages" */ '../pages/AppDirectory'));
const ChannelMain = lazy(() => import(/* webpackChunkName: "channel-pages" */ '../pages/channel'));
const Direct = lazy(() => import(/* webpackChunkName: "dm-pages" */ '../pages/directMessage'));
const DirectMessage = lazy(() => import(/* webpackChunkName: "dm-pages" */ '../pages/directMessage/DMPage'));
const FriendsPage = lazy(() => import(/* webpackChunkName: "dm-pages" */ '../pages/directMessage/FriendsPage'));
const GuideMain = lazy(() => import(/* webpackChunkName: "guide-pages" */ '../pages/guide'));
const MezonPage = lazy(() => import(/* webpackChunkName: "homepage" */ '../pages/homepage/mezonpage'));
const AboutMezon = lazy(() => import(/* webpackChunkName: "about" */ '../pages/aboutmezon'));
const EconomyPage = lazy(() => import(/* webpackChunkName: "economy-page" */ '../pages/economy'));
const InvitePage = lazy(() => import(/* webpackChunkName: "invite-pages" */ '../pages/invite'));
const Login = lazy(() => import(/* webpackChunkName: "auth-pages" */ '../pages/login'));
const LoginCallback = lazy(() => import(/* webpackChunkName: "auth-pages" */ '../pages/loginCallback'));
const LogoutCallback = lazy(() => import(/* webpackChunkName: "auth-pages" */ '../pages/logoutCallback'));
const Main = lazy(() => import(/* webpackChunkName: "main-pages" */ '../pages/main'));
const AddFriendPage = lazy(() => import(/* webpackChunkName: "main-pages" */ '../pages/invite/addFriendPage'));
const MemberMain = lazy(() => import(/* webpackChunkName: "member-pages" */ '../pages/member'));
const ChannelSettingMain = lazy(() => import(/* webpackChunkName: "setting-pages" */ '../pages/setting/channelSetting'));
const ThreadsMain = lazy(() => import(/* webpackChunkName: "thread-pages" */ '../pages/thread'));

const SuspenseFallback = () => {
	const { setSuspenseLoading } = useLoading();

	useEffect(() => {
		setSuspenseLoading?.(true);
		return () => {
			setSuspenseLoading?.(false);
		};
	}, [setSuspenseLoading]);

	return null;
};

// Add a simple HydrateFallback component for the initial hydration
const HydrateFallback = () => null;

const RouterMonitor = () => {
	const navigation = useNavigation();
	const { setIsLoading } = useLoading();

	useEffect(() => {
		if (navigation.state === 'idle') {
			setIsLoading(false);
		} else if (navigation.state === 'loading') {
			setIsLoading(true);
		}
	}, [navigation.state, setIsLoading]);

	return null;
};

export const Routes = memo(() => {
	const dispatch = useAppDispatch();
	const loaderWithStore = useCallback(
		(loaderFunction: CustomLoaderFunction) => {
			return async (props: LoaderFunctionArgs) =>
				await loaderFunction({
					...props,
					dispatch,
					initialPath: window.location.pathname
				});
		},
		[dispatch]
	);

	useEffect(() => {
		dispatch(appActions.setInitialPath(window.location.pathname));
	}, [dispatch]);

	const routes = useMemo(() => {
		return (isElectron() ? createHashRouter : createBrowserRouter)([
			{
				path: '',
				loader: loaderWithStore(appLoader),
				shouldRevalidate: shouldRevalidateApp,
				HydrateFallback,
				element: (
					<Suspense fallback={<SuspenseFallback />}>
						<RouterMonitor />
						<AppLayout />
					</Suspense>
				),
				errorElement: (
					<Suspense fallback={<SuspenseFallback />}>
						<ErrorRoutes />
					</Suspense>
				),
				children: [
					{
						path: '/mezon',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<InitialRoutes />
							</Suspense>
						)
					},
					{
						path: 'login/callback',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<LoginCallback />
							</Suspense>
						)
					},
					{
						path: 'logout/callback',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<LogoutCallback />
							</Suspense>
						)
					},
					{
						path: 'meeting/:code',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<PreJoinCalling />
							</Suspense>
						),
						loader: loaderWithStore(authLoader)
					},
					// {
					// 	path: 'popout',
					// 	element: (
					// 		<Suspense fallback={<SuspenseFallback />}>
					// 			<VoicePopout />
					// 		</Suspense>
					// 	)
					// },
					isElectron()
						? {
								path: '/',
								element: (
									<Suspense fallback={<SuspenseFallback />}>
										<InitialRoutes />
									</Suspense>
								)
							}
						: {
								path: '/',
								loader: loaderWithStore(loginLoader),
								element: (
									<Suspense fallback={<SuspenseFallback />}>
										<MezonPage />
									</Suspense>
								)
							},
					{
						path: '/apps',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<AppDirectory />
							</Suspense>
						)
					},
					{
						path: '/economy',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<EconomyPage />
							</Suspense>
						)
					},
					{
						path: '/about',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<AboutMezon />
							</Suspense>
						)
					},
					{
						path: 'desktop',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<GuessLayout />
							</Suspense>
						),
						children: [
							isElectron()
								? {
										path: 'login',
										loader: loaderWithStore(loginLoader),
										element: (
											<Suspense fallback={<SuspenseFallback />}>
												<Login />
											</Suspense>
										)
									}
								: {
										path: 'mezon',
										element: (
											<Suspense fallback={<SuspenseFallback />}>
												<InitialRoutes />
											</Suspense>
										)
									}
						]
					},
					{
						path: 'chat',
						loader: loaderWithStore(authLoader),
						shouldRevalidate: shouldRevalidateAuth,
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<ProtectedRoutes />
							</Suspense>
						),
						children: [
							{
								path: '',
								loader: loaderWithStore(mainLoader),
								shouldRevalidate: shouldRevalidateMain,
								element: (
									<Suspense fallback={<SuspenseFallback />}>
										<MainLayout />
									</Suspense>
								),
								children: [
									{
										path: '',
										element: (
											<Suspense fallback={<SuspenseFallback />}>
												<Main />
											</Suspense>
										),
										children: [
											{
												path: '',
												element: <Navigate to="direct" />
											},
											{
												path: 'clans',
												element: (
													<Suspense fallback={<SuspenseFallback />}>
														<ClansRoutes />
													</Suspense>
												),
												children: [
													{
														path: '',
														element: <ClanIndex />
													},
													{
														path: ':clanId',
														loader: loaderWithStore(clanLoader),
														shouldRevalidate: shouldRevalidateServer,
														element: (
															<Suspense fallback={<SuspenseFallback />}>
																<ClanLayout />
															</Suspense>
														),
														children: [
															{
																path: 'member-safety',
																element: (
																	<MemberProvider>
																		<Suspense fallback={<SuspenseFallback />}>
																			<MemberMain />
																		</Suspense>
																	</MemberProvider>
																)
															},
															{
																path: 'channel-setting',
																element: (
																	<Suspense fallback={<SuspenseFallback />}>
																		<ChannelSettingMain />
																	</Suspense>
																)
															},
															{
																path: 'channels',
																element: (
																	<Suspense fallback={<SuspenseFallback />}>
																		<ChannelLayout />
																	</Suspense>
																),
																children: [
																	{
																		path: '',
																		element: <ChannelIndex />
																	},
																	{
																		path: ':channelId',
																		loader: loaderWithStore(channelLoader),
																		shouldRevalidate: shouldRevalidateChannel,
																		element: (
																			<Suspense fallback={<SuspenseFallback />}>
																				<ChannelMain />
																			</Suspense>
																		),
																		children: [
																			{
																				path: 'threads',
																				element: (
																					<Suspense fallback={<SuspenseFallback />}>
																						<ThreadsRoutes />
																					</Suspense>
																				),
																				children: [
																					{
																						path: ':threadId',
																						element: (
																							<Suspense fallback={<SuspenseFallback />}>
																								<ThreadsMain />
																							</Suspense>
																						)
																					}
																				]
																			},
																			{
																				path: 'canvas',
																				element: (
																					<Suspense fallback={<SuspenseFallback />}>
																						<CanvasRoutes />
																					</Suspense>
																				),
																				children: [
																					{
																						path: ':canvasId',
																						loader: loaderWithStore(canvasLoader),
																						shouldRevalidate: shouldRevalidateCanvas,
																						element: (
																							<Suspense fallback={<SuspenseFallback />}>
																								<Canvas />
																							</Suspense>
																						)
																					}
																				]
																			}
																		]
																	}
																]
															},
															{
																path: 'guide',
																element: (
																	<MemberProvider>
																		<Suspense fallback={<SuspenseFallback />}>
																			<GuideMain />
																		</Suspense>
																	</MemberProvider>
																)
															}
														]
													}
												]
											},
											{
												path: 'direct',
												element: (
													<Suspense fallback={<SuspenseFallback />}>
														<Direct />
													</Suspense>
												),
												loader: loaderWithStore(directLoader),
												children: [
													{
														path: '',
														element: <DirectMessageIndex />
													},
													{
														path: 'friends',
														loader: loaderWithStore(friendsLoader),
														element: (
															<Suspense fallback={<SuspenseFallback />}>
																<FriendsPage />
															</Suspense>
														)
													},
													{
														path: 'message',
														element: (
															<Suspense fallback={<SuspenseFallback />}>
																<DMRoutes />
															</Suspense>
														),
														children: [
															{
																path: ':directId/:type',
																loader: loaderWithStore(directMessageLoader),
																shouldRevalidate: shouldRevalidateDirect,
																element: (
																	<Suspense fallback={<SuspenseFallback />}>
																		<DirectMessage />
																	</Suspense>
																)
															}
														]
													}
												]
											},
											{
												path: 'canvas-mobile',
												element: <Outlet />,
												children: [
													{
														path: ':clanId',
														loader: loaderWithStore(clanLoader),
														shouldRevalidate: shouldRevalidateServer,
														element: <Outlet />,
														children: [
															{
																path: ':channelId',
																loader: loaderWithStore(channelLoader),
																shouldRevalidate: shouldRevalidateChannel,
																element: <Outlet />,
																children: [
																	{
																		path: ':canvasId',
																		loader: loaderWithStore(canvasLoader),
																		shouldRevalidate: shouldRevalidateCanvas,
																		element: (
																			<Suspense fallback={<SuspenseFallback />}>
																				<CanvasLayout />
																			</Suspense>
																		)
																	}
																]
															}
														]
													}
												]
											},
											{
												path: 'apps-mobile',
												element: <Outlet />,
												children: [
													{
														path: ':clanId',
														loader: loaderWithStore(clanLoader),
														shouldRevalidate: shouldRevalidateServer,
														element: <Outlet />,
														children: [
															{
																path: ':channelId',
																loader: loaderWithStore(channelLoader),
																shouldRevalidate: shouldRevalidateChannel,
																element: (
																	<Suspense fallback={<SuspenseFallback />}>
																		<ChannelAppLayoutMobile />
																	</Suspense>
																)
															}
														]
													}
												]
											}
										]
									},
									{
										path: ':username',
										element: (
											<Suspense fallback={<SuspenseFallback />}>
												<AddFriendPage />
											</Suspense>
										)
									}
								]
							}
						]
					},
					{
						path: 'invite',
						children: [
							{
								path: ':inviteId',
								loader: loaderWithStore(inviteLoader),
								shouldRevalidate: shouldRevalidateInvite,
								element: (
									<Suspense fallback={<SuspenseFallback />}>
										<InvitePage />
									</Suspense>
								)
							}
						]
					},
					{
						path: '*',
						element: (
							<Suspense fallback={<SuspenseFallback />}>
								<InitialRoutes />
							</Suspense>
						)
					}
				]
			}
		]);
	}, [loaderWithStore]);

	return <RouterProvider router={routes} />;
});
