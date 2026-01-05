import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { IEmbedProps } from '@mezon/utils';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ImageListModal } from '../../../../../components/ImageListModal';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { EmbedAuthor } from './EmbedAuthor';
import { EmbedDescription } from './EmbedDescription';
import { EmbedFields } from './EmbedFields';
import { EmbedFooter } from './EmbedFooter';
import { EmbedTitle } from './EmbedTitle';
import { style } from './styles';

type EmbedMessageProps = {
	messageId: string;
	embed: IEmbedProps;
	channelId: string;
	onLongPress?: () => void;
};

export const EmbedMessage = memo(({ messageId, embed, channelId, onLongPress }: EmbedMessageProps) => {
	const { color, title, url, author, description, fields, image, timestamp, footer, thumbnail } = embed;
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const handlePressImage = () => {
		const imageData = {
			...image,
			id: '',
			filetype: 'image/jpeg',
			messageId,
			channelId: channelId
		};
		const data = {
			children: <ImageListModal channelId={''} imageSelected={imageData} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handleLongPress = () => {
		onLongPress && onLongPress();
	};

	return (
		<View style={[styles.container, isTabletLandscape && { width: '60%' }]}>
			<View style={[styles.sizeColor, !!color && { backgroundColor: color }]} />
			<View style={styles.embed}>
				<View style={styles.valueContainer}>
					<View style={styles.content}>
						{!!author && <EmbedAuthor {...author} />}
						{!!title && <EmbedTitle title={title} url={url} />}
						{!!description && <EmbedDescription description={description} />}
						{!!fields && <EmbedFields messageId={messageId} fields={fields} />}
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
					<TouchableOpacity onPress={handlePressImage} onLongPress={handleLongPress}>
						<FastImage
							source={{ uri: image?.url }}
							style={[styles.imageWrapper, { aspectRatio: image?.width / image?.height || 1 }]}
							resizeMode="cover"
						/>
					</TouchableOpacity>
				)}
				{(!!timestamp || !!footer) && <EmbedFooter {...footer} timestamp={timestamp} />}
			</View>
		</View>
	);
});
