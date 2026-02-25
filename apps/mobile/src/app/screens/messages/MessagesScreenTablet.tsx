import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { RootState } from '@mezon/store-mobile';
import {
	directActions,
	getStore,
	getStoreAsync,
	messagesActions,
	selectDirectById,
	selectDirectHasMore,
	selectDirectPaginationLoading,
	selectDirectsOpenlistOrder,
	selectDmGroupCurrentId,
	useAppDispatch
} from '@mezon/store-mobile';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, AppState, DeviceEventEmitter, FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { FriendsTablet } from '../friend/FriendsTablet';
import ProfileBar from '../home/homedrawer/ProfileBar';
import ServerList from '../home/homedrawer/ServerList';
import UserEmptyMessage from '../home/homedrawer/UserEmptyClan/UserEmptyMessage';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import { DirectMessageDetailTablet } from './DirectMessageDetailTablet';
import { DmListItem } from './DmListItem';
import MessageHeader from './MessageHeader';
import { style } from './styles';

const keyExtractor = (dm: string) => `${dm}_DM_MSG_ITEM`;
const footerStyle = { paddingVertical: size.s_14 };
const selectClansLoadingStatus = (state: RootState) => state?.clans?.loadingStatus;

const MessagesScreenTablet = memo(({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = useMemo(() => style(themeValue, isTabletLandscape), [themeValue, isTabletLandscape]);
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const clansLoadingStatus = useSelector(selectClansLoadingStatus);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const hasMore = useSelector(selectDirectHasMore);
	const paginationLoading = useSelector(selectDirectPaginationLoading);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const handleAppStateChange = async (state: string) => {
			if (state === 'active') {
				try {
					const store = await getStoreAsync();
					await store.dispatch(directActions.fetchDirectMessage({ noCache: true }));
				} catch (error) {
					console.error('error messageLoaderBackground', error);
				}
			}
		};
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const navigateToAddFriendScreen = useCallback(() => {
		navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND });
	}, [navigation]);

	const navigateToNewMessageScreen = useCallback(() => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, { screen: APP_SCREEN.MESSAGES.NEW_MESSAGE });
	}, [navigation]);

	useEffect(() => {
		const dmItemRouter = DeviceEventEmitter.addListener('CHANGE_CHANNEL_DM_DETAIL_TABLET', ({ dmId = '' }) => {
			requestAnimationFrame(async () => {
				dispatch(directActions.setDmGroupCurrentId(dmId));
				dispatch(messagesActions.setIdMessageToJump(null));
			});
		});
		return () => {
			dmItemRouter.remove();
		};
	}, [dispatch, isTabletLandscape, navigation]);

	const handleLongPress = useCallback((dmId: string) => {
		const store = getStore();
		const directMessage = selectDirectById(store.getState(), dmId);
		const data = {
			heightFitContent: true,
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const handleLoadMore = useCallback(() => {
		if (!hasMore || paginationLoading) return;
		dispatch(directActions.fetchMoreDirectMessages({}));
	}, [dispatch, hasMore, paginationLoading]);

	const renderItem = useCallback(
		({ item }: { item: string }) => {
			return (
				<TouchableOpacity
					onPress={() => {
						DeviceEventEmitter.emit('CHANGE_CHANNEL_DM_DETAIL_TABLET', { dmId: item });
					}}
					onLongPress={() => handleLongPress(item)}
				>
					<DmListItem id={item} />
				</TouchableOpacity>
			);
		},
		[handleLongPress]
	);

	const ListFooterComponent = useMemo(() => {
		if (!paginationLoading) return null;
		return (
			<View style={footerStyle}>
				<ActivityIndicator size="small" color={themeValue.textStrong} />
			</View>
		);
	}, [paginationLoading, themeValue.textStrong]);

	return (
		<View style={styles.containerMessages}>
			<View style={styles.leftContainer}>
				<View style={styles.containerMessages}>
					<ServerList hideActive />

					<View style={styles.container}>
						<MessageHeader />
						{clansLoadingStatus === 'loaded' && !dmGroupChatList?.length ? (
							<UserEmptyMessage onPress={navigateToAddFriendScreen} />
						) : (
							<FlatList
								data={dmGroupChatList}
								showsVerticalScrollIndicator={false}
								keyExtractor={keyExtractor}
								initialNumToRender={1}
								maxToRenderPerBatch={1}
								windowSize={2}
								renderItem={renderItem}
								onEndReachedThreshold={0.3}
								onEndReached={handleLoadMore}
								ListFooterComponent={ListFooterComponent}
							/>
						)}

						<Pressable style={styles.addMessage} onPress={navigateToNewMessageScreen}>
							<MezonIconCDN icon={IconCDN.messagePlusIcon} width={size.s_22} height={size.s_22} />
						</Pressable>
					</View>
				</View>
				{isTabletLandscape && <ProfileBar />}
			</View>
			<View style={styles.separator} />
			<View style={styles.containerDetailMessage}>
				{currentDmGroupId ? <DirectMessageDetailTablet directMessageId={currentDmGroupId} /> : <FriendsTablet navigation={navigation} />}
			</View>
		</View>
	);
});

export default MessagesScreenTablet;
