import type { AppDispatch } from '@mezon/store';
import {
	accountActions,
	getStore,
	selectAnonymousMode,
	selectCurrentChannelId,
	selectCurrentTopicInitMessage,
	selectIsShowCreateTopic,
	selectMessageTopicError,
	threadsActions,
	toastActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export function startCreateTopicFromMessage(
	message: IMessageWithUser,
	dispatch: AppDispatch,
	tMessage: (key: string) => string,
	initMessage?: IMessageWithUser | null,
	channelIdFallback?: string
): void {
	const state = getStore().getState();
	const channelId =
		(message.channel_id as string) || (initMessage?.channel_id as string) || channelIdFallback || (selectCurrentChannelId(state) as string) || '';
	if (selectAnonymousMode(state, channelId)) {
		dispatch(toastActions.addToast({ message: tMessage('turnOffAnonymousToCreateTopic'), type: 'error' }));
		return;
	}
	dispatch(accountActions.turnOffAnonymous({ id: channelId, topic: true }));
	dispatch(topicsActions.setIsShowCreateTopic(true));
	dispatch(threadsActions.setIsShowCreateThread({ channelId, isShowCreateThread: false }));
	dispatch(topicsActions.setOpenTopicMessageState(true));
	dispatch(topicsActions.setCurrentTopicInitMessage(initMessage ?? message));
	dispatch(topicsActions.setCurrentTopicId(''));
	dispatch(topicsActions.setInitTopicMessageId(message.id));
}

export function useTopics() {
	const dispatch = useAppDispatch();
	const { t: tMessage } = useTranslation('message');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const messageTopicError = useSelector(selectMessageTopicError);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const currentTopicInitMessage = useSelector(selectCurrentTopicInitMessage);

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

	const setTurnOffTopicMessage = useCallback(() => {
		setOpenTopicMessageState(false);
		setCurrentTopicInitMessage(null);
	}, [setOpenTopicMessageState, setCurrentTopicInitMessage]);

	const startCreateTopicFromMessageBound = useCallback(
		(message: IMessageWithUser, initMessage?: IMessageWithUser | null) => {
			startCreateTopicFromMessage(message, dispatch, tMessage, initMessage);
		},
		[dispatch, tMessage]
	);

	return useMemo(
		() => ({
			isShowCreateTopic,
			messageTopicError,
			currentTopicInitMessage,
			setIsShowCreateTopic,
			setCurrentTopicInitMessage,
			setOpenTopicMessageState,
			setTurnOffTopicMessage,
			startCreateTopicFromMessage: startCreateTopicFromMessageBound
		}),
		[
			isShowCreateTopic,
			messageTopicError,
			currentTopicInitMessage,
			setIsShowCreateTopic,
			setCurrentTopicInitMessage,
			setOpenTopicMessageState,
			setTurnOffTopicMessage,
			startCreateTopicFromMessageBound
		]
	);
}
