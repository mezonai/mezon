import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { selectIsUnreadChannelById, useAppSelector } from '@mezon/store-mobile';
import { ChannelThreads } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../app/componentUI/MezonIconCDN';
import BuzzBadge from '../../../../../../components/BuzzBadge/BuzzBadge';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from './styles';

interface IChannelListThreadItemProps {
	onLongPress?: (thread: ChannelThreads) => void;
	thread: any;
	isActive?: boolean;
}

const ChannelListThreadItem = ({ onLongPress, thread, isActive }: IChannelListThreadItemProps) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);

	const isUnReadChannel = useAppSelector((state) => selectIsUnreadChannelById(state, thread.id));

	const numberNotification = thread?.count_mess_unread ? thread?.count_mess_unread : 0;

	const onPressThreadItem = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_ROUTER, { channel: thread });
	};

	const onLongPressThreadItem = () => {
		onLongPress && onLongPress(thread);
	};

	return (
		<View key={thread.id} style={[styles.channelListLink]}>
			<View style={[styles.threadItem]}>
				<View style={styles.cornerIconWrapper}>
					<MezonIconCDN icon={IconCDN.longCorner} height={size.s_36} width={size.s_12} color={'#535353'} />
					<View style={styles.virtualConnectorLine} />
				</View>
				<TouchableOpacity
					style={[
						styles.boxThread,
						isActive && { backgroundColor: themeBasic === ThemeModeBase.LIGHT ? themeValue.secondaryWeight : themeValue.secondaryLight }
					]}
					activeOpacity={1}
					onPress={onPressThreadItem}
					onLongPress={onLongPressThreadItem}
				>
					<Text
						style={[
							styles.titleThread,
							(isUnReadChannel || Number(numberNotification || 0) > 0) && styles.channelListItemTitleActive,
							isActive && {
								backgroundColor: themeBasic === ThemeModeBase.LIGHT ? themeValue.secondaryWeight : themeValue.secondaryLight
							}
						]}
						numberOfLines={1}
					>
						{thread?.channel_label}
					</Text>
				</TouchableOpacity>
				<BuzzBadge
					channelId={thread?.channel_id as string}
					clanId={thread?.clan_id as string}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
					customStyles={styles.buzzBadge}
				/>
			</View>

			{Number(numberNotification || 0) > 0 && (
				<View style={[styles.channelDotWrapper]}>
					<Text style={styles.channelDot}>{numberNotification > 99 ? '99+' : numberNotification}</Text>
				</View>
			)}
		</View>
	);
};
export default ChannelListThreadItem;
