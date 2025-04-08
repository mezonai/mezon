import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { OptionEvent } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { DeviceEventEmitter, Linking, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { linkGoogleMeet } from '../../../utils/helpers';
import { style } from './styles';

interface IEventLocation {
	event: EventManagementEntity;
}

export function EventLocation({ event }: IEventLocation) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const option = event.address ? OptionEvent.OPTION_LOCATION : OptionEvent.OPTION_SPEAKER;
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_voice_id || ''));
	// const channelFirst = useSelector(selectChannelFirst);
	const { dismiss } = useBottomSheetModal();

	const joinVoiceChannel = async () => {
		if (channelVoice?.meeting_code && channelVoice?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
			const urlVoice = `${linkGoogleMeet}${channelVoice?.meeting_code}`;
			await Linking.openURL(urlVoice);
		} else if (channelVoice?.meeting_code && channelVoice?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			dismiss();
			DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, channelVoice);
		} else {
			const urlPrivateVoice = `${process.env.NX_CHAT_APP_REDIRECT_URI}${event?.meet_room?.external_link}`;
			await Linking.openURL(urlPrivateVoice);
		}
	};

	return (
		<View style={styles.container}>
			{option === OptionEvent.OPTION_SPEAKER && (
				<TouchableOpacity style={styles.inline} onPress={joinVoiceChannel}>
					<MezonIconCDN icon={IconCDN.channelVoice} height={16} width={16} color={themeValue.textStrong} />
					<Text style={styles.smallText}>{channelVoice?.channel_label || event?.meet_room?.room_name}</Text>
				</TouchableOpacity>
			)}

			{option === OptionEvent.OPTION_LOCATION && (
				<View style={styles.inline}>
					<MezonIconCDN icon={IconCDN.locationIcon} height={16} width={16} color={themeValue.textStrong} />
					<Text style={styles.smallText}>{event?.address}</Text>
				</View>
			)}

			{/* {option === '' && !event && !channelVoice && (
                <>
                    <Icons.Location />
                    <p className="hover:underline text-slate-400">{channelFirst.channel_label}</p>
                </>
            )} */}
		</View>
	);
}
