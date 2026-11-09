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
	selectCurrentClanName,
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

import { MezonIcon, MzIcons16, MzIcons20, MzIcons24, MzIcons40 } from '@mezon/ui';
import { DONE_ONBOARDING_STATUS, EPermission, buildChannelAppLaunchUrl, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ApiChannelAppResponse } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CustomTooltip } from '../../ToolTip';
import EventModal from '../EventChannelModal';
export const Events = memo(({ checkFetchChannel, checkHasChannel }: { checkHasChannel: boolean; checkFetchChannel: boolean }) => {
	const { t } = useTranslation('channelList');
	const { t: tWelcome } = useTranslation('chatWelcome');

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
					className={`mz-hover self-stretch inline-flex cursor-pointer px-2 rounded h-[34px] ${
						isGuidePath ? 'bg-[var(--bg-item-hover)] text-theme-primary-active' : ''
					} bg-item-hover text-theme-primary text-theme-primary-hover ${
						isGuidePath ? '[--guide-fill-1:var(--mz-icon-selected)]' : '[--guide-fill-1:var(--mz-icon)]'
					} hover:[--guide-fill-1:var(--mz-icon-selected)]`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex" data-e2e={generateE2eId('clan_page.side_bar.button.clan_guide')}>
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5">
								<MezonIcon icon={MzIcons20.mzGuide} className="text-[var(--guide-fill-1)]" />
							</div>
						</div>
						<div className="w-[99px] text-base font-medium">{t('navigation.clanGuide')}</div>
					</div>
				</Link>
			)}

			<div
				className="mz-hover self-stretch items-center inline-flex cursor-pointer px-2 rounded-lg h-[34px] bg-item-hover text-theme-primary text-theme-primary-hover [--events-fill-1:var(--mz-icon)] hover:[--events-fill-1:var(--mz-icon-selected)]"
				onClick={openModal}
				data-e2e={generateE2eId('clan_page.side_bar.button.events')}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex">
					<div className="h-5 relative flex justify-center gap-2  items-center">
						<div className="w-5 h-5">
							<MezonIcon icon={MzIcons20.mzEvent} className="text-[var(--events-fill-1)]" />
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
				className={`mz-hover self-stretch inline-flex cursor-pointer px-2 rounded-lg h-[34px] ${
					isMemberPath ? 'bg-[var(--bg-item-hover)] text-theme-primary-active' : ''
				} bg-item-hover text-theme-primary text-theme-primary-hover ${
					isMemberPath ? '[--member-list-fill:var(--mz-icon-selected)]' : '[--member-list-fill:var(--mz-icon)]'
				} hover:[--member-list-fill:var(--mz-icon-selected)]`}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex" data-e2e={generateE2eId('clan_page.side_bar.button.members')}>
					<div className="w-5 h-5 relative flex flex-row items-center">
						<div className="w-5 h-5 ">
							<MezonIcon icon={MzIcons20.mzMembers} className="text-[var(--member-list-fill)]" />
						</div>
					</div>
					<div className="text-base font-medium">{t('navigation.members')}</div>
				</div>
			</Link>
			{checkAdminPermission ? (
				<Link
					to={channelSettingPath}
					onClick={handleClose}
					className={`mz-hover self-stretch inline-flex cursor-pointer px-2 rounded-lg h-[34px] ${
						isSettingPath ? 'bg-[var(--bg-item-hover)] text-theme-primary-active' : ''
					} bg-item-hover text-theme-primary text-theme-primary-hover ${
						isSettingPath ? '[--channel-browser-fill-1:var(--mz-icon-selected)]' : '[--channel-browser-fill-1:var(--mz-icon)]'
					} hover:[--channel-browser-fill-1:var(--mz-icon-selected)]`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex">
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5">
								<MezonIcon icon={MzIcons20.mzChannelBrowse} className="text-[var(--channel-browser-fill-1)]" />
							</div>
						</div>
						<div className="w-full text-base font-medium" data-e2e={generateE2eId('clan_page.side_bar.button.channels')}>
							{t('navigation.channels')}
						</div>
					</div>
				</Link>
			) : null}
			<ChannelAppList />
			{!checkHasChannel && checkFetchChannel && (
				<div className="bottom-5 flex-col flex rounded-lg p-3 my-1 gap-2 bg-theme-surface w-[253px] ml-[1px]">
					<div className="flex gap-1 text-sm items-center font-semibold text-theme-primary-active">
						<MezonIcon icon={MzIcons24.mzHandRaise} className="text-[var(--mz-icon)] max-lg:hidden" />
						<MezonIcon icon={MzIcons20.mzHandRaise} className="text-[var(--mz-icon)] hidden max-lg:inline" />
						{tWelcome('welcome.welcomeToClan')}
					</div>
					<div className="text-xs text-theme-primary"> {tWelcome('welcome.emptyChannel')}</div>
				</div>
			)}
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
				<MezonIcon icon={MzIcons16.mzClose} className="mt-2" onClick={handleCloseEvent} />
			</div>
			<p className="text-channelActiveLightColor dark:text-channelActiveColor mt-3 text-base font-medium">{event.title}</p>
			<div className="flex mt-2">
				<MezonIcon icon={MzIcons20.mzLocation} className="text-[var(--mz-icon)]" />
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
		<div className="mz-hover w-full h-12 flex flex-col gap-2 relative px-2" onClick={handleNavigate}>
			<div className="flex justify-between">
				<p className="text-sm font-bold text-theme-primary">{t('onboarding.getStarted')}</p>
				<div className="flex gap-[1px] items-center text-theme-primary">
					<p className="text-xs font-bold ">{missionDone}</p>
					<p className="text-xs">{t('onboarding.of')}</p>
					<p className="text-xs font-bold">{missionSum}</p>
					<MezonIcon icon={MzIcons16.mzChevronRight} className="text-[var(--mz-icon)]" />
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
	const currentClanName = useSelector(selectCurrentClanName) ?? '';
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
					appId: appChannel.app_id
				})
			).unwrap();
			if (hashData.web_app_data) {
				const store = getStore();
				const channel = selectChannelById(store.getState(), appChannel.channel_id);
				const urlWithHash = buildChannelAppLaunchUrl(appChannel.app_url, {
					webAppData: hashData.web_app_data,
					clanId: currentClanId ?? '',
					clanName: currentClanName
				});
				window.open(urlWithHash, channel?.channel_label, 'width=900,height=700,noopener,noreferrer');
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
							className="text-theme-primary text-theme-primary-hover rounded-md aspect-square h-10 p-2 flex items-center justify-center cursor-pointer bg-item-hover group/mzi"
							onClick={() => handleOpenApp(item)}
						>
							{item.app_logo ? (
								<img
									src={createImgproxyUrl(item.app_logo, { width: 100, height: 100, resizeType: 'fill-down' })}
									className="w-full h-full"
									alt={item.app_name}
								/>
							) : (
								<MezonIcon
									icon={MzIcons24.mzChannelApp}
									className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]"
								/>
							)}
						</div>
					</CustomTooltip>
				))}
				{allChannelApp.length > NUMBER_APPS_SHOW_OFF + 1 && (
					<div
						ref={expandRef}
						className="text-theme-primary text-theme-primary-hover rounded-md aspect-square h-10 p-2 flex items-center justify-center cursor-pointer bg-item-hover group/mzi"
						onClick={handleOpenListApp}
					>
						<MezonIcon icon={MzIcons24.mzChevronRight} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
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
		window.open('https://top.mezon.ai/search?q=&tags=&type=app', '_blank', 'noopener,noreferrer');
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
							className="mz-hover text-theme-primary text-theme-primary-hover rounded-md p-2 flex flex-col items-center justify-center cursor-pointer bg-item-hover gap-1 group/mzi"
							onClick={() => handleOpenApp(item)}
						>
							<div className="w-10 h-10 flex items-center justify-center">
								{item.app_logo ? (
									<img
										src={createImgproxyUrl(item.app_logo, { width: 100, height: 100, resizeType: 'fill-down' })}
										className="w-full h-full"
										alt={item.app_name}
									/>
								) : (
									<MezonIcon
										icon={MzIcons40.mzChannelApp}
										className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]"
									/>
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
					className="mz-hover w-full px-4 py-3 flex items-center gap-3 text-theme-primary hover:bg-item-hover transition-colors cursor-pointer bg-item-theme rounded-bl-lg rounded-br-lg"
				>
					<div className="w-8 h-8 rounded-full bg-button-secondary flex items-center justify-center">
						<MezonIcon icon={MzIcons20.mzSearch} className="text-[var(--mz-icon)]" />
					</div>
					<div className="flex-1 text-left">
						<p className="text-sm font-medium">Find Channel App</p>
						<p className="text-xs opacity-60">Discover more apps</p>
					</div>
					<MezonIcon icon={MzIcons20.mzChevronRight} className="text-[var(--mz-icon)]" />
				</button>
			</div>
		</div>
	);
};
