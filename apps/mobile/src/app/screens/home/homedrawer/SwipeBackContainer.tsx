import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const SwipeBackContainer = ({ children }) => {
	const { themeValue } = useTheme();

	return (
		<SafeAreaView
			edges={['top']}
			style={{
				backgroundColor: themeValue.primary,
				flex: 1
			}}
		>
			{children}
		</SafeAreaView>
	);
};

export default SwipeBackContainer;
