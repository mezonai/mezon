import { useNotification } from '@mezon/core';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	Icons,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	channelsActions,
	clansActions,
	directActions,
	fetchListNotification,
	getStoreAsync,
	messagesActions,
	notificationActions,
	RootState,
	selectCurrentClanId,
	selectLastNotificationId,
	topicsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import { INotification, NotificationCode, NotificationEntity } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import EmptyNotification from './EmptyNotification';
import NotificationItem from './NotificationItem';
import NotificationItemOption from './NotificationItemOption';
import NotificationOption from './NotificationOption';
import { style } from './Notifications.styles';
import SkeletonNotification from './SkeletonNotification';
import { EActionDataNotify, ENotifyBsToShow } from './types';

const Notifications = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { notification, deleteNotify } = useNotification();
	const [notify, setNotify] = useState<INotification>();
	const currentClanId = useSelector(selectCurrentClanId);
	const loadingStatus = useSelector((state: RootState) => state?.notification?.loadingStatus);
	const isLoading = useMemo(() => ['loading']?.includes(loadingStatus), [loadingStatus]);
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();
	const { t } = useTranslation(['notification']);
	const navigation = useNavigation();
	const timeoutRef = useRef(null);
	const [isLoadMore, setIsLoadMore] = useState(true);
	const [firstLoading, setFirstLoading] = useState(true);
	const [selectedTabs, setSelectedTabs] = useState({
		[EActionDataNotify.Individual]: true,
		[EActionDataNotify.Mention]: true,
		[EActionDataNotify.Messages]: true,
		[EActionDataNotify.Topics]: true
	});
	const selectedTabsRef = useRef(selectedTabs);
	const [notificationsFilter, setNotificationsFilter] = useState<NotificationEntity[]>([]);
	const lastNotificationId = useSelector(selectLastNotificationId);

	useEffect(() => {
		if (currentClanId && currentClanId !== '0') {
			initLoader();
			setIsLoadMore(true);
		}
	}, [currentClanId]);

	const handleFilterNotify = useCallback(
		(selectedTabs) => {
			const sortNotifications = notification?.sort((a, b) => {
				const dateA = new Date(a.create_time || '').getTime();
				const dateB = new Date(b.create_time || '').getTime();
				return dateB - dateA;
			});

			const allTabs = [EActionDataNotify.Individual, EActionDataNotify.Mention, EActionDataNotify.Messages, EActionDataNotify.Topics];
			const isAllSelected = allTabs.every((tab) => selectedTabs.includes(tab));
			if (isAllSelected) {
				setNotificationsFilter(sortNotifications);
				return;
			}

			const isNotificationIncluded = (notification) => {
				return selectedTabs.some((tab) => {
					switch (tab) {
						case EActionDataNotify.Individual:
							return (
								notification?.code !== NotificationCode.USER_REPLIED &&
								notification?.code !== NotificationCode.USER_MENTIONED &&
								notification?.code !== NotificationCode.NOTIFICATION_CLAN &&
								notification?.code
							);
						case EActionDataNotify.Mention:
							return notification?.code === NotificationCode.USER_REPLIED || notification?.code === NotificationCode.USER_MENTIONED;
						case EActionDataNotify.Messages:
							return notification?.code === NotificationCode.NOTIFICATION_CLAN;
						case EActionDataNotify.Topics:
							return notification?.content?.topic_id && notification.content.topic_id !== '0';
						default:
							return false;
					}
				});
			};

			const filteredNotifications = sortNotifications.filter(isNotificationIncluded);
			setNotificationsFilter(filteredNotifications);
		},
		[notification]
	);

	const initLoader = async () => {
		const store = await getStoreAsync();
		store.dispatch(notificationActions.fetchListNotification({ clanId: currentClanId }));
		store.dispatch(topicsActions.fetchTopics({ clanId: currentClanId }));
	};

	const handleTabChange = (value, isSelected) => {
		setSelectedTabs((prevState) => {
			const newState = {
				...prevState,
				[value]: isSelected
			};
			selectedTabsRef.current = newState;
			return newState;
		});
	};

	useEffect(() => {
		const selectedTabKeys = Object.entries(selectedTabs)
			.filter(([_, isSelected]) => isSelected)
			.map(([key]) => key);

		handleFilterNotify(selectedTabKeys);
	}, [selectedTabs, handleFilterNotify]);

	useEffect(() => {
		return () => {
			timeoutRef?.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	const openBottomSheet = useCallback((type: ENotifyBsToShow, notify?: INotification) => {
		switch (type) {
			case ENotifyBsToShow.notification:
				triggerBottomSheetOption();
				break;
			case ENotifyBsToShow.removeNotification:
				triggerRemoveBottomSheet();
				setNotify(notify);
				break;
			default:
				triggerBottomSheetOption();
				break;
		}
	}, []);

	const handleDeleteNotify = (notify?: INotification) => {
		notify && deleteNotify(notify.id, currentClanId || '0');
		closeBottomSheet();
	};

	const handleNotification = (notify: INotification, currentClanId: string, store: any, navigation: any) => {
		store.dispatch(appActions.setLoadingMainMobile(true));
		return new Promise<void>((resolve) => {
			requestAnimationFrame(async () => {
				const promises = [];
				if (notify?.content?.mode === ChannelStreamMode.STREAM_MODE_DM || notify?.content?.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					promises.push(store.dispatch(directActions.fetchDirectMessage({})));
					promises.push(store.dispatch(directActions.setDmGroupCurrentId(notify?.content?.channel_id)));
				} else {
					if (Number(notify?.content?.topic_id) !== 0) {
						promises.push(store.dispatch(topicsActions.setCurrentTopicInitMessage(null)));
						promises.push(store.dispatch(topicsActions.setCurrentTopicId(notify?.content?.topic_id || '')));
						promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));
					}
					if (notify?.content?.clan_id !== currentClanId) {
						promises.push(store.dispatch(clansActions.changeCurrentClan({ clanId: notify?.content?.clan_id })));
					}

					promises.push(
						store.dispatch(
							channelsActions.joinChannel({
								clanId: notify?.content?.clan_id ?? '',
								channelId: notify?.content?.channel_id,
								noFetchMembers: false,
								noCache: true
							})
						)
					);
				}

				await Promise.all(promises);

				if (notify?.content?.mode === ChannelStreamMode.STREAM_MODE_DM || notify?.content?.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: notify?.content?.channel_id });
				} else if (Number(notify?.content?.topic_id) !== 0) {
					navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
						screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
					});
				} else {
					const dataSave = getUpdateOrAddClanChannelCache(notify?.content?.clan_id, notify?.content?.channel_id);
					save(STORAGE_CLAN_ID, notify?.content?.clan_id);
					save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
					navigation.navigate(APP_SCREEN.HOME_DEFAULT);
				}
				timeoutRef.current = setTimeout(() => {
					store.dispatch(
						messagesActions.jumpToMessage({
							clanId: notify?.content?.clan_id,
							channelId: notify?.content?.channel_id,
							messageId: notify?.content?.message_id
						})
					);
					store.dispatch(appActions.setLoadingMainMobile(false));
				}, 200);
				store.dispatch(appActions.setLoadingMainMobile(false));
				resolve();
			});
		});
	};

	const handleOnPressNotify = useCallback(
		async (notify: INotification) => {
			if (!notify?.content?.channel_id) {
				return;
			}
			const store = await getStoreAsync();
			await handleNotification(notify, currentClanId, store, navigation);
		},
		[currentClanId, navigation]
	);

	const closeBottomSheet = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleGoback = () => {
		navigation.goBack();
	};

	const fetchMoreData = useCallback(async () => {
		setFirstLoading(false);
		if (isLoadMore) {
			await dispatch(
				fetchListNotification({
					clanId: currentClanId || '',
					notificationId: lastNotificationId
				})
			);
			setIsLoadMore(false);
		}
	}, [isLoadMore, dispatch, currentClanId, lastNotificationId]);

	const ViewLoadMore = () => {
		return (
			<View style={styles.loadMoreChannelMessage}>
				<ActivityIndicator size="large" color={Colors.tertiary} />
			</View>
		);
	};

	const triggerBottomSheetOption = () => {
		const data = {
			heightFitContent: true,
			title: t('headerTitle'),
			titleSize: 'md',
			children: <NotificationOption onChangeTab={handleTabChange} selectedTabs={selectedTabsRef.current} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const triggerRemoveBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <NotificationItemOption onDelete={() => handleDeleteNotify(notify)} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={styles.notifications}>
			<View style={styles.notificationsHeader}>
				{isTabletLandscape && (
					<Pressable onPress={handleGoback}>
						<View style={styles.notificationHeaderIcon}>
							<Icons.ChevronSmallLeftIcon height={20} width={20} color={themeValue.textStrong} />
						</View>
					</Pressable>
				)}
				<Text style={styles.notificationHeaderTitle}>{t('headerTitle')}</Text>
				<Pressable onPress={() => openBottomSheet(ENotifyBsToShow.notification)}>
					<View style={styles.notificationHeaderIcon}>
						<Icons.MoreHorizontalIcon height={20} width={20} color={themeValue.textStrong} />
					</View>
				</Pressable>
			</View>
			{isLoading && firstLoading ? (
				<SkeletonNotification numberSkeleton={8} />
			) : notificationsFilter?.length ? (
				<FlashList
					showsVerticalScrollIndicator={false}
					data={notificationsFilter}
					renderItem={({ item }) => {
						return <NotificationItem notify={item} onLongPressNotify={openBottomSheet} onPressNotify={handleOnPressNotify} />;
					}}
					contentContainerStyle={{
						paddingBottom: size.s_100 * 2
					}}
					estimatedItemSize={200}
					keyExtractor={(item) => `${item.id}_item_noti`}
					onEndReached={fetchMoreData}
					onEndReachedThreshold={0.5}
					ListFooterComponent={isLoadMore && <ViewLoadMore />}
				/>
			) : (
				<EmptyNotification />
			)}
		</View>
	);
};

export default Notifications;
