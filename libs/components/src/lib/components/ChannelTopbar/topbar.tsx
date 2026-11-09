import { usePathMatch } from '@mezon/core';
import {
	selectCloseMenu,
	selectCurrentChannelChannelId,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectStatusMenu,
	selectVoiceInfo,
	selectVoiceJoined,
	useAppSelector
} from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import type { ChannelStreamMode } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { memo, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import ChannelTopbar from '.';

export type ChannelTopbarProps = {
	readonly channel?: Readonly<IChannel> | null;
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
	isChannelPath?: boolean;
	isHidden?: boolean;
};

const Topbar = memo(({ isHidden = false, children }: { isHidden?: boolean; children?: ReactNode }) => {
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isJoined = useSelector(selectVoiceJoined);
	const voiceInfo = useSelector(selectVoiceInfo);
	const currentChannelClanId = useSelector(selectCurrentChannelClanId);
	const currentChannelChannelId = useSelector(selectCurrentChannelChannelId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const { isFriendPath, isMemberPath } = usePathMatch({
		isFriendPath: `/chat/direct/friends`,
		isMemberPath: `/chat/clans/${currentClanId}/member-safety`
	});
	// Thread panel flag is keyed by routing channel id (ClanLayout / useThreads), not voice channel_id.
	const channelIdForThreadPanel = currentChannelId ?? currentChannelChannelId ?? '';
	const isShowCreateThread = useAppSelector((state) => selectIsShowCreateThread(state, channelIdForThreadPanel));

	// Mirror exactly the two panel conditions used in ClanLayout:
	//   thread panel: isShowCreateThread && !isShowCreateTopic (no channel-type guard)
	//   topic panel:  isShowCreateTopic && !isShowCreateThread && not streaming/voice
	const isThreadPanelOpen = Boolean(currentClanId && currentClanId !== '0') && isShowCreateThread && !isShowCreateTopic;

	const isTopicPanelOpen =
		Boolean(currentClanId && currentClanId !== '0') &&
		isShowCreateTopic &&
		!isShowCreateThread &&
		currentChannelType !== ChannelType.CHANNEL_TYPE_STREAMING &&
		currentChannelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const isSidePanelOpen = isThreadPanelOpen || isTopicPanelOpen;
	const isStreamChatOpen = isShowChatStream && currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING && !isMemberPath;

	const isInCurrentVoiceChannel = useMemo(() => {
		return isJoined && voiceInfo?.clanId === currentChannelClanId && voiceInfo?.channelId === currentChannelChannelId;
	}, [isJoined, voiceInfo, currentChannelClanId, currentChannelChannelId]);

	return (
		<div
			className={`${isFriendPath || isHidden || (closeMenu && statusMenu) || isInCurrentVoiceChannel ? 'hidden' : ''} border-b-theme-primary bg-theme-chat max-sbm:bg-transparent max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center ${
				isSidePanelOpen
					? `sbm:left-[344px] ${isTopicPanelOpen ? 'sbm:right-[500px]' : 'sbm:right-[510px]'} sbm:w-auto`
					: `sbm:right-0 sbm:w-widthThumnailAttachment ${isStreamChatOpen ? 'xl:left-[344px] xl:right-[500px] xl:w-auto' : ''}`
			} max-sbm:w-full max-sbm:h-[50px] max-sbm:right-0 flex-shrink fixed z-10 border-b-theme-nav text-theme-primary`}
		>
			<ChannelTopbar>{children}</ChannelTopbar>
		</div>
	);
});

export default Topbar;
