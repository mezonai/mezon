import { useAppNavigation, useEventManagementQuantity, usePathMatch, usePermissionChecker } from '@mezon/core';
import type { EventManagementOnGogoing } from '@mezon/store';
import {
	channelsActions,
	clansActions,
	eventManagementActions,
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
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
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
