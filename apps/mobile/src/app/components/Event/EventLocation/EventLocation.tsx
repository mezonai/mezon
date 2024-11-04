import { Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { OptionEvent } from '@mezon/utils';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { linkGoogleMeet } from '../../../utils/helpers';
import { style } from './styles';

interface IEventLocation {
	event: EventManagementEntity;
}

export function EventLocation({ event }: IEventLocation) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const option = event.address ? OptionEvent.OPTION_LOCATION : OptionEvent.OPTION_SPEAKER;
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_id || ''));
	// const channelFirst = useSelector(selectChannelFirst);

	const joinVoiceChannel = async () => {
		if (channelVoice?.meeting_code) {
			const urlVoice = `${linkGoogleMeet}${channelVoice?.meeting_code}`;
			await Linking.openURL(urlVoice);
		}
	};

	return (
		<View style={styles.container}>
			{option === OptionEvent.OPTION_SPEAKER && (
				<TouchableOpacity style={styles.inline} onPress={joinVoiceChannel}>
					<Icons.VoiceNormalIcon height={16} width={16} color={themeValue.textStrong} />
					<Text style={styles.smallText}>{channelVoice?.channel_label}</Text>
				</TouchableOpacity>
			)}

			{option === OptionEvent.OPTION_LOCATION && (
				<View style={styles.inline}>
					<Icons.LocationIcon height={16} width={16} color={themeValue.textStrong} />
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
