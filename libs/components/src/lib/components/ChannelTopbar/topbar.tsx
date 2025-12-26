import { ChannelTopbar } from '@mezon/components';
import { usePathMatch } from '@mezon/core';
import {
	selectCloseMenu,
	selectCurrentChannelChannelId,
	selectCurrentChannelClanId,
	selectStatusMenu,
	selectVoiceInfo,
	selectVoiceJoined
} from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import type { ChannelStreamMode } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

export type ChannelTopbarProps = {
	readonly channel?: Readonly<IChannel> | null;
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
	isChannelPath?: boolean;
	isHidden?: boolean;
};

const Topbar = memo(({ isHidden = false }: { isHidden?: boolean }) => {
	const { isFriendPath } = usePathMatch({
		isFriendPath: `/chat/direct/friends`
	});
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isJoined = useSelector(selectVoiceJoined);
	const voiceInfo = useSelector(selectVoiceInfo);
	const currentChannelClanId = useSelector(selectCurrentChannelClanId);
	const currentChannelId = useSelector(selectCurrentChannelChannelId);
	const isInCurrentVoiceChannel = useMemo(() => {
		return isJoined && voiceInfo?.clanId === currentChannelClanId && voiceInfo?.channelId === currentChannelId;
	}, [isJoined, voiceInfo, currentChannelClanId, currentChannelId]);

	return (
		<div
			className={`${isFriendPath || isHidden || (closeMenu && statusMenu) || isInCurrentVoiceChannel ? 'hidden' : ''} border-b-theme-primary bg-theme-chat max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center w-widthThumnailAttachment max-sbm:w-[50px] max-sbm:h-[50px] flex-shrink fixed right-0 z-10 border-b-theme-nav text-theme-primary  `}
		>
			<ChannelTopbar />
		</div>
	);
});

export default Topbar;
