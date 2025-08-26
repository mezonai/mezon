import { baseColor, size } from '@mezon/mobile-ui';
import { memo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

type RenderYoutubeVideoProps = {
	videoKey: string;
	videoId: string;
	contentInElement: string;
	onPress?: () => void;
	onLongPress?: () => void;
	linkStyle?: TextStyle;
};

const RenderYoutubeVideo = ({ videoKey, videoId, contentInElement, onPress, onLongPress, linkStyle }: RenderYoutubeVideoProps) => {
	const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;
	const playerWidth = isLandscape ? width * 0.4 : width * 0.8;
	const playerHeight = (playerWidth * 9) / 16;

	return (
		<View key={videoKey}>
			<Text style={linkStyle} onPress={onPress} onLongPress={onLongPress}>
				{contentInElement}
			</Text>

			<View style={styles.borderLeftView}>
				{!isVideoReady && (
					<View style={styles.loadingVideoSpinner}>
						<ActivityIndicator size="large" color={baseColor.redStrong} />
					</View>
				)}
				<YoutubePlayer
					height={playerHeight}
					width={playerWidth}
					videoId={videoId}
					play={false}
					onReady={() => setIsVideoReady(true)}
					webViewProps={{
						androidLayerType: 'hardware',
						javaScriptEnabled: true,
						domStorageEnabled: true,
						allowsInlineMediaPlayback: true,
						onStartShouldSetResponder: () => true
					}}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	loadingVideoSpinner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.1)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	borderLeftView: {
		marginTop: size.s_6,
		borderLeftWidth: size.s_2,
		borderLeftColor: baseColor.redStrong,
		borderRadius: size.s_4
	}
});

export default memo(RenderYoutubeVideo);
