import { size, useTheme } from '@mezon/mobile-ui';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { IProductDetail } from '../../ProductDetailModal';
import { style } from './styles';

interface ISectionBadgeProps {
	title: string;
	icon?: string;
	data?: IProductDetail[] | any;
	onPress?: () => void;
}

const SectionBadge = ({ title, icon, data, onPress }: ISectionBadgeProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.container}>
			<View style={styles.badge}>
				{icon && <Text style={styles.icon}>{icon}</Text>}
				<Text style={styles.title}>{title}</Text>
			</View>
			{data?.length > 0 && (
				<TouchableOpacity style={styles.badge} onPress={onPress}>
					<MezonIconCDN icon={IconCDN.viewAll} width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
				</TouchableOpacity>
			)}
		</View>
	);
};

export default memo(SectionBadge);
