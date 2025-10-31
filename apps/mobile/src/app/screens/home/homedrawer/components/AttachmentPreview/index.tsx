import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import React, { memo } from 'react';
import { Image, Platform, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
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
				index
			})
		);
	};

	if (!checkAttachment) {
		return null;
	}

	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={styles.gradientBackground}
			/>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				nestedScrollEnabled={true}
				scrollEventThrottle={16}
				bounces={false}
				alwaysBounceHorizontal={false}
				contentContainerStyle={styles.scrollViewContent}
				style={styles.scrollViewContainer}
			>
				{attachmentFilteredByChannelId.files.map((attachment, index) => {
					const isFile = !attachment?.filetype?.includes?.('video') && !attachment?.filetype?.includes?.('image');
					const isVideo = attachment?.filetype?.includes?.('video');
					const isGifIOS = attachment?.filetype?.includes('gif') && Platform.OS === 'ios';
					return (
						<View key={`${index}_${attachment.filename}`} style={styles.attachmentItem}>
							{isFile ? (
								<AttachmentFilePreview attachment={attachment} />
							) : isGifIOS ? (
								<FastImage source={{ uri: attachment?.url }} style={styles.attachmentItemImage} />
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
		</View>
	);
});

export default AttachmentPreview;
