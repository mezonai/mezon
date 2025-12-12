import type { GroupedMessages } from '@mezon/mobile-components';
import { ETypeSearch, getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelUsersEntity, ISearchMessage, MessagesEntity } from '@mezon/store-mobile';
import {
	channelsActions,
	getStoreAsync,
	messagesActions,
	searchMessagesActions,
	selectAllMessageSearch,
	selectMessageSearchByChannelId,
	selectSearchMessagesLoadingStatus,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { SIZE_PAGE_SEARCH, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, Text, View } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageItem from '../../screens/home/homedrawer/MessageItem';
import { EmptySearchPage } from '../EmptySearchPage';
import { SearchMessageChannelContext } from '../ThreadDetail/SearchMessageChannel';
import style from './MessagesSearchTab.styles';

interface IMessagesSearchTabProps {
	typeSearch: ETypeSearch;
	currentChannel: ChannelUsersEntity;
	channelIdFilter?: string;
}

const MessagesSearchTab = memo(({ typeSearch, currentChannel, channelIdFilter }: IMessagesSearchTabProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const { filtersSearch } = useContext(SearchMessageChannelContext);
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasLoadMore, setHasLoadMore] = useState(true);
	const [pageSearch, setPageSearch] = useState(1);

	const channelId = useMemo(() => {
		if (!currentChannel) {
			if (channelIdFilter) return channelIdFilter;
			return '0';
		}
		return currentChannel?.channel_id || currentChannel?.id;
	}, [channelIdFilter, currentChannel]);

	const searchMessagesChannel = useAppSelector((state) => selectMessageSearchByChannelId(state, channelId));
	const searchMessagesGlobal = useAppSelector((state) => selectAllMessageSearch(state, channelId));
	const loadingStatus = useAppSelector(selectSearchMessagesLoadingStatus);

	const isDM = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel?.type]);

	const searchMessagesData = useMemo(() => {
		let groupedMessages: GroupedMessages = [];
		if (typeSearch === ETypeSearch.SearchChannel) {
			if (searchMessagesChannel?.length > 0) {
				groupedMessages?.push({
					label: searchMessagesChannel?.[0]?.channel_label,
					messages: searchMessagesChannel
				});
			}
		} else {
			groupedMessages = searchMessagesGlobal?.reduce((acc, message) => {
				const existingGroup = acc?.find((group) => group?.label === message?.channel_label && group?.channel_id === message?.channel_id);
				if (existingGroup) {
					existingGroup.messages.push(message);
				} else {
					acc.push({
						label: message?.channel_label ?? '',
						channel_id: message?.channel_id ?? '',
						messages: [message]
					});
				}
				return acc;
			}, []);
		}
		return groupedMessages;
	}, [searchMessagesChannel, searchMessagesGlobal, typeSearch]);

	useEffect(() => {
		setHasLoadMore(true);
		setPageSearch(1);
	}, [filtersSearch]);

	const loadMoreMessages = async () => {
		if (!filtersSearch?.length || !searchMessagesData?.length || !hasLoadMore || isLoadingMore) return;

		setIsLoadingMore(true);
		const nextPage = pageSearch + 1;
		setPageSearch(nextPage);

		try {
			const searchMessageResponse = await dispatch(
				searchMessagesActions.fetchListSearchMessage({
					filters: filtersSearch,
					from: nextPage,
					size: SIZE_PAGE_SEARCH,
					isMobile: true
				})
			);

			const searchMessage = (searchMessageResponse?.payload as { searchMessage: ISearchMessage[]; isMobile: boolean })?.searchMessage;
			if (!searchMessage?.length) setHasLoadMore(false);
		} catch (error) {
			console.error('Fetch list search message error', error);
		} finally {
			setIsLoadingMore(false);
		}
	};

	const handleJumpMessage = async (message: MessagesEntity) => {
		if (channelId !== message?.channel_id) {
			handleJoinChannel(message?.clan_id, message?.channel_id);
		}
		if (message?.message_id && message?.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: message?.clan_id,
					messageId: message.message_id,
					channelId: message.channel_id
				})
			);
		}
		if (isDM) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: message?.channel_id });
		} else {
			if (isTabletLandscape) {
				await sleep(200);
				navigation.goBack();
			} else {
				navigation.navigate(APP_SCREEN.HOME_DEFAULT);
			}
		}
	};

	const handleJoinChannel = async (clanId: string, channelId: string) => {
		const store = await getStoreAsync();
		requestAnimationFrame(async () => {
			await store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId, noFetchMembers: false, noCache: true }));
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const renderGroupItem = ({ item }) => (
		<View>
			{channelId === '0' && !!item?.label && <Text style={styles.groupMessageLabel}>{`# ${item.label}`}</Text>}
			{item?.messages?.length > 0 &&
				item.messages.map((message: MessagesEntity, index: number) => {
					return (
						<Pressable
							onPress={() => handleJumpMessage(message)}
							key={`message_${message?.channel_id}_${message?.id}`}
							style={styles.messageItem}
						>
							<MessageItem
								message={message}
								messageId={message?.id}
								mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
								preventAction
								isSearchTab={true}
							/>
						</Pressable>
					);
				})}
		</View>
	);

	const renderListFooterComponent = useMemo(() => {
		if (searchMessagesData?.length > 0 && isLoadingMore) {
			return (
				<View style={styles.loadMoreChannelMessage}>
					<ActivityIndicator size={'large'} color={themeValue.text} />
				</View>
			);
		}
		return null;
	}, [searchMessagesData?.length, isLoadingMore]);

	const renderListEmptyComponent = useMemo(() => {
		if (loadingStatus === 'loading') {
			return (
				<View style={styles.loadMoreChannelMessage}>
					<ActivityIndicator size={'large'} color={themeValue.text} />
				</View>
			);
		}
		if (filtersSearch?.length > 0 && searchMessagesData?.length === 0) {
			return <EmptySearchPage />;
		}
		return null;
	}, [loadingStatus, filtersSearch?.length, searchMessagesData?.length]);

	return (
		<FlatList
			style={styles.container}
			keyExtractor={(item, index) => `group_${item?.channel_id}_${index}`}
			showsVerticalScrollIndicator={false}
			data={searchMessagesData}
			keyboardShouldPersistTaps={'handled'}
			onScrollBeginDrag={Keyboard.dismiss}
			renderItem={renderGroupItem}
			onEndReached={loadMoreMessages}
			contentContainerStyle={{ paddingBottom: size.s_20 }}
			removeClippedSubviews={true}
			initialNumToRender={5}
			maxToRenderPerBatch={10}
			windowSize={10}
			onEndReachedThreshold={0.7}
			ListFooterComponent={renderListFooterComponent}
			ListEmptyComponent={renderListEmptyComponent}
		/>
	);
});

export default MessagesSearchTab;
