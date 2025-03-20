import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	createSystemMessage,
	selectAllChannels,
	selectClanSystemMessage,
	selectCurrentClanId,
	updateSystemMessage,
	useAppDispatch
} from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { style } from './styles';

const ChannelsMessageSystem = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const channelsList = useSelector(selectAllChannels);
	const systemMessage = useSelector(selectClanSystemMessage);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const listChannelWithoutVoice = channelsList.filter(
		(channel) => channel?.clan_id === currentClanId && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL
	);

	const handleSetSystemMessageChannel = async (channel: ChannelsEntity) => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClanId) {
			const updateSystemMessageRequest = {
				channel_id: channel?.channel_id,
				welcome_random: '1',
				welcome_sticker: '1',
				boost_message: '1',
				setup_tips: '1',
				hide_audit_log: '0'
			};
			const request = {
				clanId: currentClanId,
				newMessage: updateSystemMessageRequest
			};
			if (updateSystemMessageRequest && updateSystemMessageRequest?.channel_id) await dispatch(updateSystemMessage(request));
		} else {
			const createSystemMessageRequest = {
				clan_id: currentClanId,
				channel_id: channel?.channel_id,
				welcome_random: '1',
				welcome_sticker: '1',
				boost_message: '1',
				setup_tips: '1',
				hide_audit_log: '0'
			};

			if (createSystemMessageRequest && createSystemMessageRequest?.channel_id) await dispatch(createSystemMessage(createSystemMessageRequest));
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<TouchableOpacity style={styles.channelItem} onPress={() => handleSetSystemMessageChannel(item)}>
				{item?.channel_id === systemMessage?.channel_id ? (
					<Icons.CheckmarkLargeIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
				) : item?.channel_private ? (
					<Icons.TextIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
				) : (
					<Icons.TextLockIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
				)}
				<Text style={styles.channelItemText} numberOfLines={1} ellipsizeMode="tail">
					{item?.channel_label}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View>
			<FlatList
				data={listChannelWithoutVoice}
				scrollEnabled={false}
				keyExtractor={(item, index) => `channel_system:${item?.channel_id}_${index}`}
				renderItem={renderItem}
			/>
		</View>
	);
};

export default ChannelsMessageSystem;
