import { Block, size, useTheme } from '@mezon/mobile-ui';
import { selectIsUnreadChannelById, useAppSelector } from '@mezon/store-mobile';
import { ChannelThreads } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import LongCornerIcon from '../../../../../../../assets/svg/long-corner.svg';
import ShortCornerIcon from '../../../../../../../assets/svg/short-corner.svg';
import BuzzBadge from '../../../../../../components/BuzzBadge/BuzzBadge';
import { style } from './styles';

interface IChannelListThreadItemProps {
	onPress?: (thread: any) => void;
	onLongPress?: (thread: ChannelThreads) => void;
	thread: any;
	isActive?: boolean;
	isFirstThread?: boolean;
}

const ChannelListThreadItem = memo(({ onPress, onLongPress, thread, isActive, isFirstThread }: IChannelListThreadItemProps) => {
	const { themeValue, theme } = useTheme();
	const styles = style(themeValue);

	const isUnReadChannel = useAppSelector((state) => selectIsUnreadChannelById(state, thread.id));

	const numberNotification = useMemo(() => {
		return thread?.count_mess_unread ? thread?.count_mess_unread : 0;
	}, [thread?.count_mess_unread]);

	const onPressThreadItem = () => {
		onPress && onPress(thread);
	};

	const onLongPressThreadItem = () => {
		onLongPress && onLongPress(thread);
	};

	return (
		<View key={thread.id} style={[styles.channelListLink]}>
			<View style={[styles.threadItem]}>
				{isFirstThread ? (
					<Block top={-size.s_14}>
						<ShortCornerIcon width={size.s_12} height={size.s_16} />
					</Block>
				) : (
					<Block top={-size.s_20}>
						<LongCornerIcon width={size.s_12} height={size.s_36} />
						{/*hardcode virtual view to connect thread lines */}
						<Block backgroundColor={'#535353'} width={1.2} height={size.s_10} position={'absolute'} top={-5} left={0.3} />
					</Block>
				)}
				<TouchableOpacity
					style={[
						styles.boxThread,
						isActive && { backgroundColor: theme === 'light' ? themeValue.secondaryWeight : themeValue.secondaryLight }
					]}
					activeOpacity={1}
					onPress={onPressThreadItem}
					onLongPress={onLongPressThreadItem}
				>
					<Text
						style={[
							styles.titleThread,
							(isUnReadChannel || Number(numberNotification || 0) > 0) && styles.channelListItemTitleActive,
							isActive && { backgroundColor: theme === 'light' ? themeValue.secondaryWeight : themeValue.secondaryLight }
						]}
						numberOfLines={1}
					>
						{thread?.channel_label}
					</Text>
				</TouchableOpacity>
				<BuzzBadge channelId={thread?.channel_id as string} mode={ChannelStreamMode.STREAM_MODE_THREAD} customStyles={styles.buzzBadge} />
			</View>

			{Number(numberNotification || 0) > 0 && isUnReadChannel && (
				<View style={[styles.channelDotWrapper]}>
					<Text style={styles.channelDot}>{numberNotification}</Text>
				</View>
			)}
		</View>
	);
});
export default ChannelListThreadItem;
