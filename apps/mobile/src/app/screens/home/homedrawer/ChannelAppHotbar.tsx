import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
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
	const { t } = useTranslation(['common']);

	const openChannelApp = useCallback(async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});
		navigation.navigate(APP_SCREEN.CHANNEL_APP, {
			channelId,
			clanId
		});
	}, [channelId, clanId]);

	return (
		<View style={styles.channelAppHotbarContainer}>
			<TouchableOpacity style={styles.channelAppButton} onPress={openChannelApp}>
				<Text style={styles.messageText}>{t('launchApp')}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.channelAppButton}>
				<Text style={styles.messageText}>{t('help')}</Text>
			</TouchableOpacity>
		</View>
	);
};

export default ChannelAppHotbar;
