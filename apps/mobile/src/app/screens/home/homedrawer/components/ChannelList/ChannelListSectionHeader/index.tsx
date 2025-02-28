import { size, useTheme } from '@mezon/mobile-ui';
import { ICategoryChannel } from '@mezon/utils';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from './styles';

interface IChannelListSectionHeaderProps {
	title: string;
	onPress: any;
	onLongPress: () => void;
	isCollapsed: boolean;
	category: ICategoryChannel;
}

const ChannelListSectionHeader = ({ onPress, title, onLongPress, isCollapsed, category }: IChannelListSectionHeaderProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<TouchableOpacity activeOpacity={0.8} onPress={() => onPress(category)} onLongPress={onLongPress} style={styles.channelListHeader}>
			<View style={styles.channelListHeaderItem}>
				<FastImage
					source={{
						uri: IconCDN.chevronDownSmallIcon
					}}
					style={{ height: size.s_18, width: size.s_18, transform: isCollapsed ? [{ rotate: '-90deg' }] : [] }}
				/>
				<Text style={styles.channelListHeaderItemTitle}>{title}</Text>
			</View>
		</TouchableOpacity>
	);
};
export default ChannelListSectionHeader;
