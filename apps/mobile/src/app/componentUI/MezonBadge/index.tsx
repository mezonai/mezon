import { size } from '@mezon/mobile-ui';
import { Text, View } from 'react-native';
import { IconCDN } from '../../constants/icon_cdn';
import MezonIconCDN from '../MezonIconCDN';
import styles from './styles';

interface MezonBadgeProps {
	title: string;
	type?: 'success' | 'warning' | 'danger';
}

export default function MezonBadge({ title, type }: MezonBadgeProps) {
	function renderContainerStyle() {
		if (type === 'success') return styles.containerSuccess;
		else if (type === 'warning') return styles.containerWarning;
		else if (type === 'danger') return styles.containerDanger;
	}

	return (
		<View style={[styles.container, renderContainerStyle()]}>
			<MezonIconCDN icon={IconCDN.verifyIcon} height={size.s_16} width={size.s_16} />
			<Text style={styles.title}>{title}</Text>
		</View>
	);
}
