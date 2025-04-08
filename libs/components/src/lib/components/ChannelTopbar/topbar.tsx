import { ChannelTopbar } from '@mezon/components';
import { usePathMatch } from '@mezon/core';
import { IChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';

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
	return (
		<div
			className={`${isFriendPath || isHidden ? 'hidden' : ''} dark:bg-bgPrimary bg-bgLightPrimary shadow-inner border-b-[1px] dark:border-bgTertiary border-bgLightTertiary max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center w-widthThumnailAttachment flex-shrink fixed right-0 z-10`}
		>
			<ChannelTopbar />
		</div>
	);
});

export default Topbar;
