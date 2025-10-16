import { ActionEmitEvent, getUpdateOrAddClanChannelCache, save, STORAGE_CLAN_ID, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	clansActions,
	directActions,
	fetchListNotification,
	getFirstMessageOfTopic,
	getStoreAsync,
	messagesActions,
	notificationActions,
	selectCurrentClanId,
	selectNotificationClan,
	selectNotificationForYou,
	selectNotificationMentions,
	selectTopicsSort,
	topicsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import type { INotification, NotificationEntity } from '@mezon/utils';
import { NotificationCategory, sleep, sortNotificationsByDate, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import BadgeFriendRequestNoti from './BadgeFriendRequestNoti';
import EmptyNotification from './EmptyNotification';
import NotificationItem from './NotificationItem';
import NotificationItemOption from './NotificationItemOption';
import NotificationOption from './NotificationOption';
import { style } from './Notifications.styles';
import SkeletonNotification from './SkeletonNotification';
import { ENotifyBsToShow } from './types';

export const InboxType = {
	INDIVIDUAL: 'individual',
	MESSAGES: 'messages',
	MENTIONS: 'mentions',
	TOPICS: 'topics'
} as const;

const getCategoryFromTab = (tabType: string): NotificationCategory | null => {
	switch (tabType) {
		case InboxType.INDIVIDUAL:
			return NotificationCategory.FOR_YOU;
		case InboxType.MESSAGES:
			return NotificationCategory.MESSAGES;
		case InboxType.MENTIONS:
			return NotificationCategory.MENTIONS;
		default:
			return null;
	}
};

const Notifications = ({ navigation, route }) => {
	const { themeValue } = useTheme();
	const { initialTab, version } = route?.params || {};
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const currentClanId = useSelector(selectCurrentClanId);
	const allNotificationForYou = useSelector(selectNotificationForYou);
	const allNotificationMentions = useSelector(selectNotificationMentions);
	const allNotificationClan = useSelector(selectNotificationClan);
	const getAllTopic = useSelector(selectTopicsSort);

	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();
	const { t } = useTranslation(['notification']);

	const [selectedTabs, setSelectedTabs] = useState<string>(initialTab || InboxType.MENTIONS);
	const [isLoadMore, setIsLoadMore] = useState(true);
	const [firstLoading, setFirstLoading] = useState(true);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const sortedNotifications = useMemo(
		() => ({
			forYou: sortNotificationsByDate([...(allNotificationForYou?.data || [])]),
			mentions: sortNotificationsByDate([...(allNotificationMentions?.data || [])]),
			clan: sortNotificationsByDate([...(allNotificationClan?.data || [])])
		}),
		[allNotificationForYou?.data, allNotificationMentions?.data, allNotificationClan?.data]
	);

	const notificationsFilter = useMemo(() => {
		switch (selectedTabs) {
			case InboxType.INDIVIDUAL:
				return sortedNotifications.forYou;
			case InboxType.MESSAGES:
				return sortedNotifications.clan;
			case InboxType.MENTIONS:
				return sortedNotifications.mentions;
			case InboxType.TOPICS:
				return getAllTopic;
			default:
				return [];
		}
	}, [selectedTabs, sortedNotifications, getAllTopic]);

	const initLoader = useCallback(async () => {
		if (!currentClanId) {
			setFirstLoading(false);
			return;
		}

		const store = await getStoreAsync();
		await Promise.all([
			store.dispatch(
				notificationActions.fetchListNotification({
					clanId: currentClanId,
					category: NotificationCategory.MENTIONS
				})
			),
			store.dispatch(topicsActions.fetchTopics({ clanId: currentClanId }))
		]);
		setFirstLoading(false);
	}, [currentClanId]);

	const fetchNotifications = useCallback(
		async (category: NotificationCategory | null) => {
			if (!currentClanId || !category) return;

			await dispatch(
				notificationActions.fetchListNotification({
					clanId: currentClanId,
					category
				})
			);
		},
		[currentClanId, dispatch]
	);

	// Handle notification press
	const handleNotification = useCallback(
		async (notify: INotification, currentClanId: string, store: any, navigation: any): Promise<void> => {
			return new Promise<void>((resolve) => {
				requestAnimationFrame(async () => {
					const isTopic =
						Number(notify?.content?.topic_id) !== 0 ||
						notify?.content?.code === TypeMessage.Topic ||
						notify?.message?.code === TypeMessage.Topic;

					const promises = [];

					if (notify?.content?.mode === ChannelStreamMode.STREAM_MODE_DM || notify?.content?.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
						promises.push(store.dispatch(directActions.fetchDirectMessage({})));
						promises.push(store.dispatch(directActions.setDmGroupCurrentId(notify?.content?.channel_id)));
					} else {
						if (isTopic) {
							promises.push(
								store.dispatch(
									channelsActions.addThreadToChannels({
										clanId: notify?.content?.clan_id ?? '',
										channelId: notify?.content?.channel_id || ''
									})
								),
								store.dispatch(topicsActions.setCurrentTopicInitMessage(null)),
								store.dispatch(getFirstMessageOfTopic(notify?.content?.topic_id || notify?.id || '')),
								store.dispatch(topicsActions.setCurrentTopicId(notify?.content?.topic_id || notify?.id || '')),
								store.dispatch(topicsActions.setIsShowCreateTopic(true))
							);
						}

						if (notify?.content?.clan_id !== currentClanId) {
							promises.push(
								store.dispatch(
									clansActions.changeCurrentClan({
										clanId: notify?.content?.clan_id
									})
								)
							);
						}

						promises.push(
							store.dispatch(
								channelsActions.joinChannel({
									clanId: notify?.content?.clan_id ?? '',
									channelId: notify?.content?.channel_id,
									noFetchMembers: false,
									noCache: true,
									noFetchMessage: true
								})
							)
						);
					}
					await Promise.all(promises);

					if (notify?.content?.mode === ChannelStreamMode.STREAM_MODE_DM || notify?.content?.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
						if (isTabletLandscape) {
							await dispatch(directActions.setDmGroupCurrentId(notify?.content?.channel_id));
							navigation.navigate(APP_SCREEN.MESSAGES.HOME);
						} else {
							navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
								directMessageId: notify?.content?.channel_id
							});
						}
					} else if (isTopic) {
						navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
							screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
						});
					} else {
						const dataSave = getUpdateOrAddClanChannelCache(notify?.content?.clan_id, notify?.content?.channel_id);
						save(STORAGE_CLAN_ID, notify?.content?.clan_id);
						save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);

						if (isTabletLandscape) {
							await sleep(1000);
							navigation.goBack();
						} else {
							navigation.navigate(APP_SCREEN.HOME_DEFAULT);
						}
					}

					if (timeoutRef.current) {
						clearTimeout(timeoutRef.current);
					}

					timeoutRef.current = setTimeout(() => {
						store.dispatch(
							messagesActions.jumpToMessage({
								clanId: notify?.content?.clan_id,
								channelId: notify?.content?.channel_id,
								messageId: notify?.content?.message_id
							})
						);
					}, 200);

					resolve();
				});
			});
		},
		[dispatch, isTabletLandscape]
	);

	const handleOnPressNotify = useCallback(
		async (notify: INotification) => {
			if (!notify?.content?.channel_id) return;

			const store = await getStoreAsync();
			await handleNotification(notify, currentClanId, store, navigation);
		},
		[currentClanId, navigation, handleNotification]
	);

	const handleTabChange = useCallback((value: string) => {
		setSelectedTabs(value);
	}, []);

	const handleGoback = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const fetchMoreData = useCallback(async () => {
		if (!isLoadMore || !currentClanId) return;

		const category = getCategoryFromTab(selectedTabs);
		if (category) {
			await dispatch(
				fetchListNotification({
					clanId: currentClanId,
					category,
					notificationId: ''
				})
			);
		}
		setIsLoadMore(false);
	}, [isLoadMore, currentClanId, selectedTabs, dispatch]);

	const triggerBottomSheetOption = useCallback(() => {
		const data = {
			heightFitContent: true,
			title: t('headerTitle'),
			titleSize: 'md',
			children: <NotificationOption onChangeTab={handleTabChange} selectedTabs={selectedTabs} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, {
			isDismiss: false,
			data
		});
	}, [handleTabChange, selectedTabs, t]);

	const triggerRemoveBottomSheet = useCallback(
		(currentNotify: INotification) => {
			const data = {
				heightFitContent: true,
				children: <NotificationItemOption currentNotify={currentNotify} currentCategory={selectedTabs} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, {
				isDismiss: false,
				data
			});
		},
		[selectedTabs]
	);

	const openBottomSheet = useCallback(
		(type: ENotifyBsToShow, notify?: INotification) => {
			switch (type) {
				case ENotifyBsToShow.notification:
					triggerBottomSheetOption();
					break;
				case ENotifyBsToShow.removeNotification:
					if (notify) {
						triggerRemoveBottomSheet(notify);
					}
					break;
				default:
					triggerBottomSheetOption();
					break;
			}
		},
		[triggerBottomSheetOption, triggerRemoveBottomSheet]
	);

	const renderItem = useCallback(
		({ item }: { item: NotificationEntity }) => (
			<NotificationItem notify={item} onLongPressNotify={openBottomSheet} onPressNotify={handleOnPressNotify} />
		),
		[openBottomSheet, handleOnPressNotify]
	);

	const keyExtractor = useCallback((item: NotificationEntity, index: number) => `${item.id}_${index}_item_noti`, []);

	const ViewLoadMore = useCallback(
		() => (
			<View style={styles.loadMoreChannelMessage}>
				<ActivityIndicator size="large" color={'#ccc'} />
			</View>
		),
		[styles.loadMoreChannelMessage]
	);

	const ListFooterComponent = useMemo(() => (isLoadMore ? <ViewLoadMore /> : null), [isLoadMore, ViewLoadMore]);

	useEffect(() => {
		if (initialTab) {
			setSelectedTabs(initialTab);
		}
	}, [version]);

	useEffect(() => {
		if (currentClanId && currentClanId !== '0') {
			initLoader();
			setIsLoadMore(true);
		} else {
			setFirstLoading(false);
		}
	}, [currentClanId, initLoader]);

	useEffect(() => {
		const category = getCategoryFromTab(selectedTabs);
		if (category && currentClanId) {
			fetchNotifications(category);
		}
	}, [currentClanId, selectedTabs, fetchNotifications]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);
	const notificationMenu = useMemo(
		() => [
			{
				type: InboxType.MENTIONS,
				title: t('tabNotify.mention'),
				icon: IconCDN.atIcon,
				onPress: () => handleTabChange(InboxType.MENTIONS)
			},
			{
				type: InboxType.MESSAGES,
				title: t('tabNotify.messages'),
				icon: IconCDN.chatIcon,
				onPress: () => handleTabChange(InboxType.MESSAGES)
			},
			{
				type: InboxType.TOPICS,
				title: t('tabNotify.topics'),
				icon: IconCDN.discussionIcon,
				onPress: () => handleTabChange(InboxType.TOPICS)
			},
			{
				type: InboxType.INDIVIDUAL,
				title: t('tabNotify.forYou'),
				icon: IconCDN.bellIcon,
				onPress: () => handleTabChange(InboxType.INDIVIDUAL)
			}
		],
		[t]
	);
	return (
		<View style={styles.notifications}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View>
				{isTabletLandscape && (
					<Pressable onPress={handleGoback}>
						<View style={styles.notificationHeaderIcon}>
							<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
						</View>
					</Pressable>
				)}
				<View style={styles.wrapperTitleHeader}>
					<Text style={styles.notificationHeaderTitle}>{t('headerTitle')}</Text>
					<BadgeFriendRequestNoti />
				</View>
				<View style={styles.wrapperTabType}>
					{notificationMenu.map((item, index) => (
						<Pressable
							key={index}
							onPress={item.onPress}
							style={[
								styles.itemTabType,
								{
									backgroundColor: selectedTabs === item.type ? baseColor.blurple : themeValue.secondaryLight,
									borderColor: selectedTabs === item.type ? baseColor.blurple : themeValue.borderDim
								}
							]}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_4 }}>
								<MezonIconCDN
									icon={item.icon}
									color={selectedTabs === item.type ? 'white' : themeValue.text}
									width={size.s_16}
									height={size.s_16}
								/>
								<Text
									style={[
										styles.textTabType,
										{
											color: selectedTabs === item.type ? 'white' : themeValue.text
										}
									]}
								>
									{item.title}
								</Text>
							</View>
						</Pressable>
					))}
				</View>
			</View>

			{firstLoading ? (
				<SkeletonNotification numberSkeleton={8} />
			) : notificationsFilter?.length ? (
				<FlatList
					showsVerticalScrollIndicator={false}
					data={notificationsFilter}
					renderItem={renderItem}
					contentContainerStyle={{
						paddingBottom: size.s_100 * 2
					}}
					removeClippedSubviews={true}
					maxToRenderPerBatch={10}
					updateCellsBatchingPeriod={50}
					windowSize={5}
					initialNumToRender={10}
					keyExtractor={keyExtractor}
					onEndReached={fetchMoreData}
					onEndReachedThreshold={0.5}
					ListFooterComponent={ListFooterComponent}
				/>
			) : (
				<EmptyNotification />
			)}
		</View>
	);
};

export default React.memo(Notifications);
