import { ETypeSearch, getUpdateOrAddClanChannelCache, GroupedMessages, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	ChannelUsersEntity,
	messagesActions,
	MessagesEntity,
	selectAllMessageSearch,
	selectMessageSearchByChannelId,
	useAppSelector
} from '@mezon/store';
import { getStoreAsync, ISearchMessage, searchMessagesActions, selectCurrentPage, useAppDispatch } from '@mezon/store-mobile';
import { SIZE_PAGE_SEARCH } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useContext, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageItem from '../../screens/home/homedrawer/MessageItem';
import { EmptySearchPage } from '../EmptySearchPage';
import { SearchMessageChannelContext } from '../ThreadDetail/SearchMessageChannel';
import style from './MessagesSearchTab.styles';

const MessagesSearchTab = React.memo(({ typeSearch, currentChannel }: { typeSearch: ETypeSearch; currentChannel?: ChannelUsersEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const filtersSearch = useContext(SearchMessageChannelContext);
	const [isLoadingMore, setIsLoadingMore] = useState(true);
	const [hasLoadMore, setHasLoadMore] = useState(true);
	const dispatch = useAppDispatch();
	const [pageSearch, setPageSearch] = useState(1);
	const currentPage = useSelector(selectCurrentPage);
	const navigation = useNavigation<any>();

	const isDmOrGroup = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);
	const messageSearchByChannelId = useAppSelector((state) => selectMessageSearchByChannelId(state, currentChannel?.channel_id));
	const searchMessages = useSelector(selectAllMessageSearch);
	const ViewLoadMore = () => {
		return (
			<View style={styles.loadMoreChannelMessage}>
				<ActivityIndicator size="large" color={Colors.tertiary} />
			</View>
		);
	};

	const searchMessagesData = useMemo(() => {
		let groupedMessages: GroupedMessages = [];
		if (typeSearch === ETypeSearch.SearchChannel) {
			groupedMessages?.push({
				label: messageSearchByChannelId[0]?.channel_label,
				messages: messageSearchByChannelId
			});
		} else {
			groupedMessages = searchMessages?.reduce((acc, message) => {
				const label = message?.channel_label ?? '';
				const channelId = message?.channel_id ?? '';
				const existingGroup = acc?.find((group) => group?.label === label && group?.channel_id === channelId);
				if (existingGroup) {
					existingGroup.messages.push(message);
				} else {
					acc.push({
						label,
						channel_id: channelId,
						messages: [message]
					});
				}
				return acc;
			}, []);
		}
		return groupedMessages;
	}, [messageSearchByChannelId, searchMessages, typeSearch]);

	const loadMoreMessages = async () => {
		setIsLoadingMore(true);
		setPageSearch((prevPage) => prevPage + 1);
		if ((!isLoadingMore && !hasLoadMore) || pageSearch <= currentPage) {
			setIsLoadingMore(false);
			return;
		}

		const payload = {
			filters: filtersSearch,
			from: pageSearch,
			size: SIZE_PAGE_SEARCH,
			isMobile: true
		};

		try {
			const searchMessageResponse = await dispatch(searchMessagesActions.fetchListSearchMessage(payload));
			const searchMessage = (searchMessageResponse?.payload as { searchMessage: ISearchMessage[]; isMobile: boolean })?.searchMessage;
			if (!searchMessage || searchMessage?.length === 0) {
				setHasLoadMore(false);
				return;
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoadingMore(false);
		}
	};

	const handleJumpMessage = (message: MessagesEntity) => {
		if (currentChannel?.channel_id !== message?.channel_id) {
			handleJoinChannel(message?.clan_id, message?.channel_id);
		}
		if (message?.message_id && message?.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: message?.clan_id,
					messageId: message?.message_id ?? '',
					channelId: message?.channel_id ?? ''
				})
			);
		}
		if (isDmOrGroup) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: message?.channel_id });
		} else {
			navigation.navigate(APP_SCREEN.HOME_DEFAULT);
		}
	};

	const handleJoinChannel = async (clanId: string, channelId: string) => {
		const store = await getStoreAsync();
		requestAnimationFrame(async () => {
			await store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false, noCache: true }));
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const renderMessageItem = (message: MessagesEntity, index: number) => (
		<TouchableOpacity onPress={() => handleJumpMessage(message)} key={`${message?.id}_${index}`} style={styles.messageItem}>
			<MessageItem message={message} messageId={message.id} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} preventAction isSearchTab={true} />
		</TouchableOpacity>
	);

	const renderGroupItem = ({ item }) => (
		<View>
			{!!item?.label && <Text style={styles.groupMessageLabel}>{`# ${item?.label}`}</Text>}
			{item?.messages?.map(renderMessageItem)}
		</View>
	);

	return (
		<View style={styles.container}>
			{searchMessagesData?.length ? (
				<View style={{ height: '100%', width: '100%', paddingBottom: size.s_100 }}>
					<FlashList
						showsVerticalScrollIndicator={false}
						data={searchMessagesData}
						keyboardShouldPersistTaps={'handled'}
						onScrollBeginDrag={Keyboard.dismiss}
						renderItem={renderGroupItem}
						estimatedItemSize={100}
						removeClippedSubviews={true}
						onEndReached={loadMoreMessages}
						contentContainerStyle={{ paddingBottom: size.s_100 }}
						onEndReachedThreshold={0.5}
						ListFooterComponent={isLoadingMore && <ViewLoadMore />}
					/>
				</View>
			) : (
				<EmptySearchPage />
			)}
		</View>
	);
});

export default MessagesSearchTab;
