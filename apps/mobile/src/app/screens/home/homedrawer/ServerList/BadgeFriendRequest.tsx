import { useFriends } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Text, View } from 'react-native';
import { style } from './styles';

const BadgeFriendRequest = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { quantityPendingRequest } = useFriends();

	if (!quantityPendingRequest) return null;
	return (
		<View style={styles.badge}>
			<Text style={styles.badgeText}>{quantityPendingRequest > 99 ? `99+` : quantityPendingRequest}</Text>
		</View>
	);
});

export default BadgeFriendRequest;
