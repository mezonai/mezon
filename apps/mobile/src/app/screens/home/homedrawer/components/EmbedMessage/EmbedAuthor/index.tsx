import { useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from './styles';

interface EmbedAuthorProps {
	name: string;
	icon_url?: string;
	url?: string;
}

export const EmbedAuthor = memo(({ name, icon_url, url }: EmbedAuthorProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={styles.container}>
			<FastImage source={{ uri: url }} style={styles.imageWrapper} />
			<Text style={styles.text}>{name}</Text>
		</View>
	);
});
