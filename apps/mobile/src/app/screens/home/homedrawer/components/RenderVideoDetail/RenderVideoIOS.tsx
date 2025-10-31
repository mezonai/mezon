import React from 'react';
import { requireNativeComponent } from 'react-native';
import { styles } from './styles-ios';

const VideoPlayerView = requireNativeComponent('VideoPlayerView');

export const RenderVideoIOS = React.memo(({ videoURL }: { videoURL: string }) => {
	return <VideoPlayerView style={styles.videoPlayer} source={videoURL} />;
});
