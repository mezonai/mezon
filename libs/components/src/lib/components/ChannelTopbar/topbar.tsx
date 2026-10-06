import { usePathMatch } from '@mezon/core';
import {
	selectCloseMenu,
	selectCurrentChannelChannelId,
	selectCurrentChannelClanId,
	selectCurrentChannelType,
	selectCurrentClanId,
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
	const { isFriendPath } = usePathMatch({
		isFriendPath: `/chat/direct/friends`
	});
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isJoined = useSelector(selectVoiceJoined);
	const voiceInfo = useSelector(selectVoiceInfo);
	const currentChannelClanId = useSelector(selectCurrentChannelClanId);
	const currentChannelId = useSelector(selectCurrentChannelChannelId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const currentClanId = useSelector(selectCurrentClanId);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const isShowCreateThread = useAppSelector((state) => selectIsShowCreateThread(state, currentChannelId as string));

	const isSidePanelOpen = useMemo(() => {
		return Boolean(
			currentClanId &&
				currentClanId !== '0' &&
				currentChannelType !== ChannelType.CHANNEL_TYPE_STREAMING &&
				currentChannelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
				(isShowCreateTopic || isShowCreateThread)
		);
	}, [currentClanId, currentChannelType, isShowCreateTopic, isShowCreateThread]);

	const isInCurrentVoiceChannel = useMemo(() => {
		return isJoined && voiceInfo?.clanId === currentChannelClanId && voiceInfo?.channelId === currentChannelId;
	}, [isJoined, voiceInfo, currentChannelClanId, currentChannelId]);

	return (
		<div
			className={`${isFriendPath || isHidden || (closeMenu && statusMenu) || isInCurrentVoiceChannel ? 'hidden' : ''} border-b-theme-primary bg-theme-chat max-sbm:bg-transparent max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center ${
				isSidePanelOpen ? 'sbm:right-[510px] sbm:w-[calc(100%_-_72px_-_272px_-_510px)]' : 'sbm:right-0 sbm:w-widthThumnailAttachment'
			} max-sbm:w-full max-sbm:h-[50px] max-sbm:right-0 flex-shrink fixed z-10 border-b-theme-nav text-theme-primary`}
		>
			<ChannelTopbar>{children}</ChannelTopbar>
		</div>
	);
});

export default Topbar;
