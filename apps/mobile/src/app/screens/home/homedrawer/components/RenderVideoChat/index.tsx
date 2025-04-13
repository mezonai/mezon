import { Colors, size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';

export const RenderVideoChat = React.memo(
	({ videoURL, onLongPress }: { videoURL: string; onLongPress: () => void }) => {
		// const [loading, setLoading] = useState(true);
		const navigation = useNavigation<any>();

		const handlePlayVideo = () => {
			navigation.navigate(APP_SCREEN.VIDEO_DETAIL, { videoURL });
		};

		if (!videoURL) return null;
		const isUploading = !videoURL.startsWith('http');

		return (
			<View style={{ marginTop: size.s_10, marginBottom: size.s_6, opacity: isUploading ? 0.5 : 1 }}>
				<TouchableOpacity
					onPress={handlePlayVideo}
					onLongPress={onLongPress}
					style={{ alignItems: 'center', justifyContent: 'center', width: '80%', overflow: 'hidden', borderRadius: size.s_4 }}
				>
					<View
						style={{
							width: '100%',
							height: Math.max(160, size.s_100 * 2.5),
							borderRadius: size.s_4,
							backgroundColor: Colors.borderDim
						}}
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
			</View>
		);
	},
	(prevProps, nextProps) => prevProps.videoURL === nextProps.videoURL
);
