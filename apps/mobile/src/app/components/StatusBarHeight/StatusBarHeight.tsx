import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IStatusBarHeightProps {
	isPrimary?: boolean;
}

const StatusBarHeight = ({ isPrimary = false }: IStatusBarHeightProps) => {
	const insets = useSafeAreaInsets();
	const { themeValue } = useTheme();

	const PRIMARY_GRADIANT = [themeValue?.primaryGradiant || themeValue.primary, themeValue.primary];
	const SECONDARY_GRADIANT = [themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary];

	const statusBarHeight = Platform.OS === 'android' ? 0 : insets.top || size.s_50;

	return (
		<View style={{ height: statusBarHeight }}>
			<LinearGradient
				start={{ x: 1, y: 1 }}
				end={{ x: 0, y: 0 }}
				colors={isPrimary ? PRIMARY_GRADIANT : SECONDARY_GRADIANT}
				style={[StyleSheet.absoluteFill]}
				locations={[0, 0.3]}
			/>
		</View>
	);
};

export default React.memo(StatusBarHeight);
