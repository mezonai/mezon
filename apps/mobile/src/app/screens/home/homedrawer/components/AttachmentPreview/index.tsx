import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import React, { memo } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import AttachmentFilePreview from '../AttachmentFilePreview';
import { style } from './styles';

interface IProps {
	channelId: string;
}

const AttachmentPreview = memo(({ channelId }: IProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const attachmentFilteredByChannelId = useAppSelector((state) => selectAttachmentByChannelId(state, channelId));
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
							<Image source={{ uri: attachment?.thumbnail ?? attachment?.url }} style={styles.attachmentItemImage} />
						)}

						<TouchableOpacity style={styles.iconClose} activeOpacity={0.8} onPress={() => handleRemoveAttachment(index)}>
							<MezonIconCDN icon={IconCDN.closeSmallBold} width={size.s_18} height={size.s_18} color={baseColor.white} />
						</TouchableOpacity>

						{isVideo && (
							<View style={styles.videoOverlay}>
								<MezonIconCDN icon={IconCDN.playIcon} width={size.s_20} height={size.s_20} />
							</View>
						)}
					</View>
				);
			})}
		</ScrollView>
	);
});

export default AttachmentPreview;
