import { useAppNavigation, useEventManagementQuantity, useOnClickOutside, usePathMatch, usePermissionChecker } from '@mezon/core';
import type { EventManagementOnGogoing } from '@mezon/store';
import {
	channelAppActions,
	channelsActions,
	clansActions,
	eventManagementActions,
	getStore,
	selectAppChannelsList,
	selectChannelById,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentClanIsOnboarding,
	selectEventLoading,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectOngoingEvent,
	selectProcessingByClan,
	threadsActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';

import { Icons } from '@mezon/ui';
import { DONE_ONBOARDING_STATUS, EPermission, generateE2eId } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ApiChannelAppResponse } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CustomTooltip } from '../../ToolTip';
import EventModal from '../EventChannelModal';
export const Events = memo(() => {
	const { t } = useTranslation('channelList');
	const ongoingEvent = useSelector(selectOngoingEvent);
	const previewMode = useSelector(selectOnboardingMode);

	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const onboardingByClan = useSelector((state) => selectOnboardingByClan(state, currentClanId as string));
	const [checkAdminPermission] = usePermissionChecker([EPermission.administrator]);

	const { numberEventManagement, numberEventUpcoming } = useEventManagementQuantity();
	const closeModal = () => {
		closeEventModal();
		dispatch(eventManagementActions.showModalEvent(false));
	};

	const openModal = () => {
		openEventModal();
		setClanShowNumEvent(false);
		dispatch(eventManagementActions.showModalEvent(true));
	};

	const handleOpenDetail = () => {
		openEventModal();
	};

	const setClanShowNumEvent = useCallback(
		async (status: boolean) => {
			await dispatch(clansActions.setClanShowNumEvent({ clanId: currentClanId || '', status }));
		},
		[currentClanId]
	);

	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const channelSettingPath = `/chat/clans/${currentClanId}/channel-setting`;
	const serverGuidePath = `/chat/clans/${currentClanId}/guide`;
	const { isMemberPath, isSettingPath, isGuidePath } = usePathMatch({
		isMemberPath: memberPath,
		isSettingPath: channelSettingPath,
		isGuidePath: serverGuidePath
	});
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [openEventModal, closeEventModal] = useModal(() => {
		return <EventModal onClose={closeModal} />;
	}, []);

	const dispatch = useAppDispatch();
	const selectUserProcessing = useSelector((state) => selectProcessingByClan(state, currentClanId as string));
	const checkPreviewMode = useMemo(() => {
		if (previewMode?.open && previewMode.clanId === currentClanId) {
			return true;
		}
		if (selectUserProcessing) {
			return (
				onboardingByClan?.sumMission &&
				onboardingByClan?.sumMission > 0 &&
				currentClanIsOnboarding &&
				selectUserProcessing?.onboarding_step !== DONE_ONBOARDING_STATUS
			);
		}
		return false;
	}, [selectUserProcessing, onboardingByClan?.sumMission, previewMode, currentClanId, currentClanIsOnboarding]);
	const handleClose = () => {
		dispatch(topicsActions.setIsShowCreateTopic(false));
		dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannelId as string, isShowCreateThread: false }));
		dispatch(
			channelsActions.setCurrentChannelId({
				clanId: currentClanId as string,
				channelId: ''
			})
		);
	};

	const eventLoading = useSelector(selectEventLoading);

	return (
		<>
			{!!checkPreviewMode && <OnboardingGetStart link={serverGuidePath} clanId={currentClanId as string} />}

			{ongoingEvent && <EventNotification event={ongoingEvent} handleOpenDetail={handleOpenDetail} />}

			{currentClanIsOnboarding && (
				<Link
					to={serverGuidePath}
					onClick={handleClose}
					className={`self-stretch inline-flex cursor-pointer px-2 rounded h-[34px] ${isGuidePath ? 'bg-button-secondary text-theme-primary-active' : ''} bg-item-hover text-theme-primary text-theme-primary-hover`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex">
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5 left-[1.67px] top-[1.67px] absolute">
								<Icons.GuideIcon defaultSize="w-5 h-5 " defaultFill="" />
							</div>
						</div>
						<div className="w-[99px] text-base font-medium">{t('navigation.clanGuide')}</div>
					</div>
				</Link>
			)}

			<div
				className="self-stretch  items-center inline-flex cursor-pointer px-2 rounded-lg h-[34px] bg-item-hover  text-theme-primary text-theme-primary-hover"
				onClick={openModal}
				data-e2e={generateE2eId('clan_page.side_bar.button.events')}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex">
					<div className="h-5 relative flex justify-center gap-2  items-center">
						<div className="w-5 h-5">
							<Icons.IconEvents />
						</div>
						<div className="w-[99px] text-base font-medium">
							{numberEventManagement === 0
								? t('navigation.events')
								: numberEventManagement === 1
									? t('navigation.events_one', { count: numberEventManagement })
									: t('navigation.events_other', { count: numberEventManagement })}
						</div>
					</div>
				</div>
				{eventLoading === 'loaded' && numberEventUpcoming > 0 && (
					<div className="w-5 h-5 p-2 bg-red-600 rounded-[50px] flex-col justify-center items-center flex">
						<div className="text-white text-xs font-medium">{numberEventUpcoming}</div>
					</div>
				)}
			</div>

			<Link
				to={memberPath}
				onClick={handleClose}
				className={`self-stretch inline-flex cursor-pointer px-2 rounded-lg h-[34px] ${isMemberPath ? 'bg-button-secondary border-theme-primary text-theme-primary-active' : ''} bg-item-hover text-theme-primary text-theme-primary-hover`}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex" data-e2e={generateE2eId('clan_page.side_bar.button.members')}>
					<div className="w-5 h-5 relative flex flex-row items-center">
						<div className="w-5 h-5 ">
							<Icons.MemberList defaultSize="w-5 h-5" />
						</div>
					</div>
					<div className="text-base font-medium">{t('navigation.members')}</div>
				</div>
			</Link>
			{checkAdminPermission ? (
				<Link
					to={channelSettingPath}
					onClick={handleClose}
					className={`self-stretch  inline-flex cursor-pointer px-2 rounded-lg h-[34px] ${isSettingPath ? 'bg-button-secondary border-theme-primary text-theme-primary-active' : ''} bg-item-hover text-theme-primary text-theme-primary-hover`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex">
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5">
								<Icons.ChannelBrowser />
							</div>
						</div>
						<div className="w-full text-base font-medium" data-e2e={generateE2eId('clan_page.side_bar.button.channels')}>
							{t('navigation.channels')}
						</div>
					</div>
				</Link>
			) : null}
			<ChannelAppList />
		</>
	);
});

