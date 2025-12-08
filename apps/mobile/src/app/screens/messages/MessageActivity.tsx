import { useDirect } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectAllAccount, selectAllActivities, selectAllFriends, selectAllUserDM, selectDirectsOpenlist } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, DeviceEventEmitter, Easing, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../componentUI/MezonAvatar';
import ImageNative from '../../components/ImageNative';
import { style } from './styles';

function MessageActivity() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const store = getStore();
	const friends = useSelector(selectAllFriends);
	const activities = useSelector(selectAllActivities);
	const userId = useSelector(selectAllAccount)?.user?.id;
	const { createDirectMessageWithUser } = useDirect();

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
	}, [friends?.length, store]);

	const activityMap = useMemo(() => {
		if (!activities?.length) return new Map();

		return new Map(activities.map((activity) => [activity.user_id, activity]));
	}, [activities]);

	const data = useMemo(() => {
		try {
			if (!mergeListFriendAndListUserDM?.length || !activityMap.size) {
				return [];
			}

			return mergeListFriendAndListUserDM
				.reduce((acc, user) => {
					const info = activityMap.get(user.id);
					if (info && user.id !== userId) {
						const activityName = info?.activity_description
							? `${info?.activity_name} - ${info.activity_description}`
							: info?.activity_name;

						acc.push({
							activityName,
							id: user?.id,
							avatar: user?.avatar_url,
							name: user?.display_name || user?.username,
							display_name: user?.display_name,
							username: user?.username
						});
					}
					return acc;
				}, [])
				?.filter((i) => !!i?.name);
		} catch (e) {
			console.error('log  => e', e);
			return [];
		}
	}, [mergeListFriendAndListUserDM, activityMap, userId]);

	const animatedHeight = useRef(new Animated.Value(data.length > 0 ? size.s_60 : 0)).current;

	useEffect(() => {
		Animated.timing(animatedHeight, {
			toValue: data.length > 0 ? size.s_60 : 0,
			duration: 300,
			easing: Easing.linear,
			useNativeDriver: false
		}).start();
	}, [animatedHeight, data?.length]);

	const onPressItem = async (item) => {
		const listDM = selectDirectsOpenlist(store.getState() as any);
		const directMessage = listDM
			?.filter?.((dm) => dm.type === ChannelType.CHANNEL_TYPE_DM)
			?.find?.((dm) => {
				const userIds = dm?.user_ids;
				if (!Array.isArray(userIds) || userIds.length !== 1) {
					return false;
				}
				return userIds[0] === item?.id;
			});
		if (directMessage?.id) {
			DeviceEventEmitter.emit('CHANGE_CHANNEL_DM_DETAIL', { dmId: directMessage?.id });
			return;
		}
		const response = await createDirectMessageWithUser(item?.id, item?.display_name || item?.name, item?.username || item?.name, item?.avatar);
		if (response?.channel_id) {
			DeviceEventEmitter.emit('CHANGE_CHANNEL_DM_DETAIL', { dmId: response?.channel_id });
		}
	};

	const renderItem = ({ item }) => {
		return (
			<TouchableOpacity onPress={() => onPressItem(item)} style={styles.wrapperItemActivity}>
				{item?.avatar ? (
					<View style={styles.avatarActivity}>
						<ImageNative
							url={createImgproxyUrl(item?.avatar ?? '', { width: 100, height: 100, resizeType: 'fit' })}
							style={styles.avatarActivity}
							resizeMode={'cover'}
						/>
					</View>
				) : (
					<MezonAvatar avatarUrl={''} username={item?.name} width={size.s_36} height={size.s_36} />
				)}
				<View style={styles.activityTextWrapper}>
					<Text style={styles.userNameActivity} numberOfLines={1}>
						{item?.name}
					</Text>
					<Text style={styles.desActivity} numberOfLines={1}>
						{item?.activityName}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<Animated.View
			style={{
				height: animatedHeight,
				overflow: 'hidden'
			}}
		>
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
		</Animated.View>
	);
}

export default React.memo(MessageActivity);
