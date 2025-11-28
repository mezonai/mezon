import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import { selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { OptionEvent } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Linking, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import JoinChannelVoiceBS from '../../../screens/home/homedrawer/components/ChannelVoice/JoinChannelVoiceBS';
import { style } from './styles';

interface IEventLocation {
	event: EventManagementEntity;
}

export function EventLocation({ event }: IEventLocation) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('eventCreator');
	const option = event.address ? OptionEvent.OPTION_LOCATION : OptionEvent.OPTION_SPEAKER;
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_voice_id || ''));

	const joinVoiceChannel = async () => {
		if (channelVoice?.meeting_code && channelVoice?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			const data = {
				heightFitContent: true,
				children: <JoinChannelVoiceBS channel={channelVoice} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		} else {
			const urlPrivateVoice = `${process.env.NX_CHAT_APP_REDIRECT_URI}${event?.meet_room?.external_link}`;
			await Linking.openURL(urlPrivateVoice);
		}
	};

	return (
		<View style={styles.container}>
			{option === OptionEvent.OPTION_SPEAKER && (
				<TouchableOpacity style={styles.inline} onPress={joinVoiceChannel}>
					<MezonIconCDN
						icon={event.is_private ? IconCDN.channelVoiceLock : IconCDN.channelVoice}
						height={size.s_16}
						width={size.s_16}
						color={themeValue.textStrong}
					/>
					<Text style={styles.smallText}>{channelVoice?.channel_label || t('eventDetail.privateRoom')}</Text>
				</TouchableOpacity>
			)}

			{option === OptionEvent.OPTION_LOCATION && (
				<View style={styles.inline}>
					<MezonIconCDN icon={IconCDN.locationIcon} height={16} width={16} color={themeValue.textStrong} />
					<Text style={styles.smallText}>{event?.address}</Text>
				</View>
			)}
		</View>
	);
}
