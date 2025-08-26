import { size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type channelAppHotBarProps = {
	channelId: string;
	clanId: string;
};

const ChannelAppHotbar = ({ channelId, clanId }: channelAppHotBarProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();

	const openChannelApp = useCallback(async () => {
		navigation.navigate(APP_SCREEN.CHANNEL_APP, {
			channelId: channelId,
			clanId: clanId
		});
	}, [channelId, clanId]);

	return (
		<View
			style={{
				flexDirection: 'row',
				justifyContent: 'space-between',
				paddingVertical: size.s_6,
				paddingHorizontal: size.s_10,
				gap: size.s_10,
				backgroundColor: 'transparent'
			}}
		>
			<TouchableOpacity style={styles.channelAppButton} onPress={openChannelApp}>
				<Text style={styles.messageText}>Launch App</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.channelAppButton}>
				<Text style={styles.messageText}>Help</Text>
			</TouchableOpacity>
		</View>
	);
};

export default ChannelAppHotbar;
