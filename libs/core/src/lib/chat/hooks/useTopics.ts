import {
	selectCurrentChannelId,
	selectCurrentTopicInitMessage,
	selectIsShowCreateTopic,
	selectMessageTopicError,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { IMessageWithUser } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useTopics() {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const messageTopicError = useSelector(selectMessageTopicError);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const currentTopicInitMessage = useSelector(selectCurrentTopicInitMessage);

	const setTurnOffTopicMessage = useCallback(() => {
		setOpenTopicMessageState(false);
		setCurrentTopicInitMessage(null);
	}, [dispatch]);

	const setOpenTopicMessageState = useCallback(
		(value: boolean) => {
			dispatch(topicsActions.setOpenTopicMessageState(value));
		},
		[dispatch]
	);

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
		},
		[currentChannelId, dispatch]
	);

	const setCurrentTopicInitMessage = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(topicsActions.setCurrentTopicInitMessage(value));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			isShowCreateTopic,
			messageTopicError,
			currentTopicInitMessage,
			setIsShowCreateTopic,
			setCurrentTopicInitMessage,
			setOpenTopicMessageState,
			setTurnOffTopicMessage
		}),
		[
			isShowCreateTopic,
			messageTopicError,
			currentTopicInitMessage,
			setIsShowCreateTopic,
			setCurrentTopicInitMessage,
			setOpenTopicMessageState,
			setTurnOffTopicMessage
		]
	);
}
