import { MentionReactInput, UserMentionList } from '@mezon/components';
import { useThreadMessage } from '@mezon/core';
import {
	channelsActions,
	checkDuplicateThread,
	createNewChannel,
	messagesActions,
	selectAllChannelMembers,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectSession,
	selectThreadCurrentChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { IMessageSendPayload, ThreadValue, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useThrottledCallback } from 'use-debounce';
import ChannelMessages from '../channel/ChannelMessages';

const ThreadBox = () => {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const sessionUser = useSelector(selectSession);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);

	const membersOfParent = useAppSelector((state) =>
		threadCurrentChannel?.parrent_id ? selectAllChannelMembers(state, threadCurrentChannel?.parrent_id as string) : null
	);
	const { sendMessageThread, sendMessageTyping } = useThreadMessage({
		channelId: threadCurrentChannel?.id as string,
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});

	const mapToMemberIds = useMemo(() => {
		return membersOfParent?.map((item) => item.id);
	}, [membersOfParent]);

	const createThread = useCallback(
		async (value: ThreadValue) => {
			const isDuplicate = await dispatch(checkDuplicateThread({ thread_name: value.nameValueThread, channel_id: currentChannelId as string }));
			if (isDuplicate?.payload) {
				toast('Thread name already exists');
				return;
			}
			const timestamp = Date.now() / 1000;
			const body: any = {
				clan_id: currentClanId?.toString(),
				channel_label: value.nameValueThread,
				channel_private: value.isPrivate,
				parrent_id: currentChannelId as string,
				category_id: currentChannel?.category_id,
				type: ChannelType.CHANNEL_TYPE_THREAD,
				lastSeenTimestamp: timestamp,
				lastSentTimestamp: timestamp
			};

			const thread = await dispatch(createNewChannel(body));
			return thread.payload;
		},
		[currentChannel, currentChannelId, currentClanId, dispatch]
	);

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue
		) => {
			if (sessionUser) {
				if (value?.nameValueThread) {
					const thread = (await createThread(value)) as ApiChannelDescription;
					if (thread) {
						await dispatch(
							channelsActions.joinChat({
								clanId: currentClanId as string,
								channelId: thread.channel_id as string,
								channelType: ChannelType.CHANNEL_TYPE_THREAD,
								isPublic: false
							})
						);
						await sendMessageThread(content, mentions, attachments, references, thread);
						await dispatch(
							messagesActions.fetchMessages({
								clanId: currentClanId || '',
								channelId: thread.channel_id as string,
								isFetchingLatestMessages: true
							})
						);
					}
				} else {
					await sendMessageThread(content, mentions, attachments, references, threadCurrentChannel);
				}
			} else {
				console.error('Session is not available');
			}
		},
		[createThread, currentClanId, dispatch, sendMessageThread, threadCurrentChannel, sessionUser]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	return (
		<div className="flex flex-col flex-1 justify-end border-l dark:border-borderDivider border-bgLightTertiary">
			{threadCurrentChannel && (
				<div
					className={`overflow-y-auto bg-[#1E1E1E] max-w-widthMessageViewChat overflow-x-hidden ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBarMessageViewChatThread h-heightTitleBarMessageViewChatThread' : 'max-h-heightMessageViewChatThread h-heightMessageViewChatThread'}`}
				>
					<ChannelMessages
						isThreadBox={true}
						userIdsFromThreadBox={mapToMemberIds}
						key={threadCurrentChannel.channel_id}
						clanId={currentClanId || ''}
						channelId={threadCurrentChannel.channel_id as string}
						channelLabel={threadCurrentChannel.channel_label}
						type={ChannelType.CHANNEL_TYPE_THREAD}
						mode={ChannelStreamMode.STREAM_MODE_THREAD}
						isPrivate={threadCurrentChannel.channel_private}
					/>
				</div>
			)}
			<div
				className={`flex-shrink-0 flex flex-col ${isElectron() ? 'pb-[46px]' : 'pb-[26px]'} px-4 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative`}
			>
				<MentionReactInput
					onSend={handleSend}
					onTyping={handleTypingDebounced}
					listMentions={UserMentionList({
						channelID: currentChannel?.channel_id as string,
						channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
					})}
					isThread
				/>
			</div>
		</div>
	);
};

export default ThreadBox;
