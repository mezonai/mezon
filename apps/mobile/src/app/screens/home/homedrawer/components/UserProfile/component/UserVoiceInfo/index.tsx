import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectStatusInVoice } from '@mezon/store-mobile';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './styles';

export const UserVoiceInfo = ({ userId }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue, false);
	const { t } = useTranslation(['userProfile']);
	const inVoiceUser = useSelector((state) => selectStatusInVoice(state, userId));
	const voiceChannel = useSelector((state) => selectChannelById(state, inVoiceUser));
	const navigateToChannelVoice = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_ROUTER, { channel: voiceChannel });
	};

	if (!voiceChannel) {
		return null;
	}

	return (
		<View style={styles.userInfo}>
			<Text style={[styles.actionText, { marginBottom: size.s_10 }]} numberOfLines={1}>
				{t('voiceInfo.inVoice')}
			</Text>
			<View style={styles.wrapManageVoice}>
				<MezonIconCDN icon={IconCDN.channelVoice} color={themeValue.text} width={size.s_20} height={size.s_20} />
				<Text style={[styles.actionText]} numberOfLines={1}>
					{voiceChannel.channel_label}
				</Text>
			</View>
			<TouchableOpacity onPress={navigateToChannelVoice} style={styles.voiceJoinButton}>
				<Text style={[styles.actionText, { color: baseColor.white }]} numberOfLines={1}>
					{t('voiceInfo.joinVoice')}
				</Text>
			</TouchableOpacity>
		</View>
	);
};
