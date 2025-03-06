import { FileIcon } from '@mezon/mobile-components';
import { Colors, Text, useTheme, verticalScale } from '@mezon/mobile-ui';
import { EMimeTypes, notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { openUrl } from 'react-native-markdown-display';
import { isAudio, isImage, isVideo } from '../../../../../utils/helpers';
import RenderAudioChat from '../RenderAudioChat/RenderAudioChat';
import { RenderImageChat } from '../RenderImageChat';
import { RenderVideoChat } from '../RenderVideoChat';
import { style } from './styles';

export const RenderDocumentsChat = React.memo(({ document, onLongPress, onPressImage }: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const isShowImage = isImage(document?.url?.toLowerCase());
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
		<TouchableOpacity activeOpacity={0.8} onPress={() => openUrl(document.url)} onLongPress={onLongPress} disabled={isUploading}>
			<View style={styles.fileViewer}>
				<FileIcon width={verticalScale(30)} height={verticalScale(30)} color={Colors.bgViolet} />
				<View style={{ maxWidth: '75%' }}>
					<Text style={styles.fileName} numberOfLines={2}>
						{document.filename}
					</Text>
				</View>
				{isUploading && (
					<View
						style={{
							backgroundColor: 'rgba(0,0,0,0.5)',
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							alignItems: 'flex-end',
							justifyContent: 'center',
							paddingRight: 10
						}}
					>
						<ActivityIndicator />
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
});
