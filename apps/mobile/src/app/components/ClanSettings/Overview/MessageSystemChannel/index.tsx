import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { memo } from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { style } from './styles';

interface ChannelsMessageSystemProps {
	listChannelWithoutVoice: ChannelsEntity[];
	onSelectChannel?: (channel: ChannelsEntity) => void;
}

const ChannelsMessageSystem = ({ onSelectChannel, listChannelWithoutVoice }: ChannelsMessageSystemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const selectChannel = (item: ChannelsEntity) => {
		onSelectChannel(item);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<TouchableOpacity style={styles.channelItem} onPress={() => selectChannel(item)}>
				<View style={styles.containerIcon}>
					{item?.channel_private ? (
						<Icons.TextLockIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
					) : (
						<Icons.TextIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
					)}
				</View>

				<View style={styles.containerText}>
					<Text style={styles.channelItemText} numberOfLines={1} ellipsizeMode="tail">
						{item?.channel_label}
					</Text>
					<Text style={styles.channelItemText} numberOfLines={1} ellipsizeMode="tail">
						{item?.category_name}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={{ height: size.s_615 }}>
			<FlatList
				data={listChannelWithoutVoice}
				keyExtractor={(item, index) => `channel_system:${item?.channel_id}_${index}`}
				renderItem={renderItem}
			/>
		</View>
	);
};

export default memo(ChannelsMessageSystem);
