import { memo } from 'react';
import { Text, View } from 'react-native';
import { style } from './styles';

interface IChannelBadgeUnreadProps {
	countMessageUnread: number;
	customDimension: number | undefined;
}

export const ChannelBadgeUnread = memo(({ countMessageUnread, customDimension = undefined }: IChannelBadgeUnreadProps) => {
	const styles = style(customDimension);

	return (
		<View style={styles.channelDotWrapper}>
			<Text style={styles.channelDot} numberOfLines={1}>
				{countMessageUnread > 99 ? '99+' : countMessageUnread}
			</Text>
		</View>
	);
});
