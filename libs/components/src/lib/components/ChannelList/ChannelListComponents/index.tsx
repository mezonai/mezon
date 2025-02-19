import { useAppNavigation, useClans, useEventManagementQuantity, usePathMatch, usePermissionChecker } from '@mezon/core';
import {
	EventManagementOnGogoing,
	eventManagementActions,
	onboardingActions,
	selectCurrentClan,
	selectCurrentClanId,
	selectEventLoading,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectOngoingEvent,
	selectProcessingByClan,
	selectShowNumEvent,
	selectTheme,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DONE_ONBOARDING_STATUS, EPermission } from '@mezon/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import EventModal from '../EventChannelModal';

export const Events = memo(() => {
	const ongoingEvent = useSelector(selectOngoingEvent);
	const [openModalDetail, setOpenModalDetail] = useState(false);
	const previewMode = useSelector(selectOnboardingMode);
	const { setClanShowNumEvent } = useClans();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClan = useSelector(selectCurrentClan);
	const showNumEvent = useSelector(selectShowNumEvent(currentClanId || ''));
	const onboardingByClan = useSelector((state) => selectOnboardingByClan(state, currentClanId as string));
	const [checkAdminPermission] = usePermissionChecker([EPermission.administrator]);
	const appearanceTheme = useSelector(selectTheme);

	const { numberEventManagement, numberEventUpcoming } = useEventManagementQuantity();
	const closeModal = () => {
		closeEventModal();
	};

	const openModal = () => {
		openEventModal();
		setClanShowNumEvent(false);
	};

	const handleOpenDetail = () => {
		openEventModal();
		setOpenModalDetail(true);
	};

	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const channelSettingPath = `/chat/clans/${currentClanId}/channel-setting`;
	const serverGuidePath = `/chat/clans/${currentClanId}/guide`;
	const { isMemberPath, isSettingPath, isGuidePath } = usePathMatch({
		isMemberPath: memberPath,
		isSettingPath: channelSettingPath,
		isGuidePath: serverGuidePath
	});

	const [openEventModal, closeEventModal] = useModal(() => {
		return <EventModal onClose={closeModal} openModalDetail={openModalDetail} setOpenModalDetail={setOpenModalDetail} />;
	}, []);

	const dispatch = useAppDispatch();
	const selectUserProcessing = useSelector(selectProcessingByClan(currentClan?.clan_id as string));
	useEffect(() => {
		if (currentClan?.is_onboarding) {
			dispatch(onboardingActions.fetchOnboarding({ clan_id: currentClanId as string }));
			dispatch(onboardingActions.fetchProcessingOnboarding({}));
		}
	}, [currentClan?.is_onboarding]);

	const checkPreviewMode = useMemo(() => {
		if (previewMode) {
			return true;
		}
		return selectUserProcessing?.onboarding_step !== DONE_ONBOARDING_STATUS && onboardingByClan?.mission.length > 0 && currentClan?.is_onboarding;
	}, [selectUserProcessing?.onboarding_step, onboardingByClan?.mission.length, previewMode, currentClan?.is_onboarding]);

	const eventLoading = useSelector(selectEventLoading);

	return (
		<>
			{checkPreviewMode && <OnboardingGetStart link={serverGuidePath} clanId={currentClanId as string} />}

			{ongoingEvent && <EventNotification event={ongoingEvent} handleOpenDetail={handleOpenDetail} />}

			{currentClan && currentClan.is_onboarding && (
				<Link
					to={serverGuidePath}
					className={`self-stretch inline-flex cursor-pointer px-2 rounded h-[34px] ${isGuidePath ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight' : ''} dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex">
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5 left-[1.67px] top-[1.67px] absolute">
								<Icons.GuideIcon defaultSize="w-5 h-5 dark:fill-channelTextLabel" defaultFill="" />
							</div>
						</div>
						<div className="w-[99px] dark:text-channelTextLabel text-colorTextLightMode text-base font-medium">Clan Guide</div>
					</div>
				</Link>
			)}

			<div
				className="self-stretch  items-center inline-flex cursor-pointer px-2 rounded h-[34px] dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton"
				onClick={openModal}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex">
					<div className="w-5 h-5 relative flex flex-row items-center">
						<div className="w-5 h-5 left-[1.67px] top-[1.67px] absolute">
							<Icons.IconEvents />
						</div>
					</div>
					<div className="w-[99px] dark:text-channelTextLabel text-colorTextLightMode text-base font-medium">
						{numberEventManagement === 0 && 'Events'}
						{numberEventManagement === 1 && '1 Event'}
						{numberEventManagement > 1 && `${numberEventManagement} Events`}
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
				className={`self-stretch inline-flex cursor-pointer px-2 rounded h-[34px] ${isMemberPath ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight' : ''} dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight`}
			>
				<div className="grow w-5 flex-row items-center gap-2 flex">
					<div className="w-5 h-5 relative flex flex-row items-center">
						<div className="w-5 h-5 left-[1.67px] top-[1.67px] absolute">
							<Icons.MemberList defaultSize="w-5 h-5 dark:text-channelTextLabel" />
						</div>
					</div>
					<div className="w-[99px] dark:text-channelTextLabel text-colorTextLightMode text-base font-medium">Members</div>
				</div>
			</Link>
			{checkAdminPermission ? (
				<Link
					to={channelSettingPath}
					className={`self-stretch inline-flex cursor-pointer px-2 rounded h-[34px] ${isSettingPath ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight' : ''} dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight`}
				>
					<div className="grow w-5 flex-row items-center gap-2 flex">
						<div className="w-5 h-5 relative flex flex-row items-center">
							<div className="w-5 h-5">
								<Icons.SettingProfile className="w-5 h-5 dark:text-channelTextLabel text-colorTextLightMode" />
							</div>
						</div>
						<div className="w-full dark:text-channelTextLabel text-colorTextLightMode text-base font-medium">Channels</div>
					</div>
				</Link>
			) : null}
		</>
	);
});

const EventNotification = ({ event, handleOpenDetail }: { event: EventManagementOnGogoing; handleOpenDetail: () => void }) => {
	const dispatch = useDispatch();
	const handleCloseEvent = () => {
		dispatch(eventManagementActions.clearOngoingEvent(null));
	};
	return (
		<div className="w-[90%] mx-auto my-2 text-sm">
			<div className="flex justify-between">
				<div className="flex items-center">
					<div className="w-2 h-2 rounded-full bg-green-500"></div>
					<p className="text-green-500 text-base font-bold ml-2">Ongoing Event</p>
				</div>
				<Icons.CloseButton className="w-3 h-3 mt-2" onClick={handleCloseEvent} />
			</div>
			<p className="text-channelActiveLightColor dark:text-channelActiveColor mt-3 text-base font-medium">{event.title}</p>
			<div className="flex mt-2">
				<Icons.Location defaultFill="text-channelActiveLightColor dark:text-channelActiveColor" />
				<p className="ml-2 text-channelActiveLightColor dark:text-channelActiveColor">{event.address}</p>
			</div>
			<div className="text-center py-1 bg-green-700 mt-2 rounded select-none" onClick={handleOpenDetail}>
				<p className=" text-channelActiveLightColor dark:text-channelActiveColor  font-medium">Event detail</p>
			</div>
		</div>
	);
};

const OnboardingGetStart = ({ link, clanId }: { link: string; clanId: string }) => {
	const missionDone = useSelector(selectMissionDone);
	const missionSum = useSelector(selectMissionSum);

	const completionPercentage = useMemo(() => {
		return missionDone ? (missionDone / missionSum) * 100 - 100 : -97;
	}, [missionDone, missionSum]);
	const dispatch = useAppDispatch();
	const { navigate } = useAppNavigation();
	const handleNavigate = () => {
		navigate(link);
	};

	useEffect(() => {
		dispatch(onboardingActions.fetchOnboarding({ clan_id: clanId }));
	}, []);

	return (
		<div className="w-full h-12 flex flex-col gap-2 relative px-2" onClick={handleNavigate}>
			<div className="flex justify-between">
				<p className="text-sm font-bold text-white">Get Started</p>
				<div className="flex gap-[1px] items-center">
					<p className="text-xs font-bold text-white">{missionDone}</p>
					<p className="text-xs">of</p>
					<p className="text-xs font-bold text-white">{missionSum}</p>
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
			<hr className="absolute bottom-1 left-0 h-[0.08px] w-full dark:border-borderDivider border-white" />
		</div>
	);
};