const EventNotification = ({ event, handleOpenDetail }: { event: EventManagementOnGogoing; handleOpenDetail: () => void }) => {
	const { t } = useTranslation('channelList');
	const dispatch = useDispatch();
	const handleCloseEvent = () => {
		dispatch(eventManagementActions.clearOngoingEvent(null));
	};
	return (
		<div className="w-[90%] mx-auto my-2 text-sm">
			<div className="flex justify-between">
				<div className="flex items-center">
					<div className="w-2 h-2 rounded-full bg-green-500"></div>
					<p className="text-green-500 text-base font-bold ml-2">{t('ongoingEvent.title')}</p>
				</div>
				<Icons.CloseButton className="w-3 h-3 mt-2" onClick={handleCloseEvent} />
			</div>
			<p className="text-channelActiveLightColor dark:text-channelActiveColor mt-3 text-base font-medium">{event.title}</p>
			<div className="flex mt-2">
				<Icons.Location defaultFill="text-channelActiveLightColor dark:text-channelActiveColor" />
				<p className="ml-2 text-channelActiveLightColor dark:text-channelActiveColor">{event.address}</p>
			</div>
			<div className="text-center py-1 bg-green-700 mt-2 rounded select-none" onClick={handleOpenDetail}>
				<p className=" text-channelActiveLightColor dark:text-channelActiveColor  font-medium">{t('ongoingEvent.eventDetail')}</p>
			</div>
		</div>
	);
};

