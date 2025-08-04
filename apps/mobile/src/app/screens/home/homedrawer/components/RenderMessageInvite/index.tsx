import { inviteLinkRegex } from '@mezon/mobile-components';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import LinkInvite from './LinkInvite';

interface IRenderMessageInviteProps {
	content: string;
}

function RenderMessageInvite({ content }: IRenderMessageInviteProps) {
	const extractInviteIds = useMemo(() => {
		const matches = content?.matchAll(new RegExp(inviteLinkRegex, 'g'));
		return [...new Set([...matches]?.map((match) => match?.[1]))];
	}, [content]);

	return (
		<View>
			{extractInviteIds?.map((id) => {
				return <LinkInvite inviteID={id} key={id} />;
			})}
		</View>
	);
}

export default React.memo(RenderMessageInvite);
