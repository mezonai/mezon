import { ThreadHeader } from '@mezon/components';
import { useEscapeKey, useGifsStickersEmoji } from '@mezon/core';
import { selectCurrentChannelId, selectThreadCurrentChannel, threadsActions, topicsActions, useAppDispatch } from '@mezon/store';
import { SubPanelName } from '@mezon/utils';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import ThreadBox from './ThreadBox';

const ThreadsMain = () => {
	const dispatch = useAppDispatch();
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const { setSubPanelActive } = useGifsStickersEmoji();

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannelId as string, isShowCreateThread }));
		},
		[currentChannelId, dispatch]
	);

	useEscapeKey(() => setIsShowCreateThread(false));
	const onMouseDownThreadBox = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(false));
		dispatch(threadsActions.setFocusThreadBox(true));
	};
	return (
		<div className="flex flex-col h-full" onClick={onMouseDownThreadBox}>
			<ThreadHeader threadCurrentChannel={threadCurrentChannel} />
			<ThreadBox />
		</div>
	);
};

export default ThreadsMain;
