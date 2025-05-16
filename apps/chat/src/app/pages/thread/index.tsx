import { ThreadHeader } from '@mezon/components';
import { useEscapeKey } from '@mezon/core';
import { selectCurrentChannelId, selectThreadCurrentChannel, threadsActions, useAppDispatch } from '@mezon/store';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import ThreadBox from './ThreadBox';

const ThreadsMain = () => {
	const dispatch = useAppDispatch();
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannelId as string, isShowCreateThread }));
		},
		[currentChannelId, dispatch]
	);

	useEscapeKey(() => setIsShowCreateThread(false));

	return (
		<div className="flex flex-col h-full sbm:relative fixed sbm:w-auto w-full dark:bg-bgPrimary bg-bgLightPrimary z-50 sbm:z-10">
			<ThreadHeader threadCurrentChannel={threadCurrentChannel} />
			<ThreadBox />
		</div>
	);
};

export default ThreadsMain;
