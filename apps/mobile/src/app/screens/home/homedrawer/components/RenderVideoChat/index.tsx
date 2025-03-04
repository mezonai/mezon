import { Colors, Metrics, size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import FastImage from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';

const widthMedia = Metrics.screenWidth - 150;

export const RenderVideoChat = React.memo(
	({ videoURL, onLongPress }: { videoURL: string, onLongPress: () => void }) => {
		const [thumbnail, setThumbnail] = useState<string | null>(null);
		const [loading, setLoading] = useState(true);
		const navigation = useNavigation<any>();

		useEffect(() => {
			setLoading(false);
			if (videoURL) {
				createThumbnail({ url: videoURL, timeStamp: 1000 })
					.then((response) => setThumbnail(response.path))
					.catch(() => {
						setThumbnail(null);
						// Toast.show({ type: 'error', text1: 'Failed to generate thumbnail.' });
					})
					.finally(() => setLoading(false));
			}
		}, [videoURL]);

		const handlePlayVideo = () => {
			navigation.navigate(APP_SCREEN.VIDEO_DETAIL, { videoURL });
		};

		if (!videoURL) return null;
		const isUploading = !videoURL.startsWith('http');

		return (
			<View style={{ marginTop: size.s_10, marginBottom: size.s_6, opacity: isUploading ? 0.5 : 1 }}>
				{loading || isUploading ? (
					<View
						style={{
							width: Math.max(widthMedia, Metrics.screenWidth - size.s_60 * 2),
							height: Math.max(160, size.s_100 * 2.5),
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: Colors.borderDim
						}}
					>
						<ActivityIndicator />
					</View>
				) : (
					<TouchableOpacity
						onPress={handlePlayVideo}
						onLongPress={onLongPress}
						style={{ alignItems: 'center', justifyContent: 'center', width: '80%', overflow: 'hidden', borderRadius: size.s_4 }}
					>
						<FastImage
							source={{ uri: thumbnail || '' }}
							style={{
								width: '100%',
								height: Math.max(160, size.s_100 * 2.5),
								borderRadius: size.s_4,
								backgroundColor: Colors.borderDim
							}}
							resizeMode="cover"
						/>
						<View
							style={{
								position: 'absolute',
								alignSelf: 'center',
								backgroundColor: 'rgba(0, 0, 0, 0.5)',
								borderRadius: size.s_60,
								width: size.s_60,
								height: size.s_60,
								justifyContent: 'center',
								alignItems: 'center'
							}}
						>
							<Entypo size={size.s_40} name="controller-play" style={{ color: '#eaeaea' }} />
						</View>
					</TouchableOpacity>
				)}
			</View>
		);
	},
	(prevProps, nextProps) => prevProps.videoURL === nextProps.videoURL
);
