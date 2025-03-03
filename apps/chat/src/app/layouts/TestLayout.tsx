import {
	ChannelList,
	ChannelTopbar,
	ClanHeader,
	DirectMessageList,
	DmTopbar,
	FooterProfile,
	MemberListGroupChat,
	ModalCreateClan,
	NavLinkComponent,
	SidebarClanItem,
	SidebarLogoItem,
	StreamInfo,
	UpdateButton,
	VoiceInfo
} from '@mezon/components';
import { EmojiSuggestionProvider, useAppNavigation, useAppParams, useMenu, usePermissionChecker } from '@mezon/core';
import {
	ChannelsEntity,
	ETypeMission,
	onboardingActions,
	selectAllAccount,
	selectAllClans,
	selectChannelById,
	selectClanView,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentClanId,
	selectDirectById,
	selectDirectsUnreadlist,
	selectDmGroupCurrent,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectIsJoin,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectProcessingByClan,
	selectStatusMenu,
	selectVoiceFullScreen,
	selectVoiceJoined,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	DONE_ONBOARDING_STATUS,
	EOverriddenPermission,
	ESummaryInfo,
	IClan,
	isLinuxDesktop,
	isMacDesktop,
	isWindowsDesktop,
	titleMission
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiOnboardingItem } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { ChannelMessageBox } from '../pages/channel/ChannelMessageBox';
import { ChannelTyping } from '../pages/channel/ChannelTyping';
import DirectUnread from '../pages/main/directUnreads';
import Setting from '../pages/setting';
import SideLayout from './SideLayout';
type ChannelMainContentTextProps = {
	channelId: string;
	canSendMessage: boolean;
};

const ChannelMainContentText = ({ channelId, canSendMessage }: ChannelMainContentTextProps) => {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId ?? ''));
	const currentDm = useAppSelector((state) => selectDirectById(state, channelId ?? ''));

	const isShowMemberList = useSelector(selectIsShowMemberList);
	const mode = useMemo(() => {
		if (currentChannel) {
			switch (currentChannel?.type || currentDm?.type) {
				case ChannelType.CHANNEL_TYPE_THREAD:
					return ChannelStreamMode.STREAM_MODE_THREAD;
				default:
					return ChannelStreamMode.STREAM_MODE_CHANNEL;
			}
		}
		switch (currentDm?.type) {
			case ChannelType.CHANNEL_TYPE_GROUP:
				return ChannelStreamMode.STREAM_MODE_GROUP;
			default:
				return ChannelStreamMode.STREAM_MODE_DM;
		}
	}, [currentChannel, currentDm]);

	const [canSendMessageDelayed, setCanSendMessageDelayed] = useState(true);
	const currentClan = useSelector(selectCurrentClan);
	const missionDone = useSelector(selectMissionDone);
	const missionSum = useSelector(selectMissionSum);
	const onboardingClan = useAppSelector((state) => selectOnboardingByClan(state, currentChannel?.clan_id as string));
	const currentMission = useMemo(() => {
		return onboardingClan.mission[missionDone];
	}, [missionDone, channelId]);
	const selectUserProcessing = useSelector(selectProcessingByClan(currentClan?.clan_id as string));

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		timerRef.current = setTimeout(() => {
			setCanSendMessageDelayed(canSendMessage);
		}, 500);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [canSendMessage]);

	const previewMode = useSelector(selectOnboardingMode);
	const showPreviewMode = useMemo(() => {
		if (previewMode) {
			return true;
		}
		return selectUserProcessing?.onboarding_step !== DONE_ONBOARDING_STATUS && currentClan?.is_onboarding;
	}, [selectUserProcessing?.onboarding_step, currentClan?.is_onboarding, previewMode]);

	if (!canSendMessageDelayed) {
		return (
			<div
				style={{ height: 44 }}
				className="opacity-80 dark:bg-[#34363C] bg-[#F5F6F7] ml-4 mb-4 py-2 pl-2 w-widthInputViewChannelPermission dark:text-[#4E504F] text-[#D5C8C6] rounded one-line"
			>
				You do not have permission to send messages in this channel.
			</div>
		);
	}

	return (
		<div className={`flex-shrink flex flex-col dark:bg-bgPrimary bg-bgLightPrimary h-auto relative ${isShowMemberList ? 'w-full' : 'w-full'}`}>
			{showPreviewMode && <OnboardingGuide currentMission={currentMission} missionSum={missionSum} missionDone={missionDone} />}
			{(currentChannel || currentDm) && (
				<ChannelMessageBox clanId={currentChannel?.clan_id} channel={currentChannel || (currentDm as ChannelsEntity)} mode={mode} />
			)}
			{(currentChannel || currentDm) && (
				<ChannelTyping channelId={currentChannel?.id} mode={mode} isPublic={currentChannel ? !currentChannel?.channel_private : false} />
			)}
		</div>
	);
};

