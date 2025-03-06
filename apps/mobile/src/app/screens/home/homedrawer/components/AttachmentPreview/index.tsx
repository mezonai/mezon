import { Icons, PlayIcon } from '@mezon/mobile-components';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch } from '@mezon/store-mobile';
import React, { memo } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import AttachmentFilePreview from '../AttachmentFilePreview';
import { style } from './styles';

interface IProps {
	channelId: string;
}

const AttachmentPreview = memo(({ channelId }: IProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const attachmentFilteredByChannelId = useSelector(selectAttachmentByChannelId(channelId ?? ''));

	const checkAttachment = attachmentFilteredByChannelId?.files?.length > 0;

	const handleRemoveAttachment = (index: number) => {
		dispatch(
			referencesActions.removeAttachment({
				channelId: channelId || '',
				index: index
			})
		);
	};

	if (!checkAttachment) {
		return null;
	}

	return (
		<ScrollView
			horizontal
			style={styles.container}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ paddingRight: verticalScale(20) }}
		>
			{attachmentFilteredByChannelId.files.map((attachment, index) => {
				const isFile = !attachment?.filetype?.includes?.('video') && !attachment?.filetype?.includes?.('image');
				const isVideo = attachment?.filetype?.includes?.('video');

				return (
					<View key={index + attachment.filename} style={styles.attachmentItem}>
						{isFile ? (
							<AttachmentFilePreview attachment={attachment} />
						) : (
							<Image source={{ uri: attachment.url }} style={styles.attachmentItemImage} />
						)}

						<TouchableOpacity style={styles.iconClose} activeOpacity={0.8} onPress={() => handleRemoveAttachment(index)}>
							<Icons.CloseSmallBoldIcon width={size.s_18} height={size.s_18} color={baseColor.white} />
						</TouchableOpacity>

						{isVideo && (
							<View style={styles.videoOverlay}>
								<PlayIcon width={size.s_20} height={size.s_20} />
							</View>
						)}
					</View>
				);
			})}
		</ScrollView>
	);
});

export default AttachmentPreview;
