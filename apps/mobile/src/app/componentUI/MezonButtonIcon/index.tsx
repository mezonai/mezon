import { useTheme } from '@mezon/mobile-ui';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { style } from './styles';

interface IMezonButtonIconProps {
	onPress?: () => void;
	icon: any;
	title: string;
}

export default function MezonButtonIcon({ title, icon, onPress }: IMezonButtonIconProps) {
	const styles = style(useTheme().themeValue);
	return (
		<Pressable onPress={onPress} style={styles.container}>
			<View style={styles.iconWrapper}>{icon}</View>
			<Text style={styles.title}>{title}</Text>
		</Pressable>
	);
}
