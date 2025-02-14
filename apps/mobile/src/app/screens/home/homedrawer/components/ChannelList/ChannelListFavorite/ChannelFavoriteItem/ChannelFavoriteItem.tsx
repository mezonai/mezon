import { useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChannelBadgeUnread } from '../../ChannelBadgeUnread';
import { ChannelStatusIcon } from '../../ChannelStatusIcon';
import { style } from './styles';

export const ChannelFavoriteItem = React.memo(({ channelId, onPress }: { channelId: string; onPress: (channel: ChannelsEntity) => void }) => {
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const numberNotification = useMemo(() => {
		return channel?.count_mess_unread ? channel?.count_mess_unread : 0;
	}, [channel?.count_mess_unread]);

	const styles = style(useTheme().themeValue);
	return (
		<TouchableOpacity
			onPress={() => {
				onPress(channel);
			}}
			style={styles.favoriteItem}
		>
			<View style={styles.channelItem}>
				<ChannelStatusIcon channel={channel} />
				<Text numberOfLines={1} style={styles.channelItemTitle}>
					{channel?.channel_label}
				</Text>
			</View>
			{Number(numberNotification || 0) > 0 && <ChannelBadgeUnread countMessageUnread={Number(numberNotification || 0)} />}
		</TouchableOpacity>
	);
});
