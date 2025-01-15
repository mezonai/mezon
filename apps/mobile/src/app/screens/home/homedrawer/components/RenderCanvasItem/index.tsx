/* eslint-disable @nx/enforce-module-boundaries */
import { Block } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { APP_SCREEN } from 'apps/mobile/src/app/navigation/ScreenTypes';
import { colors } from 'libs/mobile-ui/src/lib/themes/Colors';
import { memo } from 'react';
import { Text, TouchableOpacity } from 'react-native';

const RenderCanvasItem = memo(({ channelId, clanId, canvasId }: { channelId: string; clanId: string; canvasId: string }) => {
	const navigation = useNavigation<any>();

	return (
		<Block>
			<TouchableOpacity
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
			>
				<Text style={{ color: colors.textLink, backgroundColor: colors.midnightBlue }} numberOfLines={1}>
					Open Canvas
				</Text>
			</TouchableOpacity>
		</Block>
	);
});

export default RenderCanvasItem;
