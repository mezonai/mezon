import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl, IEmbedProps } from '@mezon/utils';
import { memo } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { EmbedAuthor } from './EmbedAuthor';
import { EmbedDescription } from './EmbedDescription';
import { EmbedFields } from './EmbedFields';
import { EmbedFooter } from './EmbedFooter';
import { EmbedTitle } from './EmbedTitle';
import { style } from './styles';

type EmbedMessageProps = {
	message_id: string;
	embed: IEmbedProps;
};

export const EmbedMessage = memo(({ message_id, embed }: EmbedMessageProps) => {
	const { color, title, url, author, description, fields, image, timestamp, footer, thumbnail } = embed;
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.container}>
			<View style={[styles.sizeColor, !!color && { backgroundColor: color }]} />
			<View style={styles.embed}>
				<View style={styles.valueContainer}>
					<View style={styles.content}>
						{!!author && <EmbedAuthor {...author} />}
						{!!title && <EmbedTitle title={title} url={url} />}
						{!!description && <EmbedDescription description={description} />}
						{!!fields && <EmbedFields message_id={message_id} fields={fields} />}
					</View>
					{!!thumbnail && (
						<FastImage
							source={{
								uri: createImgproxyUrl(thumbnail?.url ?? '', { width: 300, height: 300, resizeType: 'fit' })
							}}
							style={styles.thumbnail}
						/>
					)}
				</View>
				{!!image && (
					<TouchableOpacity
						onPress={() => {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_IMAGE_DETAIL_MESSAGE_ITEM, {
								...image,
								uploader: '',
								create_time: ''
							});
						}}
					>
						<FastImage source={{ uri: image?.url }} style={styles.imageWrapper} resizeMode="cover" />
					</TouchableOpacity>
				)}
				{(!!timestamp || !!footer) && <EmbedFooter {...footer} timestamp={timestamp} />}
			</View>
		</View>
	);
});
