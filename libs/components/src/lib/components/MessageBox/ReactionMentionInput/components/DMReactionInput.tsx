import { useDraftCompose } from '@mezon/core';
import { selectIsShowMemberListDM, selectIsUseProfileDM } from '@mezon/store';
import { MentionReactInputProps, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { widthDmGroupMemberList, widthDmUserProfile, widthThumbnailAttachment } from '../CustomWidth';
import { MentionReactBase } from '../ReactionMentionInput';

interface DMReactionInputProps extends MentionReactInputProps {
	isDm: boolean;
	isGr: boolean;
}

const DMReactionInput = memo((props: DMReactionInputProps) => {
	const isShowDMUserProfile = useSelector(selectIsUseProfileDM);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const [mentionWidth, setMentionWidth] = useState('');

	const { draftRequest, updateDraft } = useDraftCompose(props.currentChannelId as string);

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;
	const isGr = props.mode === ChannelStreamMode.STREAM_MODE_GROUP;

	useEffect(() => {
		if (isDm) {
			setMentionWidth(isShowDMUserProfile ? widthDmUserProfile : widthThumbnailAttachment);
		} else if (isGr) {
			setMentionWidth(isShowMemberListDM ? widthDmGroupMemberList : widthThumbnailAttachment);
		}
	}, [isDm, isGr, isShowDMUserProfile, isShowMemberListDM]);

	return (
		<MentionReactBase
			{...props}
			isPrivate={0}
			nameValueThread=""
			mentionWidth={mentionWidth}
			draftRequest={draftRequest}
			updateDraft={updateDraft}
			currentDmGroupId={props.currentChannelId as string}
			dataE2E={generateE2eId('', 'direct_message')}
		/>
	);
});

DMReactionInput.displayName = 'DMReactionInput';

export default DMReactionInput;