const TestLayout = () => {
	const { directId, channelId, clanId } = useAppParams();
	const userProfile = useSelector(selectAllAccount);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const location = useLocation();
	const currentURL = isElectron() ? location.hash : location.pathname;
	const memberPath = `/chat/clans/1/member-safety`;
	const currentChannel = useSelector(selectCurrentChannel);

	const isInCall = useSelector(selectIsInCall);
	const isJoin = useSelector(selectIsJoin);

	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const isVoiceJoined = useSelector(selectVoiceJoined);
	const [openCreateClanModal, closeCreateClanModal] = useModal(() => <ModalCreateClan open={true} onClose={closeCreateClanModal} />);
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], directId || (channelId as string));

	return (
		<div
			className={`flex h-screen min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative dark:bg-bgPrimary bg-bgLightModeSecond`}
		>
			<SidebarMenu openCreateClanModal={openCreateClanModal} />

			<EmojiSuggestionProvider isMobile={false}>
				<div
					className={`select-none h-screen flex-col justify-between flex max-w-[272px] dark:bg-bgSecondary bg-bgLightSecondary relative overflow-hidden min-w-widthMenuMobile sbm:min-w-[272px]  ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} ${closeMenu ? (statusMenu ? 'flex' : 'hidden') : ''}`}
				>
					<ClanHeader />
					{clanId ? <ChannelList /> : <DirectMessageList />}
					<div id="clan-footer" className="h-14">
						{isInCall && <StreamInfo type={ESummaryInfo.CALL} />}
						{isJoin && <StreamInfo type={ESummaryInfo.STREAM} />}
						{isVoiceJoined && <VoiceInfo />}
						{(isElectronUpdateAvailable || IsElectronDownloading) && <UpdateButton isDownloading={!isElectronUpdateAvailable} />}
						<div style={{ height: 56, width: '100%' }}>
							<FooterProfile
								name={userProfile?.user?.display_name || userProfile?.user?.username || ''}
								status={userProfile?.user?.online}
								avatar={userProfile?.user?.avatar_url || ''}
								userId={userProfile?.user?.id || ''}
								isDM={false}
							/>
						</div>
					</div>
				</div>
				<div
					className={`flex flex-1 shrink min-w-0 gap-2 ${isVoiceFullScreen ? 'z-20' : ''} ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'dark:bg-bgTertiary bg-bgLightTertiary' : ''}`}
				>
					<div className="flex flex-col flex-1">
						{clanId ? (
							<ChannelTopbar channel={currentChannel} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
						) : (
							<DmTopbar dmGroupId={directId} isHaveCallInChannel={false} />
						)}

						<div className={`flex w-full flex-1`}>
							<div
								className={`flex flex-col flex-1 shrink justify-between ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'max-sm:hidden' : ''} min-w-0 bg-transparent overflow-visible ${currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? 'group' : ''}`}
							>
								{(currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING || memberPath === currentURL) && (
									<div className="flex-1 h-heightMessageViewChat">
										<Outlet />
									</div>
								)}
								<ChannelMainContentText canSendMessage={canSendMessage} channelId={directId ? directId : (channelId as string)} />
							</div>
							<ListMemberChannel />
						</div>
					</div>
					{clanId ? <SideLayout /> : null}
				</div>

				<Setting isDM={false} />
			</EmojiSuggestionProvider>
		</div>
	);
};

