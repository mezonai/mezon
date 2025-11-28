import { useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity } from 'react-native';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { styles } from './styles';

const RenderCanvasItem = memo(({ channelId, clanId, canvasId }: { channelId: string; clanId: string; canvasId: string }) => {
	const navigation = useNavigation<any>();
	const { t } = useTranslation('common');

	return (
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
				{t('openCanvas')}
			</Text>
		</TouchableOpacity>
	);
});

export default RenderCanvasItem;
