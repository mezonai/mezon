import { useEscapeKey } from '@mezon/core';
import { appActions, selectCurrentChannelLabel, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import ChannelMain from '../channel';

type ChatStreamProps = {
	topicChannelId?: string;
};

const ChatHeader = () => {
	const dispatch = useAppDispatch();
	const currentChannelLabel = useSelector(selectCurrentChannelLabel);

	const handleCloseModal = () => {
		dispatch(appActions.setIsShowChatStream(false));
		dispatch(appActions.setIsShowChatVoice(false));
	};

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[58px] min-h-[50px]  bg-theme-primary">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				<Icons.Chat defaultSize="w-6 h-6 text-theme-primary" />
				<span className="text-base font-semibold text-theme-primary">
					{currentChannelLabel && currentChannelLabel.length > 50 ? `${currentChannelLabel.substring(0, 50)}...` : currentChannelLabel}
				</span>
			</div>
			<button onClick={handleCloseModal} className="relative right-0 text-theme-primary text-theme-primary-hover ">
				<Icons.Close />
			</button>
		</div>
	);
};

const ChatStream = ({ topicChannelId }: ChatStreamProps) => {
	const dispatch = useAppDispatch();
	useEscapeKey(() => dispatch(appActions.setIsShowChatStream(false)));

	return (
		<div className="flex flex-col h-full">
			<ChatHeader />
			<ChannelMain />
		</div>
	);
};

export default memo(ChatStream);
