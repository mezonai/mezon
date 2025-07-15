import { useEscapeKey } from '@mezon/core';
import { appActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { memo } from 'react';
import ChannelMain from '../channel';

type ChatStreamProps = {
	readonly currentChannel?: Readonly<IChannel> | null;
	topicChannelId?: string;
};

const ChatHeader = ({ currentChannel }: ChatStreamProps) => {
	const dispatch = useAppDispatch();

	const handleCloseModal = () => {
		dispatch(appActions.setIsShowChatStream(false));
		dispatch(appActions.setIsShowChatVoice(false));
	};

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[58px] min-h-[50px]  bg-theme-primary">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				<Icons.Chat defaultSize="w-6 h-6 text-theme-primary" />
				<span className="text-base font-semibold text-theme-primary">
					{currentChannel?.channel_label && currentChannel?.channel_label.length > 50
						? `${currentChannel?.channel_label.substring(0, 50)}...`
						: currentChannel?.channel_label}
				</span>
			</div>
			<button onClick={handleCloseModal} className="relative right-0 text-theme-primary">
				<Icons.Close />
			</button>
		</div>
	);
};

const ChatStream = ({ currentChannel }: ChatStreamProps) => {
	const dispatch = useAppDispatch();
	useEscapeKey(() => dispatch(appActions.setIsShowChatStream(false)));

	return (
		<div className="flex flex-col h-full">
			<ChatHeader currentChannel={currentChannel} />
			<ChannelMain />
		</div>
	);
};

export default memo(ChatStream);
