import { useTheme } from '@mezon/mobile-ui';
import { UsersStreamEntity } from '@mezon/store-mobile';
import React from 'react';
import { Text, View } from 'react-native';
import UserItem from './UserItem';
import { style } from './UserStreamingRoom.styles';
const MAX_VISIBLE_USERS = 5;
function UserStreamingRoom({ streamChannelMember }: { streamChannelMember: UsersStreamEntity[] }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const remainingCount = streamChannelMember?.length - MAX_VISIBLE_USERS;
	const visibleUsers = streamChannelMember?.slice(0, MAX_VISIBLE_USERS);
	return (
		<View style={styles.gridContainer}>
			{visibleUsers.map((user, index) => (
				<View style={{ ...styles.userItem, marginRight: streamChannelMember?.length > MAX_VISIBLE_USERS ? -15 : 10 }}>
					<UserItem user={user} key={index} />
				</View>
			))}

			{remainingCount > 0 && (
				<View style={styles.remainingCount}>
					<Text style={styles.textBold}>+{remainingCount}</Text>
				</View>
			)}
		</View>
	);
}

export default React.memo(UserStreamingRoom);
