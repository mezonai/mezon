import { size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectAllActivities, selectAllFriends, selectAllUserDM } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../../components/ImageNative';
import { style } from './styles';

function MessageActivity() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const friends = useSelector(selectAllFriends);
	const activities = useSelector(selectAllActivities);

	const mergeListFriendAndListUserDM = useMemo(() => {
		try {
			const dmUsers = selectAllUserDM(store.getState());
			const uniqueMap = new Map();

			friends?.forEach((friend) => {
				if (friend.id) {
					uniqueMap.set(friend.id, {
						...friend,
						type: 'friend'
					});
				}
			});
			dmUsers?.forEach((dmUser) => {
				if (dmUser.id) {
					uniqueMap.set(dmUser.id, {
						...dmUser,
						type: 'dm_user'
					});
				}
			});

			return Array.from(uniqueMap.values());
		} catch (e) {
			console.error('Error merging friends and DM users:', e);
			return [];
		}
	}, [friends?.length]);

	const activityMap = useMemo(() => {
		if (!activities?.length) return new Map();

		return new Map(activities.map((activity) => [activity.user_id, activity]));
	}, [activities]);

	const data = useMemo(() => {
		try {
			if (!mergeListFriendAndListUserDM?.length || !activityMap.size) {
				return [];
			}

			return mergeListFriendAndListUserDM.reduce((acc, user) => {
				const info = activityMap.get(user.id);
				if (info) {
					const activityName = info?.activity_name + ' - ' + info?.activity_description;

					acc.push({
						activityName,
						avatar: user.user?.avatar_url,
						name: user?.user?.display_name || user?.user?.username
					});
				}
				return acc;
			}, []);
		} catch (e) {
			console.error('log  => e', e);
			return [];
		}
	}, [mergeListFriendAndListUserDM?.length, activityMap]);

	const renderItem = ({ item }) => {
		return (
			<View style={styles.wrapperItemActivity}>
				<View style={styles.avatarActivity}>
					<ImageNative
						url={createImgproxyUrl(item?.avatar ?? '', { width: 100, height: 100, resizeType: 'fit' })}
						style={styles.avatarActivity}
						resizeMode={'cover'}
					/>
				</View>
				<View style={{ flexShrink: 1 }}>
					<Text style={styles.userNameActivity} numberOfLines={1}>
						{item?.name}
					</Text>
					<Text style={styles.desActivity} numberOfLines={1}>
						{item?.activityName}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<FlatList
			data={data || []}
			renderItem={renderItem}
			horizontal
			keyExtractor={(item, index) => `activity_${item?.name}_${index}`}
			showsVerticalScrollIndicator={false}
			removeClippedSubviews={true}
			maxToRenderPerBatch={2}
			windowSize={2}
			initialNumToRender={2}
			contentContainerStyle={{ paddingLeft: size.s_18 }}
			pagingEnabled={false}
			decelerationRate="fast"
			showsHorizontalScrollIndicator={false}
			snapToInterval={size.s_220}
		/>
	);
}

export default React.memo(MessageActivity);
