import { useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { style } from './styles';

interface ISectionBadgeProps {
	title: string;
	icon?: string;
}

const SectionBadge = ({ title, icon }: ISectionBadgeProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.container}>
			<View style={styles.badge}>
				{icon && <Text style={styles.icon}>{icon}</Text>}
				<Text style={styles.title}>{title}</Text>
			</View>
		</View>
	);
};

export default memo(SectionBadge);
