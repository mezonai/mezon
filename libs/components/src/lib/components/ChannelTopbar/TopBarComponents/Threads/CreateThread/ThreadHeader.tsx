import { useMessageValue } from '@mezon/core';
import { selectCurrentChannelId, threadsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ApiChannelDescription } from 'mezon-js/api.gen';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

type ThreadHeaderProps = {
	threadCurrentChannel?: ApiChannelDescription | null;
};

const ThreadHeader = ({ threadCurrentChannel }: ThreadHeaderProps) => {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);

	const setNameValueThread = useCallback(
		(nameValue: string) => {
			dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue }));
		},
		[currentChannelId, dispatch]
	);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread }));
		},
		[currentChannelId, dispatch]
	);

	const setTurnOffThreadMessage = useCallback(() => {
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
	}, [dispatch]);

	const { setRequestInput, request } = useMessageValue();

	const handleCloseModal = () => {
		setTurnOffThreadMessage();
		setIsShowCreateThread(false);
		setNameValueThread('');
		setRequestInput({ ...request, valueTextInput: '' }, true);
	};

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[58px] min-h-[60px] border-b-[1px] dark:border-bgTertiary border-bgLightTertiary z-10 dark:bg-bgPrimary bg-bgLightPrimary">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				{threadCurrentChannel?.channel_private ? <Icons.ThreadIconLocker /> : <Icons.ThreadIcon />}
				<span className="text-base font-semibold dark:text-white text-colorTextLightMode">
					{threadCurrentChannel ? threadCurrentChannel.channel_label : 'New Thread'}
				</span>
			</div>
			<button onClick={handleCloseModal} className="relative right-0">
				<Icons.Close />
			</button>
		</div>
	);
};

export default ThreadHeader;
