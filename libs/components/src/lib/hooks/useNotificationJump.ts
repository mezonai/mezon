import type { MessagesEntity } from '@mezon/store';
import {
	appActions,
	getFirstMessageOfTopic,
	getStore,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectIsShowCanvas,
	selectMessageByMessageId,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface UseNotificationJumpProps {
	messageId?: string;
	channelId?: string;
	clanId?: string;
	topicId?: string;
	isTopic: boolean;
	mode?: number;
	onCloseTooltip?: () => void;
}

export const useNotificationJump = ({ messageId, channelId, clanId, topicId, isTopic, mode, onCloseTooltip }: UseNotificationJumpProps) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const handleJumpToTopic = useCallback(async () => {
		if (!topicId || !channelId || !clanId) return;

		try {
			const currentState = getStore().getState();
			const currentChannelId = selectCurrentChannelId(currentState);
			const currentClanId = selectCurrentClanId(currentState);
			const isClanChanged = currentClanId !== clanId;
			const isChannelChanged = currentChannelId !== channelId;

			if (isClanChanged || isChannelChanged) {
				const channelPath = `/chat/clans/${clanId}/channels/${channelId}`;
				await navigate(channelPath);
			}

			const topicDetailResult = await dispatch(getFirstMessageOfTopic({ topicId }));

			if (!topicDetailResult?.payload) {
				console.error('Failed to get topic detail, cannot jump to topic');
				return;
			}

			const topicDetail = topicDetailResult.payload as { message?: { messageId?: string }; messageId?: string };

			const originalMessageId = topicDetail?.message?.messageId || topicDetail?.messageId;

			if (!originalMessageId) {
				console.warn('Cannot find original messageId from topic, using provided messageId');
			}

			const messageIdToJump = originalMessageId || messageId;

			if (!messageIdToJump) {
				console.error('No message ID available to jump');
				return;
			}
			dispatch(
				messagesActions.jumpToMessage({
					clanId,
					messageId: messageIdToJump,
					channelId,
					mode,
					navigate
				})
			);

			const waitForMessage = (timeout = 5000): Promise<MessagesEntity | null> =>
				new Promise((resolve) => {
					const startTime = Date.now();
					const checkMessage = () => {
						const state = getStore().getState();
						const msg = selectMessageByMessageId(state, channelId, messageIdToJump);
						if (msg) {
							return resolve(msg);
						}
						if (Date.now() - startTime > timeout) {
							console.warn('Timeout waiting for message to load');
							return resolve(null);
						}
						requestAnimationFrame(checkMessage);
					};
					checkMessage();
				});

			const fullMessage = await waitForMessage();

			if (fullMessage) {
				dispatch(topicsActions.setCurrentTopicInitMessage(fullMessage as IMessageWithUser));
				dispatch(topicsActions.setInitTopicMessageId(fullMessage.id));
			}

			dispatch(topicsActions.setIsShowCreateTopic(true));
			dispatch(topicsActions.setCurrentTopicId(topicId));
		} catch (error) {
			console.error('Error jumping to topic:', error);
		}
	}, [clanId, channelId, topicId, messageId, mode, navigate, dispatch]);

	const handleJumpToMessage = useCallback(() => {
		if (!messageId || !channelId || !clanId) return;

		dispatch(
			messagesActions.jumpToMessage({
				clanId: clanId || '',
				messageId,
				channelId,
				mode,
				navigate
			})
		);
	}, [dispatch, messageId, channelId, clanId, mode, navigate]);

	const handleClickJump = useCallback(async () => {
		onCloseTooltip?.();
		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
		if (isTopic) {
			await handleJumpToTopic();
			return;
		}

		handleJumpToMessage();
	}, [isTopic, handleJumpToTopic, handleJumpToMessage, dispatch, isShowCanvas, onCloseTooltip]);

	return {
		handleClickJump,
		handleJumpToTopic,
		handleJumpToMessage
	};
};
