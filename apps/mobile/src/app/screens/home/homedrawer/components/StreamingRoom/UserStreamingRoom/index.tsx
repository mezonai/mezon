import { useTheme } from '@mezon/mobile-ui';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import UserItem from './UserItem';
import { style } from './UserStreamingRoom.styles';
const MAX_VISIBLE_USERS = 5;

interface IUserStreamingRoomProps {
	streamChannelMember: string[];
}

function UserStreamingRoom({ streamChannelMember }: IUserStreamingRoomProps) {
	const { themeValue } = useTheme();
	const isMoreThanMax = streamChannelMember?.length > MAX_VISIBLE_USERS;
	const styles = useMemo(() => style(themeValue, isMoreThanMax), [themeValue, isMoreThanMax]);
	const remainingCount = streamChannelMember?.length - MAX_VISIBLE_USERS;
	const visibleUsers = streamChannelMember?.slice(0, MAX_VISIBLE_USERS);

	const renderItem = useCallback(({ item }: { item: string }) => (
		<View style={[styles.userItem, styles.userItemDynamic]}>
			<UserItem user={item} />
		</View>
	), []);

	return (
		<View style={styles.gridContainer}>
			{visibleUsers?.length > 0 &&
				<FlatList
					data={visibleUsers}
					keyExtractor={(userId) => userId}
					renderItem={renderItem}
					horizontal
					scrollEnabled={false}
					initialNumToRender={10}
					windowSize={3}
					maxToRenderPerBatch={10}
					removeClippedSubviews
					contentContainerStyle={styles.flatListContent}
				/>
			}

			{remainingCount > 0 && (
				<View style={styles.remainingCount}>
					<Text style={styles.textBold}>+{remainingCount}</Text>
				</View>
			)}
		</View>
	);
}

export default memo(UserStreamingRoom);
