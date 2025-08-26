import { size, useTheme } from '@mezon/mobile-ui';
import React, { memo, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Bounce } from 'react-native-animated-spinkit';
import { style } from './styles';

interface ConnectionStateProps {
	isConnected: boolean;
}

export const ConnectionState = memo(({ isConnected }: ConnectionStateProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [isShow, setIsShow] = useState<boolean>(true);
	useEffect(() => {
		let timer: NodeJS.Timeout | null = null;
		if (isConnected) {
			timer = setTimeout(() => {
				setIsShow(false);
			}, 1500);
		}
		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [isConnected]);

	if (!isShow) return;

	return (
		<View style={styles.containerStatusState}>
			<Text style={[styles.textStatus, isConnected && { color: '#19b11c' }]}>{isConnected ? 'Connected' : 'Connecting...'}</Text>
			{!isConnected && <Bounce size={size.s_20} color={isConnected ? '#19b11c' : '#fabf2b'} />}
		</View>
	);
});
