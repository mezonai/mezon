import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StatusBarHeight = () => {
	const insets = useSafeAreaInsets();
	const { themeValue } = useTheme();

	const statusBarHeight = Platform.OS === 'android' ? 0 : insets.top || size.s_50;

	return (
		<View style={{ height: statusBarHeight }}>
			<LinearGradient
				start={{ x: 0, y: 1 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primaryGradiant || themeValue.primary, themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
		</View>
	);
};

export default React.memo(StatusBarHeight);
