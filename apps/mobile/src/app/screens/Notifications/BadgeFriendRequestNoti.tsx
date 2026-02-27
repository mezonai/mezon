import { Metrics, size, useTheme } from '@mezon/mobile-ui';
import { selectAllFriends } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Icons } from '../../componentUI/MobileIcons';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './Notifications.styles';

const FriendState = {
	PENDING: 2
};
const BadgeFriendRequestNoti = () => {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const friends = useSelector(selectAllFriends);
	const navigation = useNavigation<any>();
	const quantityPendingRequest = useMemo(() => {
		return friends?.filter((friend) => friend?.state === FriendState.PENDING)?.length || 0;
	}, [friends]);

	const navigateToAddFriendScreen = () => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	};

	if (quantityPendingRequest > 0) {
		return (
			<TouchableOpacity
				onPress={navigateToAddFriendScreen}
				activeOpacity={0.8}
				style={{ overflow: 'visible', height: '100%', padding: Metrics.size.m, paddingRight: Metrics.size.l }}
			>
				<View style={styles.friendRequestButton}>
					<Icons.AddFriendIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />
					<View style={styles.badgeItemTabType}>
						<Text style={[styles.textBadgeItemTabType, { fontSize: size.s_10 }]}>
							{quantityPendingRequest > 99 ? '99+' : quantityPendingRequest}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	}
	return null;
};

export default React.memo(BadgeFriendRequestNoti);