const OnboardingGetStart = ({ link, clanId }: { link: string; clanId: string }) => {
	const { t } = useTranslation('channelList');
	const missionDone = useSelector((state) => selectMissionDone(state, clanId));
	const missionSum = useSelector((state) => selectMissionSum(state, clanId));

	const completionPercentage = useMemo(() => {
		return missionDone ? (missionDone / missionSum) * 100 - 100 : -97;
	}, [missionDone, missionSum]);
	const { navigate } = useAppNavigation();
	const handleNavigate = () => {
		navigate(link);
	};

	return (
		<div className="w-full h-12 flex flex-col gap-2 relative px-2" onClick={handleNavigate}>
			<div className="flex justify-between">
				<p className="text-sm font-bold text-theme-primary">{t('onboarding.getStarted')}</p>
				<div className="flex gap-[1px] items-center text-theme-primary">
					<p className="text-xs font-bold ">{missionDone}</p>
					<p className="text-xs">{t('onboarding.of')}</p>
					<p className="text-xs font-bold">{missionSum}</p>
					<Icons.ArrowRight defaultSize="w-3 h-3" />
				</div>
			</div>
			<div className="flex bg-slate-700 relative rounded-2xl w-full h-1 overflow-hidden">
				<div
					className="absolute w-full h-full transition-transform duration-1000 bg-[#16A34A]  rounded-2xl"
					style={{
						animation: 'transform 1s ease-out',
						transform: `translateX(${completionPercentage}%)`
					}}
				></div>
			</div>
			<hr className="absolute bottom-1 left-0 h-[0.08px] w-full " />
		</div>
	);
};

const NUMBER_APPS_SHOW_OFF = 4;
const ChannelAppList = memo(() => {
	const allChannelApp = useSelector(selectAppChannelsList);
	const currentClanId = useSelector(selectCurrentClanId);
	const expandRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();
	const showList = allChannelApp.length > NUMBER_APPS_SHOW_OFF + 1 ? allChannelApp.slice(0, NUMBER_APPS_SHOW_OFF) : allChannelApp;
	const showRef = useRef<boolean>(false);

	const handleCloseListApp = (event: Event) => {
		if (expandRef.current?.contains(event.target as Node)) {
			return;
		}
		if (showRef.current) closeListApp();
		showRef.current = false;
	};

	const handleOpenApp = async (appChannel: ApiChannelAppResponse) => {
		if (appChannel.app_id && appChannel.app_url && appChannel.channel_id) {
			const hashData = await dispatch(
				channelAppActions.generateAppUserHash({
					appId: String(appChannel.app_id)
				})
			).unwrap();
			if (hashData.web_app_data) {
				const store = getStore();
				const channel = selectChannelById(store.getState(), String(appChannel.channel_id));
				const encodedHash = encodeURIComponent(hashData.web_app_data);
				const urlWithHash = `${appChannel.app_url}?data=${encodedHash}`;
				if (isElectron()) {
					window.electron.launchAppWindow(urlWithHash);
					return;
				}
				window.open(urlWithHash, channel?.channel_label, 'width=900,height=700');
			}
		}
	};
	const [openListApp, closeListApp] = useModal(() => {
		const rect = expandRef.current?.getBoundingClientRect();

		return (
			<div
				style={{
					top: rect?.top,
					left: rect?.left && rect?.left + 60
				}}
				className="fixed w-[360px] h-[420px] bg-theme-setting-primary  border-theme-primary shadow-lg z-50 rounded-lg"
			>
				<ListChannelApp onClose={handleCloseListApp} handleOpenApp={handleOpenApp} />
			</div>
		);
	}, [allChannelApp, handleCloseListApp, handleOpenApp]);

	const handleOpenListApp = () => {
		if (showRef.current) {
			closeListApp();
			showRef.current = false;
			return;
		}
		openListApp();
		showRef.current = true;
	};

	useEffect(() => {
		if (showRef.current) {
			closeListApp();
			showRef.current = false;
		}
	}, [currentClanId]);

	if (!allChannelApp.length) {
		return null;
	}

	return (
		<>
			<hr className="w-full ml-[3px] border-t-theme-primary" />
			<div className={`grow w-full flex-row items-center gap-2 flex py-1 px-2 ${showList.length < 4 ? 'justify-start' : 'justify-center'}`}>
				{showList.map((item) => (
					<CustomTooltip key={item.app_id} text={item.app_name || ''}>
						<div
							className="text-theme-primary text-theme-primary-hover rounded-md aspect-square h-10 p-2 flex items-center justify-center cursor-pointer bg-item-hover"
							onClick={() => handleOpenApp(item)}
						>
							{item.app_logo ? (
								<img src={item.app_logo} className="w-full h-full" alt={item.app_name} />
							) : (
								<svg className="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
									<g>
										<path d="M14,3H4C3.4,3,3,3.4,3,4v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4C15,3.4,14.6,3,14,3z" />
										<path d="M14,17H4c-0.6,0-1,0.4-1,1v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V18C15,17.4,14.6,17,14,17z" />
										<path d="M28,3H18c-0.6,0-1,0.4-1,1v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4C29,3.4,28.6,3,28,3z" />
										<path d="M26.5,19.5c-0.4-0.4-1-0.4-1.4,0L23,21.6l-2.1-2.1c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l2.1,2.1l-2.1,2.1 c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l2.1-2.1l2.1,2.1c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L24.4,23l2.1-2.1C26.9,20.5,26.9,19.9,26.5,19.5z" />
									</g>
								</svg>
							)}
						</div>
					</CustomTooltip>
				))}
				{allChannelApp.length > NUMBER_APPS_SHOW_OFF + 1 && (
					<div
						ref={expandRef}
						className="text-theme-primary text-theme-primary-hover rounded-md aspect-square h-10 p-2 flex items-center justify-center cursor-pointer bg-item-hover"
						onClick={handleOpenListApp}
					>
						<Icons.RightIcon defaultSize="w-6 h-6" />
					</div>
				)}
			</div>
		</>
	);
});

