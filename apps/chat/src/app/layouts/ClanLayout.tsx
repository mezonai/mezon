import { ChannelList, ChannelTopbar, ClanHeader, FooterProfile, StreamInfo, UpdateButton } from '@mezon/components';
import { useApp, useAppParams } from '@mezon/core';
import {
	ChannelsEntity,
	ClansEntity,
	appActions,
	selectAllAccount,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentStreamInfo,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectStatusMenu,
	selectStatusStream,
	useAppDispatch,
	videoStreamActions,
	voiceActions
} from '@mezon/store';
import { ESummaryInfo, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ChatStream from '../pages/chatStream';
import Setting from '../pages/setting';
import ThreadsMain from '../pages/thread';
import TopicDiscussionMain from '../pages/topicDiscussion';

const ClanEffects: React.FC<{
	chatStreamRef: React.RefObject<HTMLDivElement>;
	currentChannel: ChannelsEntity | null;
	currentClan: ClansEntity | null;
	isShowChatStream: boolean;
	isShowCreateThread: boolean;
	isShowCreateTopic: boolean;
}> = ({ currentClan, currentChannel, chatStreamRef, isShowChatStream, isShowCreateThread, isShowCreateTopic }) => {
	// move code thanh.levan

	const { canvasId } = useAppParams();
	const dispatch = useAppDispatch();
	const { setIsShowMemberList } = useApp();
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);

	useEffect(() => {
		const updateChatStreamWidth = () => {
			if (chatStreamRef.current && isShowChatStream) {
				dispatch(appActions.setChatStreamWidth(chatStreamRef.current.offsetWidth));
			}
		};

		updateChatStreamWidth();
		window.addEventListener('resize', updateChatStreamWidth);

		return () => {
			window.removeEventListener('resize', updateChatStreamWidth);
		};
	}, [isShowChatStream]);

	useEffect(() => {
		if (
			currentClan &&
			currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING &&
			currentStreamInfo?.clanId !== currentClan.id &&
			currentStreamInfo?.streamId !== currentChannel.channel_id
		) {
			dispatch(
				videoStreamActions.startStream({
					clanId: currentClan.id || '',
					clanName: currentClan.clan_name || '',
					streamId: currentChannel.channel_id || '',
					streamName: currentChannel.channel_label || '',
					parentId: currentChannel.parrent_id || ''
				})
			);
			dispatch(appActions.setIsShowChatStream(false));
		}
		if (!canvasId) {
			dispatch(appActions.setIsShowCanvas(false));
		}
	}, [currentStreamInfo, currentClan, currentChannel]);

	useEffect(() => {
		if (isShowCreateThread || isShowCreateTopic) {
			setIsShowMemberList(false);
		}
	}, [isShowCreateThread, isShowCreateTopic]);

	const checkTypeChannel = currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE;
	useEffect(() => {
		if (checkTypeChannel) {
			dispatch(voiceActions.setStatusCall(checkTypeChannel));
		}
	}, [currentChannel?.type]);

	return null;
};

const ClanLayout = () => {
	const currentClan = useSelector(selectCurrentClan);
	const userProfile = useSelector(selectAllAccount);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const streamPlay = useSelector(selectStatusStream);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);

	const currentURL = isElectron() ? window.location.hash : window.location.pathname;
	const memberPath = `/chat/clans/${currentClan?.clan_id}/member-safety`;
	const currentChannel = useSelector(selectCurrentChannel);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
	const isShowCreateTopic = useSelector((state) => selectIsShowCreateTopic(state, currentChannel?.id as string));
	const chatStreamRef = useRef<HTMLDivElement | null>(null);
	const isInCall = useSelector(selectIsInCall);

	return (
		<>
			<div
				className={`select-none flex-col flex max-w-[272px] dark:bg-bgSecondary bg-bgLightSecondary relative overflow-hidden min-w-widthMenuMobile sbm:min-w-[272px]  ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} ${closeMenu ? (statusMenu ? 'flex' : 'hidden') : ''}`}
			>
				<ClanHeader name={currentClan?.clan_name} type="CHANNEL" bannerImage={currentClan?.banner} />
				<ChannelList />
				<div id="clan-footer">
					{isInCall && <StreamInfo type={ESummaryInfo.CALL} />}
					{streamPlay && <StreamInfo type={ESummaryInfo.STREAM} />}
					{(isElectronUpdateAvailable || IsElectronDownloading) && <UpdateButton isDownloading={!isElectronUpdateAvailable} />}
					<FooterProfile
						name={userProfile?.user?.display_name || userProfile?.user?.username || ''}
						status={userProfile?.user?.online}
						avatar={userProfile?.user?.avatar_url || ''}
						userId={userProfile?.user?.id || ''}
						isDM={false}
					/>
				</div>
			</div>
			<div
				className={`flex flex-1 shrink min-w-0 gap-2 ${currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'dark:bg-bgTertiary bg-bgLightTertiary' : ''}`}
			>
				<div
					className={`flex flex-col flex-1 shrink ${isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL ? 'max-sm:hidden' : ''} min-w-0 bg-transparent h-[100%] overflow-visible ${currentChannel?.type === ChannelType.CHANNEL_TYPE_VOICE ? 'group' : ''}`}
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
				<div className="w-[480px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
					<ThreadsMain />
				</div>
			)}

			{isShowCreateTopic && !isShowCreateThread && (
				<div className="w-[480px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">
					<TopicDiscussionMain />
				</div>
			)}
			<Setting isDM={false} />

			<ClanEffects
				currentChannel={currentChannel}
				currentClan={currentClan}
				chatStreamRef={chatStreamRef}
				isShowChatStream={isShowChatStream}
				isShowCreateThread={isShowCreateThread}
				isShowCreateTopic={isShowCreateTopic}
			/>
		</>
	);
};

export default ClanLayout;
