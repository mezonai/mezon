import { useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { style } from './styles';

interface IChannelBadgeUnreadProps {
	countMessageUnread: number;
}

export const ChannelBadgeUnread = memo(({ countMessageUnread }: IChannelBadgeUnreadProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={styles.channelDotWrapper}>
			<Text style={styles.channelDot} numberOfLines={1}>
				{countMessageUnread > 99 ? '99+' : countMessageUnread}
			</Text>
		</View>
	);
});