const ListChannelApp = ({
	onClose,
	handleOpenApp
}: {
	onClose: (event: Event) => void;
	handleOpenApp: (appChannel: ApiChannelAppResponse) => Promise<void>;
}) => {
	const panelRef = useRef<HTMLDivElement | null>(null);
	const allChannelApp = useSelector(selectAppChannelsList);
	useOnClickOutside(panelRef, onClose);

	const handleFindChannelApp = () => {
		window.open('https://top.mezon.ai/search?q=&tags=&type=app', '_blank');
	};

	return (
		<div ref={panelRef} className="w-full h-full flex flex-col">
			<div className="px-4 py-3 bg-item-theme rounded-tl-lg rounded-tr-lg">
				<h3 className="text-base font-semibold text-theme-primary">Channel Apps</h3>
			</div>
			<div className="flex-1 px-4 py-2 overflow-y-auto bg-theme-setting-primary thread-scroll">
				<div className="grid grid-cols-4 gap-2">
					{allChannelApp.map((item) => (
						<div
							key={item.app_id}
							className="text-theme-primary text-theme-primary-hover rounded-md p-2 flex flex-col items-center justify-center cursor-pointer bg-item-hover gap-1"
							onClick={() => handleOpenApp(item)}
						>
							<div className="w-10 h-10 flex items-center justify-center">
								{item.app_logo ? (
									<img src={item.app_logo} className="w-full h-full" alt={item.app_name} />
								) : (
									<svg className="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
										<g>
											<path d="M14,3H4C3.4,3,3,3.4,3,4v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4C15,3.4,14.6,3,14,3z" />
											<path d="M14,17H4c-0.6,0-1,0.4-1,1v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V18C15,17.4,14.6,17,14,17z" />
											<path d="M28,3H18c-0.6,0-1,0.4-1,1v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4C29,3.4,28.6,3,28,3z" />
											<path
												d="M26.5,19.5c-0.4-0.4-1-0.4-1.4,0L23,21.6l-2.1-2.1c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l2.1,2.1l-2.1,2.1
		c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l2.1-2.1l2.1,2.1c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3
		c0.4-0.4,0.4-1,0-1.4L24.4,23l2.1-2.1C26.9,20.5,26.9,19.9,26.5,19.5z"
											/>
										</g>
									</svg>
								)}
							</div>
							<span className="text-xs text-center truncate w-full" title={item.app_name}>
								{item.app_name}
							</span>
						</div>
					))}
				</div>
			</div>
			<div>
				<button
					onClick={handleFindChannelApp}
					className="w-full px-4 py-3 flex items-center gap-3 text-theme-primary hover:bg-item-hover transition-colors cursor-pointer bg-item-theme rounded-bl-lg rounded-br-lg"
				>
					<div className="w-8 h-8 rounded-full bg-button-secondary flex items-center justify-center">
						<Icons.SearchIcon className="w-5 h-5" />
					</div>
					<div className="flex-1 text-left">
						<p className="text-sm font-medium">Find Channel App</p>
						<p className="text-xs opacity-60">Discover more apps</p>
					</div>
					<Icons.ArrowRight defaultSize="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};
