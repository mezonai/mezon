import { size, useTheme } from '@mezon/mobile-ui';
import { ReactNode } from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { IconCDN } from '../../../constants/icon_cdn';
import MezonIconCDN from '../../MezonIconCDN';
import { style } from './styles';

export interface IMezonMenuItemProps {
	isShow?: boolean;
	title: string;
	icon?: any;
	onPress?: () => void;
	expandable?: boolean;
	isLast?: boolean;
	component?: ReactNode;
	textStyle?: StyleProp<TextStyle>;
	disabled?: boolean;
	description?: string;
	previewValue?: string;
	styleBtn?: ViewStyle;
}
export default function MezonMenuItem({
	isLast,
	title,
	expandable,
	icon,
	onPress,
	component,
	textStyle,
	disabled = false,
	description,
	isShow = true,
	previewValue,
	styleBtn
}: IMezonMenuItemProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		isShow && (
			<Pressable
				disabled={disabled}
				onPress={() => {
					onPress && onPress();
				}}
				style={[styles.btn, styleBtn]}
			>
				{icon}
				<View style={[styles.btnTitleWrapper, disabled && styles.disable, !isLast && styles.borderBottom]}>
					<View style={styles.btnTextWrapper}>
						<Text style={[styles.btnTitle, textStyle]}>{title}</Text>
						{description && <Text style={[styles.btnDescription]}>{description}</Text>}
					</View>
					{component}
					{previewValue && <Text style={styles.previewValue}>{previewValue}</Text>}
					{expandable && <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />}
				</View>
			</Pressable>
		)
	);
}
