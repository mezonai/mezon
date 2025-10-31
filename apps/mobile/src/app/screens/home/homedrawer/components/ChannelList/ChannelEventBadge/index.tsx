import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size } from '@mezon/mobile-ui';
import { selectChannelById, selectEventsByChannelId, useAppSelector } from '@mezon/store-mobile';
import { EEventStatus } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo } from 'react';
import { DeviceEventEmitter, Pressable, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import JoinChannelVoiceBS from '../../ChannelVoice/JoinChannelVoiceBS';
import { style } from './styles';

type EventBadgeProps = {
	clanId: string;
	channelId: string;
};
export const EventBadge = memo(({ clanId, channelId }: EventBadgeProps) => {
	const events = useAppSelector((state) => selectEventsByChannelId(state, clanId ?? '', channelId ?? ''));
	const channelVoice = useAppSelector((state) => selectChannelById(state, events?.[0]?.channel_voice_id ?? ''));
	const colorStatusEvent = events?.[0]?.event_status === EEventStatus.UPCOMING ? baseColor.blurple : baseColor.bgSuccess;

	const hanleEventChannel = async () => {
		if (!events?.[0] && !events?.[0]?.channel_voice_id) return;
		if (channelVoice?.meeting_code && channelVoice?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			const data = {
				heightFitContent: true,
				children: <JoinChannelVoiceBS channel={channelVoice} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}
	};

	if (events?.length && (events?.[0]?.event_status === EEventStatus.UPCOMING || events?.[0]?.event_status === EEventStatus.ONGOING)) {
		return (
			<View style={style.container}>
				<Pressable onPress={hanleEventChannel}>
					<MezonIconCDN icon={IconCDN.calendarIcon} height={size.s_18} width={size.s_18} color={colorStatusEvent} />
				</Pressable>
			</View>
		);
	}
	return <View />;
});
