import isElectron from 'is-electron';
import { LoaderFunctionArgs, Outlet, RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import GuessLayout from '../layouts/GuessLayout';
import MainLayout from '../layouts/MainLayout';

// Loaders
import { CustomLoaderFunction, appLoader, shouldRevalidateApp } from '../loaders/appLoader';
import { authLoader, shouldRevalidateAuth } from '../loaders/authLoader';
import { channelLoader, shouldRevalidateChannel } from '../loaders/channelLoader';
import { clanLoader, shouldRevalidateServer } from '../loaders/clanLoader';
import { directLoader } from '../loaders/directLoader';
import { directMessageLoader } from '../loaders/directMessageLoader';
import { friendsLoader } from '../loaders/friendsLoader';
import { mainLoader, shouldRevalidateMain } from '../loaders/mainLoader';

import { loginLoader } from '../loaders/loginLoader';
import ClansRoutes from './ClanRoutes';
import DMRoutes from './DMRoutes';

// Pages
import { Canvas } from '@mezon/components';
import { MemberProvider } from '@mezon/core';
import { appActions, useAppDispatch } from '@mezon/store';
import { memo, useCallback, useEffect, useMemo } from 'react';
import CanvasLayout from '../layouts/CanvasLayout';
import ChannelLayout from '../layouts/ChannelLayout';
import ClanLayout from '../layouts/ClanLayout';
import { canvasLoader, shouldRevalidateCanvas } from '../loaders/canvasLoader';
import { inviteLoader, shouldRevalidateInvite } from '../loaders/inviteLoader';
import AppDirectory from '../pages/AppDirectory';
import ChannelMain from '../pages/channel';
import ChannelIndex from '../pages/channel/ChannelIndex';
import ClanIndex from '../pages/clan/ClanIndex';
import Direct from '../pages/directMessage';
import DirectMessage from '../pages/directMessage/DMPage';
import DirectMessageIndex from '../pages/directMessage/DMPage/DirectMessageIndex';
import FriendsPage from '../pages/directMessage/FriendsPage';
import GuideMain from '../pages/guide';
import MezonPage from '../pages/homepage/mezonpage';
import InvitePage from '../pages/invite';
import Login from '../pages/login';
import LoginCallback from '../pages/loginCallback';
import LogoutCallback from '../pages/logoutCallback';
import Main from '../pages/main';
import MemberMain from '../pages/member';
import ChannelSettingMain from '../pages/setting/channelSetting';
import ThreadsMain from '../pages/thread';
import CanvasRoutes from './CanvasRoutes';
import ErrorRoutes from './ErrorRoutes';
import InitialRoutes from './InititalRoutes';
import ProtectedRoutes from './ProtectedRoutes';
import ThreadsRoutes from './ThreadsRoutes';

// Components
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

	const routes = useMemo(
		() =>
			(isElectron() ? createHashRouter : createBrowserRouter)(
				[
					{
						path: '',
						loader: loaderWithStore(appLoader),
						shouldRevalidate: shouldRevalidateApp,
						element: <AppLayout />,
						errorElement: <ErrorRoutes />,
						children: [
							// initial route to redirect to /chat
							{
								path: '/mezon',
								element: <InitialRoutes />
							},
							{
								path: 'login/callback',
								element: <LoginCallback />
							},
							{
								path: 'logout/callback',
								element: <LogoutCallback />
							},
							isElectron()
								? {
										path: '/',
										element: <InitialRoutes />
									}
								: {
										path: '/',
										loader: loaderWithStore(loginLoader),
										element: <MezonPage />
									},
							{
								path: '/apps',
								element: <AppDirectory />
							},
							{
								path: 'desktop',
								element: <GuessLayout />,
								children: [
									isElectron()
										? {
												path: 'login',
												loader: loaderWithStore(loginLoader),
												element: <Login />
											}
										: {
												path: 'mezon',
												element: <InitialRoutes />
											}
								]
							},
							{
								path: 'chat',
								loader: loaderWithStore(authLoader),
								shouldRevalidate: shouldRevalidateAuth,
								element: <ProtectedRoutes />,
								children: [
									{
										path: '',
										loader: loaderWithStore(mainLoader),
										shouldRevalidate: shouldRevalidateMain,
										element: <MainLayout />,
										children: [
											{
												path: '',
												element: <Main />,
												children: [
													{
														path: 'clans',
														element: <ClansRoutes />,
														children: [
															{
																path: ':clanId',
																loader: loaderWithStore(clanLoader),
																shouldRevalidate: shouldRevalidateServer,
																element: <ClanLayout />,
																children: [
																	{
																		path: '',
																		element: <ClanIndex />
																	},
																	{
																		path: 'member-safety',
																		element: (
																			<MemberProvider>
																				<MemberMain />
																			</MemberProvider>
																		)
																	},
																	{
																		path: 'channel-setting',
																		element: <ChannelSettingMain />
																	},
																	{
																		path: 'channels',
																		element: <ChannelLayout />,
																		children: [
																			{
																				path: '',
																				element: <ChannelIndex />
																			},
																			{
																				path: ':channelId',
																				loader: loaderWithStore(channelLoader),
																				shouldRevalidate: shouldRevalidateChannel,
																				element: <ChannelMain />,
																				children: [
																					{
																						path: 'threads',
																						element: <ThreadsRoutes />,
																						children: [
																							{
																								path: ':threadId',
																								element: <ThreadsMain />
																							}
																						]
																					},
																					{
																						path: 'canvas',
																						element: <CanvasRoutes />,
																						children: [
																							{
																								path: ':canvasId',
																								loader: loaderWithStore(canvasLoader),
																								shouldRevalidate: shouldRevalidateCanvas,
																								element: <Canvas />
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
																				<GuideMain />
																			</MemberProvider>
																		)
																	}
																]
															}
														]
													},
													{
														path: 'direct',
														element: <Direct />,
														loader: loaderWithStore(directLoader),
														children: [
															{
																path: '',
																element: <DirectMessageIndex />
															},

															{
																path: 'friends',
																loader: loaderWithStore(friendsLoader),
																element: <FriendsPage />
															},
															{
																path: 'message',
																element: <DMRoutes />,
																children: [
																	{
																		path: '',
																		element: <DirectMessageIndex />
																	},
																	{
																		path: ':directId/:type',
																		loader: loaderWithStore(directMessageLoader),
																		shouldRevalidate: shouldRevalidateChannel,
																		element: <DirectMessage />
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
																				element: <CanvasLayout />
																			}
																		]
																	}
																]
															}
														]
													}
												]
											}
										]
									}
								]
							},
							{
								path: 'invite',
								loader: loaderWithStore(authLoader),
								shouldRevalidate: shouldRevalidateAuth,
								element: <ProtectedRoutes />,
								children: [
									{
										path: ':inviteId',
										loader: loaderWithStore(inviteLoader),
										shouldRevalidate: shouldRevalidateInvite,
										element: <InvitePage />
									}
								]
							},
							// fallback route, renders when no other route is matched
							{
								path: '*',
								element: <InitialRoutes />
							}
						]
					}
				],
				{
					future: {
						v7_fetcherPersist: true,
						v7_startTransition: true,
						v7_partialHydration: true
					}
				}
			),
		[loaderWithStore]
	);

	return <RouterProvider router={routes} />;
});
