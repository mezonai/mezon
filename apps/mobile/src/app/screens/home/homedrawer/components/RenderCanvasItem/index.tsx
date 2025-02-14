/* eslint-disable @nx/enforce-module-boundaries */
import { size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { APP_SCREEN } from 'apps/mobile/src/app/navigation/ScreenTypes';
import { colors } from 'libs/mobile-ui/src/lib/themes/Colors';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
				style={{
					marginTop: size.s_6,
					borderColor: colors.textLink,
					borderWidth: 1,
					padding: size.s_6,
					paddingHorizontal: size.s_16,
					borderRadius: size.s_6
				}}
			>
				<Text style={{ color: colors.textLink, textAlign: 'center', fontWeight: 'bold' }} numberOfLines={1}>
					Open Canvas
				</Text>
			</TouchableOpacity>
		</View>
	);
});

export default RenderCanvasItem;
