import { useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import { memo } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from './styles';

interface EmbedAuthorProps {
	name: string;
	iconUrl?: string;
	url?: string;
}

export const EmbedAuthor = memo(({ name, iconUrl, url }: EmbedAuthorProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={styles.container}>
			<FastImage
				source={{
					uri: createImgproxyUrl(url ?? '', { width: 100, height: 100, resizeType: 'fit' })
				}}
				style={styles.imageWrapper}
			/>
			<Text style={styles.text}>{name}</Text>
		</View>
	);
});
