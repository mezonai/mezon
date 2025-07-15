import { useMessageValue } from '@mezon/core';
import { selectComposeInputByChannelId, selectCurrentChannelId, threadsActions, useAppDispatch, useAppSelector } from '@mezon/store';
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

	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) => selectComposeInputByChannelId(state, currentChannelId as string));

	const handleCloseModal = () => {
		setTurnOffThreadMessage();
		setIsShowCreateThread(false);
		setNameValueThread('');
		setRequestInput({ ...request, valueTextInput: '' }, true);
	};

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[48px] min-h-[50px] border-b-theme-primary  z-10 bg-theme-chat">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				{threadCurrentChannel?.channel_private ? <Icons.ThreadIconLocker /> : <Icons.ThreadIcon />}
				<span className="text-base font-semibold text-theme-primary">
					{threadCurrentChannel ? threadCurrentChannel.channel_label : 'New Thread'}
				</span>
			</div>
			<button onClick={handleCloseModal} className="relative right-0 text-theme-primary">
				<Icons.Close />
			</button>
		</div>
	);
};

export default ThreadHeader;