export default TestLayout;

const ListMemberChannel = () => {
	const { directId } = useAppParams();
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const currentDmGroup = useSelector(selectDmGroupCurrent(directId ?? ''));
	const currentChannel = useSelector(selectCurrentChannel);
	const closeMenu = useSelector(selectCloseMenu);

	return (
		<>
			{Number(currentChannel?.type) === ChannelType.CHANNEL_TYPE_GROUP && isShowMemberListDM && (
				<div
					className={`dark:bg-bgSecondary bg-bgLightSecondary overflow-y-scroll h-[calc(100vh_-_60px)] thread-scroll ${isShowMemberListDM ? 'flex' : 'hidden'} ${closeMenu ? 'w-full' : 'w-[241px]'}`}
				>
					<MemberListGroupChat directMessageId={directId} createId={currentDmGroup?.creator_id} />
				</div>
			)}
		</>
	);
};

type ShowModal = () => void;

const SidebarMenu = memo(
	({ openCreateClanModal }: { openCreateClanModal: ShowModal }) => {
		const clans = useSelector(selectAllClans);
		clans.sort((a, b) => {
			const nameA = a.clan_name ?? '';
			const nameB = b.clan_name ?? '';

			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0;
		});
		const listUnreadDM = useSelector(selectDirectsUnreadlist);
		const [listDmRender, setListDmRender] = useState(listUnreadDM);
		const countUnreadRender = useRef(listDmRender.map((channel) => channel.id));
		const isClanView = useSelector(selectClanView);
		const currentClanId = useSelector(selectCurrentClanId);
		const closeMenu = useSelector(selectCloseMenu);
		const statusMenu = useSelector(selectStatusMenu);

		const { setCloseMenu, setStatusMenu } = useMenu();

		useEffect(() => {
			const handleSizeWidth = () => {
				if (window.innerWidth < 480) {
					setCloseMenu(true);
				} else {
					setCloseMenu(false);
				}
			};

			handleSizeWidth();

			if (closeMenu) {
				setStatusMenu(false);
			}

			const handleResize = () => {
				handleSizeWidth();
			};

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}, []);

		const handleMenu = (event: MouseEvent) => {
			const elementClick = event.target as HTMLDivElement;
			const wrapElement = document.querySelector('#menu');
			if (!closeMenu) {
				return;
			}
			if (elementClick.classList.contains('clan')) {
				if (elementClick.classList.contains('choose')) {
					setStatusMenu(false);
					elementClick.classList.remove('choose');
				} else {
					setStatusMenu(true);
					const elementOld = wrapElement?.querySelector('.choose');
					if (elementOld) {
						elementOld.classList.remove('choose');
					}
					elementClick.classList.add('choose');
				}
			}
		};

		const timerRef = useRef<NodeJS.Timeout | null>(null);
		const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
		useEffect(() => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			if (listUnreadDM.length > countUnreadRender.current.length) {
				setListDmRender(listUnreadDM);
				countUnreadRender.current = listUnreadDM.map((channel) => channel.id);
			} else {
				countUnreadRender.current = listUnreadDM.map((channel) => channel.id);
				timerRef.current = setTimeout(() => {
					setListDmRender(listUnreadDM);
				}, 1000);
			}
		}, [listUnreadDM]);
		return (
			<div
				className={`fixed z-10 left-0 top-0 w-[72px] dark:bg-bgTertiary bg-bgLightTertiary duration-100 ${isWindowsDesktop || isLinuxDesktop ? 'mt-[21px]' : ''} ${isMacDesktop ? 'pt-[18px]' : ''} ${closeMenu ? (statusMenu ? '' : 'hidden') : ''}`}
				onClick={() => handleMenu}
				id="menu"
			>
				<div
					className={`top-0 left-0 right-0 flex flex-col items-center py-4 px-3 overflow-y-auto hide-scrollbar ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : 'h-screen'} `}
				>
					<div className="flex flex-col ">
						<SidebarLogoItem />
						{!!listDmRender?.length &&
							listDmRender.map((dmGroupChatUnread) => (
								<DirectUnread key={dmGroupChatUnread.id} directMessage={dmGroupChatUnread} checkMoveOut={countUnreadRender.current} />
							))}
					</div>
					<div className="border-t-2 my-2 dark:border-t-borderDividerLight border-t-buttonLightTertiary"></div>
					<div className="flex flex-col gap-3 ">
						{clans.map((clan: IClan) => {
							return (
								<SidebarClanItem
									key={clan.id}
									linkClan={`/chat/clans/${clan.id}${idsSelectedChannel[clan.id] ? `/channels/${idsSelectedChannel[clan.id]}` : ''}`}
									option={clan}
									active={isClanView && currentClanId === clan.clan_id}
								/>
							);
						})}
					</div>
					<div className="mt-3">
						<NavLinkComponent>
							<div
								className="w-full h-full flex items-center justify-between text-contentSecondary rounded-md cursor-pointer hover:bg-bgLightModeButton group"
								onClick={openCreateClanModal}
							>
								<div className="dark:bg-bgPrimary bg-[#E1E1E1] flex justify-center items-center rounded-full cursor-pointer dark:group-hover:bg-slate-800 group-hover:bg-bgLightModeButton  transition-all duration-200 size-12">
									<p className="text-2xl font-bold text-[#155EEF]">+</p>
								</div>
							</div>
						</NavLinkComponent>
					</div>
				</div>
			</div>
		);
	},
	() => true
);

