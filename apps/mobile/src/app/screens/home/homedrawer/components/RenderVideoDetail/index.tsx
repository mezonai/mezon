import { Icons } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';

export const RenderVideoDetail = React.memo(({ route }: { route: any }) => {
	const videoURL = route?.params?.videoURL as string;
	const videoRef = useRef(null);
	const navigation = useNavigation<any>();
	const [hasError, setHasError] = useState(false);
	const [isBuffering, setIsBuffering] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);

	const handleClose = () => {
		navigation.goBack();
	};
	const handleRetry = () => {
		setHasError(false);
	};

	const onError = () => {
		setHasError(true);
		Toast.show({ type: 'error', text1: 'Failed to load video.' });
	};

	const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
		setIsBuffering(isBuffering);
	};

	const onLoad = () => {
		setHasError(false);
	};

	if (!videoURL) return null;

	return (
		<View style={{ flex: 1, backgroundColor: '#000', paddingVertical: size.s_50, justifyContent: 'center', alignItems: 'center' }}>
			<StatusBarHeight />
			<Video
				ref={videoRef}
				source={{ uri: videoURL }}
				style={{ width: '100%', height: '100%' }}
				resizeMode="contain"
				controls={true}
				paused={false}
				disableFocus={true}
				muted={false}
				onError={onError}
				onBuffer={onBuffer}
				onLoad={onLoad}
				ignoreSilentSwitch="ignore"
				mixWithOthers="mix"
				onReadyForDisplay={() => setIsPlaying(true)}
				controlsStyles={{
					hidePosition: false,
					hidePlayPause: false,
					hideForward: false,
					hideRewind: false,
					hideNext: false,
					hidePrevious: false,
					hideFullscreen: false,
					hideSeekBar: false,
					hideDuration: false,
					hideNavigationBarOnFullScreenMode: true,
					hideNotificationBarOnFullScreenMode: true,
					hideSettingButton: true,
					seekIncrementMS: 10000,
					liveLabel: 'LIVE'
				}}
			/>

			<TouchableOpacity onPress={handleClose} style={{ position: 'absolute', top: size.s_24, right: 0, padding: size.s_10 }}>
				<Icons.CloseIcon height={size.s_40} width={size.s_40} />
			</TouchableOpacity>

			{(isBuffering || !isPlaying) && (
				<ActivityIndicator style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -15 }, { translateY: -15 }] }} />
			)}

			{hasError && (
				<TouchableOpacity
					onPress={handleRetry}
					style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -40 }, { translateY: -10 }] }}
				>
					<Text style={{ color: 'white' }}>Retry</Text>
				</TouchableOpacity>
			)}
		</View>
	);
});
