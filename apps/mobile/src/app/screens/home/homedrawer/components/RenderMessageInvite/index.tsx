import { urlRegex } from '@mezon/mobile-components';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import LinkInvite from './LinkInvite';

interface IRenderMessageInviteProps {
	content: string;
}

function RenderMessageInvite({ content }: IRenderMessageInviteProps) {
	const parts = useMemo(() => content?.split(urlRegex), [content]);

	return (
		<View>
			{parts?.map((part, index) => {
				if (urlRegex?.test(part)) {
					return <LinkInvite content={content} key={index + part} />;
				}
				return null;
			})}
		</View>
	);
}

export default React.memo(RenderMessageInvite);
