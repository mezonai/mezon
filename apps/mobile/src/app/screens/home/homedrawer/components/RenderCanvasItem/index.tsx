import { useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { styles } from './styles';

const RenderCanvasItem = memo(({ channelId, clanId, canvasId }: { channelId: string; clanId: string; canvasId: string }) => {
	const navigation = useNavigation<any>();

	return (
		<View>
			<TouchableOpacity
				activeOpacity={0.8}
				onPress={() => {
					navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.CANVAS,
						params: {
							channelId,
							clanId,
							canvasId
						}
					});
				}}
				style={styles.buttonContainer}
			>
				<Text style={styles.buttonText} numberOfLines={1}>
					Open Canvas
				</Text>
			</TouchableOpacity>
		</View>
	);
});

export default RenderCanvasItem;
