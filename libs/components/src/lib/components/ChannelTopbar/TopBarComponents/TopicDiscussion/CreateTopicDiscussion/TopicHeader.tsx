import { useMessageValue } from '@mezon/core';
import { selectComposeInputByChannelId, selectCurrentChannelId, topicsActions, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

const TopicHeader = () => {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean, channelId?: string) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
		},
		[currentChannelId, dispatch]
	);

	const setTurnOffThreadMessage = useCallback(() => {
		dispatch(topicsActions.setOpenTopicMessageState(false));
		dispatch(topicsActions.setCurrentTopicInitMessage(null));
	}, [dispatch]);

	const { setRequestInput } = useMessageValue();

	const request = useAppSelector((state) => selectComposeInputByChannelId(state, currentChannelId as string));

	const handleCloseModal = useCallback(
		(event?: React.MouseEvent) => {
			event?.stopPropagation();
			setTurnOffThreadMessage();
			setIsShowCreateTopic(false);
			dispatch(topicsActions.setCurrentTopicId(''));
			setRequestInput({ ...request, valueTextInput: '' }, true);
		},
		[dispatch]
	);

	return (
		<div
			className="flex flex-row items-center justify-between px-4 h-[48px] min-h-[50px] border-b-theme-primary z-10 bg-theme-chat"
			data-e2e={generateE2eId('chat.topic.header')}
		>
			<div className="flex flex-row items-center text-theme-primary gap-2 pointer-events-none">
				<Icons.TopicIcon />
				<span className="text-base font-semibold text-theme-primary-active">{'Topic'}</span>
			</div>
			<button
				onClick={(e) => handleCloseModal(e)}
				className="relative right-0 text-theme-primary hover:text-red-500"
				data-e2e={generateE2eId('chat.topic.header.button.close')}
			>
				<Icons.Close />
			</button>
		</div>
	);
};

export default TopicHeader;
