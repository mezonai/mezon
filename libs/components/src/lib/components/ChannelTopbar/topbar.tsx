import { usePathMatch } from '@mezon/core';
import { selectCurrentClanId } from '@mezon/store';
import { IChannel, isMacDesktop } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import ChannelTopbar from '.';
import DmTopbar from '../DmList/DMtopbar';

export type ChannelTopbarProps = {
	readonly channel?: Readonly<IChannel> | null;
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
	isChannelPath?: boolean;
};

const Topbar = memo(({ channel, mode }: ChannelTopbarProps) => {
	const currentClanId = useSelector(selectCurrentClanId);
	const friendPath = `/chat/direct/friends`;
	const { isFriendPath } = usePathMatch({
		isFriendPath: friendPath
	});
	return (
		<div
			className={`${isFriendPath ? 'hidden' : ''} ${isMacDesktop ? 'draggable-area' : ''} dark:bg-bgPrimary bg-bgLightPrimary shadow-inner border-b-[1px] dark:border-bgTertiary border-bgLightTertiary max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center w-widthThumnailAttachment flex-shrink fixed right-0 z-10`}
		>
			{currentClanId === '0' ? <DmTopbar /> : <ChannelTopbar />}
		</div>
	);
});

export default Topbar;
