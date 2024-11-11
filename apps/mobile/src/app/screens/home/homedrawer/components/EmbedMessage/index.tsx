import { size, useTheme } from '@mezon/mobile-ui';
import { IEmbedProps } from '@mezon/utils';
import { memo } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { EmbedAuthor } from './EmbedAuthor';
import { EmbedFields } from './EmbedFields';
import { EmbedFooter } from './EmbedFooter';
import { style } from './styles';

export const EmbedMessage = memo((embed: IEmbedProps) => {
	const { color, title, url, author, description, fields = [], image, timestamp, footer, thumbnail } = embed;
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.container}>
			<View style={{ width: size.s_4, backgroundColor: color, borderBottomLeftRadius: size.s_4, borderTopLeftRadius: size.s_4 }} />
			<View style={styles.embed}>
				<View style={{ flexDirection: 'row', gap: 6 }}>
					<View style={styles.content}>
						{!!author && <EmbedAuthor {...author} />}
						{!!title && <Text style={[styles.title, !!url && { textDecorationLine: 'underline' }]}>{title}</Text>}
						{!!description && <Text style={styles.description}>{description}</Text>}
						{!!fields && <EmbedFields fields={fields} />}
					</View>
					{!!thumbnail && <FastImage source={{ uri: thumbnail?.url }} style={styles.thumbnail} />}
				</View>
				{!!image && <FastImage source={{ uri: image?.url }} style={styles.imageWrapper} resizeMode="cover" />}
				{(!!timestamp || !!footer) && <EmbedFooter {...footer} timestamp={timestamp} />}
			</View>
		</View>
	);
});
