import { baseColor } from '@mezon/mobile-ui';
import { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, Text, TextStyle, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { style } from './styles';
interface IRenderYoutubeVideoProps {
	videoKey: string;
	videoId: string;
	contentInElement: string;
	onPress?: () => void;
	onLongPress?: () => void;
	linkStyle?: TextStyle;
};

const RenderYoutubeVideo = ({ videoKey, videoId, contentInElement, onPress, onLongPress, linkStyle }: IRenderYoutubeVideoProps) => {
	const styles = style()
	const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
	const [dimension, setDimension] = useState(() => {
		const { width, height } = Dimensions.get('screen');
		return { width, height }
	});

	const checkOrientation = () => {
		const { width, height } = Dimensions.get('screen');
		setDimension({ width, height });
	};

	useEffect(() => {
		checkOrientation();

		const subscription = Dimensions.addEventListener('change', () => {
			checkOrientation();
		});

		return () => subscription?.remove();
	}, []);

	const computedDimension = useMemo(() => {
		if (!dimension?.width) return { width: 0, height: 0 };
		const isLandscape = dimension.width > dimension?.height;
		const computedWidth = isLandscape ? dimension.width * 0.4 : dimension.width * 0.8
		return {
			width: computedWidth,
			height: (computedWidth * 9) / 16
		}
	}, [dimension?.width, dimension?.height]);

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
					height={computedDimension.height}
					width={computedDimension.width}
					videoId={videoId}
					play={false}
					onReady={() => setIsVideoReady(true)}
					webViewProps={{
						androidLayerType: 'hardware',
						javaScriptEnabled: true,
						domStorageEnabled: true,
						allowsInlineMediaPlayback: true,
						nestedScrollEnabled: true,
						onStartShouldSetResponder: () => true,
						onTouchStart: () => {
							Keyboard.dismiss();
						},
					}}
				/>
			</View>
		</View>
	);
};

export default memo(RenderYoutubeVideo);