const OnboardingGuide = ({
	currentMission,
	missionDone,
	missionSum
}: {
	currentMission: ApiOnboardingItem;
	missionDone: number;
	missionSum: number;
}) => {
	const { navigate, toChannelPage } = useAppNavigation();
	const dispatch = useAppDispatch();

	const handleDoNextMission = useCallback(() => {
		if (currentMission) {
			switch (currentMission.task_type) {
				case ETypeMission.SEND_MESSAGE: {
					const link = toChannelPage(currentMission.channel_id as string, currentMission.clan_id as string);
					navigate(link);
					break;
				}
				case ETypeMission.VISIT: {
					const linkChannel = toChannelPage(currentMission.channel_id as string, currentMission.clan_id as string);
					navigate(linkChannel);
					dispatch(onboardingActions.doneMission({ clan_id: currentMission.clan_id as string }));
					doneAllMission();
					break;
				}
				case ETypeMission.DOSOMETHING: {
					dispatch(onboardingActions.doneMission({ clan_id: currentMission.clan_id as string }));
					doneAllMission();
					break;
				}
				default:
					break;
			}
		}
	}, [currentMission?.id, missionDone]);

	const channelMission = useSelector((state) => selectChannelById(state, currentMission?.channel_id as string));
	const doneAllMission = useCallback(() => {
		if (missionDone + 1 === missionSum) {
			dispatch(onboardingActions.doneOnboarding({ clan_id: currentMission?.clan_id as string }));
		}
	}, [missionDone]);
	return (
		<>
			{missionDone < missionSum && currentMission ? (
				<div
					className="absolute rounded-t-md w-[calc(100%_-_32px)] h-14 left-4 bg-bgTertiary -top-12 flex pt-2 px-4 pb-4 items-center gap-3"
					onClick={handleDoNextMission}
				>
					<Icons.Hashtag />
					<div className=" flex flex-col">
						<div className="text-base font-semibold">{currentMission.title} </div>
						<div className="text-[10px] font-normal text-channelTextLabel">
							{' '}
							{titleMission[currentMission.task_type ? currentMission.task_type - 1 : 0]}{' '}
							<strong className="text-channelActiveColor">#{channelMission.channel_label}</strong>{' '}
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};
