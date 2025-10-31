import { useTheme, verticalScale } from '@mezon/mobile-ui';
import { EMimeTypes, notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import React from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { checkFileTypeImage, isAudio, isVideo } from '../../../../../utils/helpers';
import RenderAudioChat from '../RenderAudioChat/RenderAudioChat';
import { RenderImageChat } from '../RenderImageChat';
import { RenderVideoChat } from '../RenderVideoChat';
import { style } from './styles';

export const RenderDocumentsChat = React.memo(({ document, onLongPress, onPressImage }: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const isShowImage = checkFileTypeImage(document?.filetype);
	if (isShowImage) {
		const checkImage = notImplementForGifOrStickerSendFromPanel(document);

		return <RenderImageChat disable={checkImage} image={document} onPress={onPressImage} onLongPress={onLongPress} />;
	}
	const checkIsVideo = isVideo(document?.url?.toLowerCase());

	if (checkIsVideo) {
		return <RenderVideoChat videoURL={document.url} onLongPress={onLongPress} />;
	}
	const checkIsAudio = document.filetype?.includes(EMimeTypes.audio) || isAudio(document?.url?.toLowerCase());
	if (checkIsAudio) {
		return <RenderAudioChat audioURL={document?.url} />;
	}

	const isUploading = !document?.url?.includes('http');

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(document.url)} onLongPress={() => onLongPress()} disabled={isUploading}>
			<View style={styles.fileViewer}>
				<MezonIconCDN icon={IconCDN.fileIcon} width={verticalScale(30)} height={verticalScale(30)} color={themeValue.bgViolet} />
				<View style={styles.fileNameContainer}>
					<Text style={styles.fileName} numberOfLines={2}>
						{document.filename}
					</Text>
				</View>
				{isUploading && (
					<View style={styles.uploadingOverlay}>
						<ActivityIndicator />
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
});
