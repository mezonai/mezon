import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ICategoryChannel } from '@mezon/utils';
import { Text, TouchableOpacity, View } from 'react-native';
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
				<Icons.ChevronSmallDownIcon
					width={size.s_20}
					height={size.s_20}
					color={themeValue.text}
					style={[!isCollapsed && { transform: [{ rotate: '-90deg' }] }]}
				/>
				<Text style={styles.channelListHeaderItemTitle}>{title}</Text>
			</View>
		</TouchableOpacity>
	);
};
export default ChannelListSectionHeader;
