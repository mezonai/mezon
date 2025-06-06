import { useChannelMembers, useDraftCompose, useReference, useThreads } from '@mezon/core';
import {
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentTopicId,
	selectDataReferences,
	selectIsSearchMessage,
	selectIsShowMemberList,
	selectOpenThreadMessageState,
	selectThreadCurrentChannel,
	useAppSelector
} from '@mezon/store';
import { MentionReactInputProps } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { widthMessageViewChat, widthMessageViewChatThread, widthSearchMessage, widthThumbnailAttachment } from '../CustomWidth';
import { MentionReactBase } from '../ReactionMentionInput';

const ClanMentionReactInput = memo((props: MentionReactInputProps) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isSearchMessage = useSelector((state) => selectIsSearchMessage(state, props.currentChannelId));
	const [mentionWidth, setMentionWidth] = useState('');

	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const currentChannel = useSelector(selectCurrentChannel);
	const { addMemberToThread, joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: props.mode ?? 0 });
	const { isPrivate, nameValueThread, valueThread, isShowCreateThread } = useThreads();
	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentChannelId ?? ''));
	const dataReferencesTopic = useAppSelector((state) => selectDataReferences(state, currTopicId ?? ''));

	const { draftRequest, updateDraft } = useDraftCompose(
		props.isThread || props.isTopic ? currentChannelId + String(props.isThread || props.isTopic) : (currentChannelId as string)
	);

	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setOpenThreadMessageState, checkAttachment } = useReference(currentChannelId || '');

	useEffect(() => {
		setMentionWidth(
			isShowMemberList
				? widthMessageViewChat
				: isShowCreateThread
					? widthMessageViewChatThread
					: isSearchMessage
						? widthSearchMessage
						: widthThumbnailAttachment
		);
	}, [isSearchMessage, isShowCreateThread, isShowMemberList]);

	return (
		<MentionReactBase
			{...props}
			currentChannelId={currentChannelId || ''}
			mentionWidth={mentionWidth}
			addMemberToThread={addMemberToThread}
			joinningToThread={joinningToThread}
			threadCurrentChannel={threadCurrentChannel}
			currentChannel={currentChannel!}
			setOpenThreadMessageState={setOpenThreadMessageState}
			checkAttachment={checkAttachment}
			draftRequest={draftRequest}
			updateDraft={updateDraft}
			openThreadMessageState={openThreadMessageState}
			isShowCreateThread={isShowCreateThread}
			nameValueThread={nameValueThread}
			valueThread={valueThread}
			isPrivate={isPrivate}
			membersOfChild={membersOfChild || []}
			membersOfParent={membersOfParent || []}
			dataReferences={dataReferences}
			dataReferencesTopic={dataReferencesTopic}
		/>
	);
});

ClanMentionReactInput.displayName = 'ClanMentionReactInput';

export default ClanMentionReactInput;
