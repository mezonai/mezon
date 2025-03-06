import { urlRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import LinkInvite from './LinkInvite';
import { style } from './RenderMessageInvite.styles';

interface IRenderMessageInviteProps {
	content: string;
}

function RenderMessageInvite({ content }: IRenderMessageInviteProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const parts = useMemo(() => content?.split(urlRegex), [content]);

	return (
		<View>
			{parts?.map((part, index) => {
				if (urlRegex?.test(part)) {
					return <LinkInvite content={content} part={part} key={index + part} />;
				}
				return part ? (
					<Text style={styles.textContent} key={index + part}>
						{part}
					</Text>
				) : null;
			})}
		</View>
	);
}

export default React.memo(RenderMessageInvite);
