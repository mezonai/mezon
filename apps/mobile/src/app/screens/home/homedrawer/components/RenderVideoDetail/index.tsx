import { size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';

export const RenderVideoDetail = React.memo(({ route }: { route: any }) => {
	const videoURL = route?.params?.videoURL as string;
	const videoRef = useRef(null);
	const navigation = useNavigation<any>();
	const [isBuffering, setIsBuffering] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isReadyDisplay, setIsReadyDisplay] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsReadyDisplay(true);
		}, 200);
		return () => {
			clearTimeout(timer);
		};
	}, []);

	const handleClose = () => {
		navigation.goBack();
	};

	const onError = () => {
		Toast.show({ type: 'error', text1: 'Failed to load video.' });
	};

	const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
		setIsBuffering(isBuffering);
	};

	return (
		<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: size.s_50, justifyContent: 'center', alignItems: 'center' }}>
			<StatusBarHeight />
			{!!videoURL && isReadyDisplay && (
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
			)}
			<TouchableOpacity onPress={handleClose} style={{ position: 'absolute', top: size.s_24, right: 0, padding: size.s_10 }}>
				<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_40} width={size.s_40} />
			</TouchableOpacity>

			{(isBuffering || !isPlaying) && (
				<ActivityIndicator style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -15 }, { translateY: -15 }] }} />
			)}
		</View>
	);
});
