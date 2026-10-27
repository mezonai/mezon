import type { MentionReactInputProps } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ReactElement } from 'react';
import { memo } from 'react';
import ClanMentionReactInput from './components/ClanMentionReactInput';
import DMReactionInput from './components/DMReactionInput';

export const MentionReactInput = memo((props: MentionReactInputProps): ReactElement => {
	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;
	const isGr = props.mode === ChannelStreamMode.STREAM_MODE_GROUP;
	if (isDm || isGr) {
		return <DMReactionInput {...props} isDm={isDm} isGr={isGr} />;
	}

	return <ClanMentionReactInput {...props} />;
});

MentionReactInput.displayName = 'MentionReactInput';
