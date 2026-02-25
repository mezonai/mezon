import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { IChannel } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BuzzBadge from '../../../../../../components/BuzzBadge/BuzzBadge';
import ChannelMenu from '../../ChannelMenu';
import { ChannelBadgeUnread } from '../ChannelBadgeUnread';
import { EventBadge } from '../ChannelEventBadge';
import { style } from '../ChannelListItem/styles';
import ChannelListThreadItem from '../ChannelListThreadItem';
import { ChannelStatusIcon } from '../ChannelStatusIcon';

interface IChannelItemProps {
	data: IChannel;
	isUnRead?: boolean;
	isActive?: boolean;
}

function ChannelItem({ data, isUnRead, isActive }: IChannelItemProps) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue, themeBasic);
	const countMessageUnread = Number(data?.count_mess_unread) || 0;

	const isUnReadChannel = useMemo(() => {
		return isUnRead || countMessageUnread > 0;
	}, [isUnRead, countMessageUnread]);

	const onPress = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_ROUTER, { channel: data });
	}, [data]);

	const onLongPress = useCallback(() => {
		const dataBottomSheet = {
			heightFitContent: true,
			children: <ChannelMenu channel={data} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data: dataBottomSheet });
	}, [data]);

	if (data?.type === ChannelType.CHANNEL_TYPE_THREAD) {
		return <ChannelListThreadItem thread={data} isActive={isActive} onLongPress={onLongPress} />;
	}

	return (
		<View style={[styles.channelListItemContainer, isActive && styles.channelListItemActive]}>
			<TouchableOpacity
				activeOpacity={0.7}
				onPress={onPress}
				onLongPress={onLongPress}
				style={[styles.channelListLink, isActive && styles.channelListItemWrapper]}
			>
				{!isActive && (
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
						style={[StyleSheet.absoluteFillObject]}
					/>
				)}
				<View style={[styles.channelListItem]}>
					{isUnReadChannel && <View style={styles.dotIsNew} />}

					<ChannelStatusIcon channel={data} isUnRead={isUnReadChannel} />
					<EventBadge clanId={data?.clan_id} channelId={data?.channel_id} />
					<Text style={[styles.channelListItemTitle, isUnReadChannel && styles.channelListItemTitleActive]} numberOfLines={1}>
						{data?.channel_label || ''}
					</Text>
				</View>
				<BuzzBadge channelId={data?.channel_id} clanId={data?.clan_id} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />

				{countMessageUnread > 0 && <ChannelBadgeUnread countMessageUnread={countMessageUnread} />}
			</TouchableOpacity>
		</View>
	);
}
export default memo(ChannelItem, (prevProps, nextProps) => {
	return (
		prevProps?.data?.channel_private === nextProps?.data?.channel_private &&
		prevProps?.data?.channel_label === nextProps?.data?.channel_label &&
		prevProps?.data?.channel_id === nextProps?.data?.channel_id &&
		prevProps?.data?.count_mess_unread === nextProps?.data?.count_mess_unread &&
		prevProps?.isUnRead === nextProps?.isUnRead &&
		prevProps?.isActive === nextProps?.isActive
	);
});
