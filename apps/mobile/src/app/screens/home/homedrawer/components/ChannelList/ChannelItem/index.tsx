import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { IChannel } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import BuzzBadge from '../../../../../../components/BuzzBadge/BuzzBadge';
import { ChannelBadgeUnread } from '../ChannelBadgeUnread';
import { EventBadge } from '../ChannelEventBadge';
import { StatusVoiceChannel } from '../ChannelListItem';
import { style } from '../ChannelListItem/styles';
import ChannelListThreadItem from '../ChannelListThreadItem';
import { ChannelStatusIcon } from '../ChannelStatusIcon';

interface IChannelItemProps {
	onPress: () => void;
	onLongPress: () => void;
	data: IChannel;
	isUnRead?: boolean;
	isActive?: boolean;
}

function ChannelItem({ onLongPress, onPress, data, isUnRead, isActive }: IChannelItemProps) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const numberNotification = data?.count_mess_unread ? data?.count_mess_unread : 0;

	if (data.type === ChannelType.CHANNEL_TYPE_THREAD) {
		return <ChannelListThreadItem thread={data} isActive={isActive} onPress={onPress} onLongPress={onLongPress} />;
	}

	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={() => onPress()}
			onLongPress={onLongPress}
			style={[
				styles.channelListLink,
				isActive && styles.channelListItemActive,
				isActive && {
					backgroundColor: themeBasic === ThemeModeBase.LIGHT ? themeValue.secondaryWeight : themeValue.secondaryLight,
					opacity: 0.9,
					shadowColor: themeValue.primary,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.25,
					shadowRadius: 3.84,
					elevation: 5
				}
			]}
		>
			<View style={[styles.channelListItem]}>
				{(isUnRead || Number(numberNotification || 0) > 0) && <View style={styles.dotIsNew} />}

				<ChannelStatusIcon channel={data} isUnRead={isUnRead || Number(numberNotification || 0) > 0} />
				<EventBadge clanId={data?.clan_id} channelId={data?.channel_id} />
				<Text
					style={[styles.channelListItemTitle, (isUnRead || Number(numberNotification || 0) > 0) && styles.channelListItemTitleActive]}
					numberOfLines={1}
				>
					{data?.channel_label}
				</Text>
			</View>
			{(data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) &&
				data?.status === StatusVoiceChannel.No_Active && <ActivityIndicator color={themeValue.white} />}

			<BuzzBadge channelId={data?.channel_id as string} clanId={data?.clan_id as string} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />

			{Number(numberNotification || 0) > 0 && <ChannelBadgeUnread countMessageUnread={Number(numberNotification || 0)} />}
		</TouchableOpacity>
	);
}
export default React.memo(ChannelItem);
