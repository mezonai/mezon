import { useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import { memo } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from './styles';

interface EmbedFooterProps {
	text?: string;
	iconUrl?: string;
	timestamp?: string;
}

export const EmbedFooter = memo(({ text, iconUrl, timestamp }: EmbedFooterProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const date = new Date(timestamp).toLocaleDateString();
	return (
		<View style={styles.container}>
			{!!iconUrl && (
				<FastImage
					source={{
						uri: createImgproxyUrl(iconUrl ?? '', { width: 100, height: 100, resizeType: 'fit' })
					}}
					style={styles.imageWrapper}
				/>
			)}
			{!!text && <Text style={styles.text}>{text}</Text>}
			{!!timestamp && (
				<>
					{!!text && <Text style={styles.text}>•</Text>}
					<Text style={styles.text}>{date}</Text>
				</>
			)}
		</View>
	);
});
