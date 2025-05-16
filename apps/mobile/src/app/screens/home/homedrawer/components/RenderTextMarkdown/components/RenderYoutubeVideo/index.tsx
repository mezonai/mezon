import { Attributes, size } from '@mezon/mobile-ui';
import { memo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

type RenderYoutubeVideoProps = {
	key: string;
	videoId: string;
	contentInElement: string;
	onPress?: () => void;
	onLongPress?: () => void;
	linkStyle?: TextStyle;
	themeValue?: Attributes;
};

const RenderYoutubeVideo = ({ key, videoId, contentInElement, onPress, onLongPress, linkStyle, themeValue }: RenderYoutubeVideoProps) => {
	const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;

	return (
		<View
			key={key}
			style={{
				display: 'flex',
				gap: size.s_8,
				marginTop: isLandscape ? -size.s_4 : -size.s_40,
				marginLeft: isLandscape ? -size.s_4 : 0,
				paddingBottom: isLandscape ? size.s_6 : size.s_22
			}}
		>
			<Text style={linkStyle} onPress={onPress} onLongPress={onLongPress}>
				{contentInElement}
			</Text>

			<View style={[themeValue ? styles(themeValue).borderLeftView : {}]}>
				{!isVideoReady && (
					<View style={[themeValue ? styles(themeValue).loadingVideoSpinner : {}]}>
						<ActivityIndicator size="large" color={'red'} />
					</View>
				)}

				<YoutubePlayer
					height={size.s_170}
					width={size.s_300}
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

const styles = (colors: Attributes) =>
	StyleSheet.create({
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
			borderLeftWidth: size.s_4,
			borderLeftColor: 'red',
			borderRadius: size.s_4
		}
	});

export default memo(RenderYoutubeVideo);
