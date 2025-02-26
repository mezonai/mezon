import { ChannelList, ChannelTopbar, ClanHeader, FooterProfile, ModalCreateClan, NavLinkComponent, SidebarClanItem, SidebarLogoItem, StreamInfo, UpdateButton, VoiceInfo } from '@mezon/components';
import { EmojiSuggestionProvider, useGifsStickersEmoji, useMenu } from '@mezon/core';
import {
  selectAllAccount,
  selectAllClans,
  selectClanView,
  selectCloseMenu,
  selectCurrentChannel,
  selectCurrentClan,
  selectCurrentClanId,
  selectDirectsUnreadlist,
  selectIsElectronDownloading,
  selectIsElectronUpdateAvailable,
  selectIsInCall,
  selectIsJoin,
  selectIsShowChatStream,
  selectIsShowCreateThread,
  selectIsShowCreateTopic,
  selectStatusMenu,
  selectVoiceFullScreen,
  selectVoiceJoined,
  threadsActions,
  topicsActions
} from '@mezon/store';
import { ESummaryInfo, IClan, SubPanelName, isLinuxDesktop, isMacDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { memo, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import ChatStream from '../pages/chatStream';
import Setting from '../pages/setting';
import ThreadsMain from '../pages/thread';
import TopicDiscussionMain from '../pages/topicDiscussion';
import DirectUnread from '../pages/main/directUnreads';
import { useModal } from 'react-modal-hook';


const TestLayout = () => {
  const currentClan = useSelector(selectCurrentClan);
  const userProfile = useSelector(selectAllAccount);
  const closeMenu = useSelector(selectCloseMenu);
  const statusMenu = useSelector(selectStatusMenu);
  const isShowChatStream = useSelector(selectIsShowChatStream);
  const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
  const IsElectronDownloading = useSelector(selectIsElectronDownloading);
  const location = useLocation();
  const currentURL = isElectron() ? location.hash : location.pathname;
  const memberPath = `/chat/clans/${currentClan?.clan_id}/member-safety`;
  const currentChannel = useSelector(selectCurrentChannel);
  const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
  const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
  const chatStreamRef = useRef<HTMLDivElement | null>(null);
  const isInCall = useSelector(selectIsInCall);
  const isJoin = useSelector(selectIsJoin);
  const dispatch = useDispatch();
  const { setSubPanelActive } = useGifsStickersEmoji();
  const onMouseDownTopicBox = () => {
    setSubPanelActive(SubPanelName.NONE);
    dispatch(topicsActions.setFocusTopicBox(true));
    dispatch(threadsActions.setFocusThreadBox(false));
  };
  const onMouseDownThreadBox = () => {
    setSubPanelActive(SubPanelName.NONE);
    dispatch(topicsActions.setFocusTopicBox(false));
    dispatch(threadsActions.setFocusThreadBox(true));
  };
  const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
  const isVoiceJoined = useSelector(selectVoiceJoined);
	const [openCreateClanModal, closeCreateClanModal] = useModal(() => <ModalCreateClan open={true} onClose={closeCreateClanModal} />);

  return (
    <div className={`flex h-screen min-[480px]:pl-[72px] ${closeMenu ? (statusMenu ? 'pl-[72px]' : '') : ''} overflow-hidden text-gray-100 relative dark:bg-bgPrimary bg-bgLightModeSecond`}>
      <SidebarMenu openCreateClanModal={openCreateClanModal} />

      <EmojiSuggestionProvider isMobile={false}>
        <div
          className={`select-none flex-col flex max-w-[272px] dark:bg-bgSecondary bg-bgLightSecondary relative overflow-hidden min-w-widthMenuMobile sbm:min-w-[272px]  ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} ${closeMenu ? (statusMenu ? 'flex' : 'hidden') : ''}`}
        >
          <ClanHeader name={currentClan?.clan_name} type="CHANNEL" bannerImage={currentClan?.banner} />
          <ChannelList />
          <div id="clan-footer">
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
          <div
            className={`flex flex-col flex-1 shrink ${isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'max-sm:hidden' : ''} min-w-0 bg-transparent h-[100%] overflow-visible ${currentChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ? 'group' : ''}`}
          >
            <ChannelTopbar channel={currentChannel} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
            {(currentChannel?.type !== ChannelType.CHANNEL_TYPE_STREAMING || memberPath === currentURL) && <Outlet />}
          </div>

          {isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL && (
            <div ref={chatStreamRef} className="flex flex-col flex-1 max-w-[480px] min-w-60 dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
              <ChatStream currentChannel={currentChannel} />
            </div>
          )}
        </div>
        {isShowCreateThread && !isShowCreateTopic && (
          <div onMouseDown={onMouseDownThreadBox} className="w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
            <ThreadsMain />
          </div>
        )}

        {isShowCreateTopic && !isShowCreateThread && (
          <div onMouseDown={onMouseDownTopicBox} className="w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
            <TopicDiscussionMain />
          </div>
        )}
        <Setting isDM={false} />
      </EmojiSuggestionProvider>
    </div>
  );
};

export default TestLayout;
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
