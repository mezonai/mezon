import { useAppNavigation, useAuth, useDirect } from '@mezon/core';
import {
	DirectEntity,
	appActions,
	categoriesActions,
	channelsActions,
	directActions,
	messagesActions,
	selectAllChannelsByUser,
	selectAllDirectMessages,
	selectAllUsesInAllClansEntities,
	selectEntitesUserClans,
	selectPreviousChannels,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { InputField } from '@mezon/ui';
import {
	SearchItemProps,
	TypeSearch,
	addAttributesSearchList,
	filterListByName,
	normalizeString,
	removeDuplicatesById,
	sortFilteredList
} from '@mezon/utils';
import { Modal } from 'flowbite-react';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ListGroupSearchModal } from './ListGroupSeacrhModal';

export type SearchModalProps = {
	readonly open: boolean;
	onClose: () => void;
};

function SearchModal({ open, onClose }: SearchModalProps) {
	const dispatch = useAppDispatch();
	const allClanUsersEntitiesRef = useRef(useSelector(selectEntitesUserClans));
	const dmGroupChatListRef = useRef(useAppSelector(selectAllDirectMessages));
	const listChannelsRef = useRef(useAppSelector(selectAllChannelsByUser));
	const allUsesInAllClansEntitiesRef = useRef(useSelector(selectAllUsesInAllClansEntities));
	const previousChannelsRef = useRef(useSelector(selectPreviousChannels));

	const allClanUsersEntities = allClanUsersEntitiesRef.current;
	const dmGroupChatList = dmGroupChatListRef.current;
	const listChannels = listChannelsRef.current;
	const allUsesInAllClansEntities = allUsesInAllClansEntitiesRef.current;
	const previousChannels = previousChannelsRef.current;

	const { userProfile } = useAuth();
	const accountId = userProfile?.user?.id ?? '';

	const { toDmGroupPageFromMainApp, toChannelPage, navigate } = useAppNavigation();
	const { createDirectMessageWithUser } = useDirect();

	const [searchText, setSearchText] = useState('');

	const debouncedSetSearchText = useMemo(() => debounce((value) => setSearchText(value), 200), []);

	const listGroup = useMemo(
		() => dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_GROUP && groupChat.active === 1),
		[dmGroupChatList]
	);

	const listDM = useMemo(
		() =>
			dmGroupChatList.filter(
				(groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM && groupChat.channel_avatar && groupChat.active === 1
			),
		[dmGroupChatList]
	);

	const listDirectSearch = useMemo(() => {
		const listDMSearch = listDM?.length
			? listDM.map((itemDM: DirectEntity) => {
					return {
						id: itemDM?.user_id?.[0] ?? '',
						name: itemDM?.usernames?.toString() ?? '',
						displayName: itemDM.channel_label,
						avatarUser: itemDM?.channel_avatar?.[0] ?? '',
						idDM: itemDM?.id ?? '',
						lastSentTimeStamp: itemDM.last_sent_message?.timestamp_seconds,
						typeChat: TypeSearch.Dm_Type,
						type: ChannelType.CHANNEL_TYPE_DM,
						count_messsage_unread: itemDM.count_mess_unread,
						lastSeenTimeStamp: Number(itemDM?.last_seen_message?.timestamp_seconds || 0),
						member: itemDM.user_id && itemDM.user_id[0]
					};
				})
			: [];
		const listGroupSearch = listGroup.length
			? listGroup.map((itemGr: DirectEntity) => {
					return {
						id: itemGr?.channel_id ?? '',
						name: itemGr.usernames?.toString() ?? '',
						displayName: itemGr.channel_label,
						avatarUser: 'assets/images/avatar-group.png',
						idDM: itemGr?.id ?? '',
						lastSentTimeStamp: itemGr.last_sent_message?.timestamp_seconds,
						type: ChannelType.CHANNEL_TYPE_GROUP,
						typeChat: TypeSearch.Dm_Type,
						count_messsage_unread: itemGr.count_mess_unread,
						lastSeenTimeStamp: Number(itemGr?.last_seen_message?.timestamp_seconds || 0)
					};
				})
			: [];
		const listSearch = [...listDMSearch, ...listGroupSearch];
		const removeDuplicate = removeDuplicatesById(listSearch.filter((item) => item?.id !== accountId));
		const addPropsIntoSearchList = addAttributesSearchList(removeDuplicate, Object.values(allUsesInAllClansEntities) as any);
		return addPropsIntoSearchList;
	}, [accountId, listDM, listGroup, allUsesInAllClansEntities]);
	const listChannelSearch = useMemo(() => {
		const list = listChannels.map((item) => {
			return {
				id: item?.channel_id ?? '',
				name: item?.channel_label ?? '',
				subText: item?.clan_name ?? '',
				icon: '#',
				clanId: item?.clan_id ?? '',
				channelId: item?.channel_id ?? '',
				lastSentTimeStamp: Number(item?.last_sent_message?.timestamp_seconds || 0),
				typeChat: TypeSearch.Channel_Type,
				prioritizeName: item?.channel_label ?? '',
				channel_private: item.channel_private,
				type: item.type,
				parent_id: item.parent_id,
				meeting_code: item.meeting_code,
				count_messsage_unread: item?.count_mess_unread,
				lastSeenTimeStamp: Number(item?.last_seen_message?.timestamp_seconds || 0)
			};
		});
		return list;
	}, [listChannels]);

	const findFilterDm = (id: string) => {
		const dm = listDirectSearch.find((item) => item.id === id);
		return dm ? dm.idDM : undefined;
	};

	const listMemberSearch = useMemo(() => {
		const list: SearchItemProps[] = [];

		for (const userId in allUsesInAllClansEntities) {
			const user = allUsesInAllClansEntities[userId];
			list.push({
				id: user?.id ?? '',
				prioritizeName: allClanUsersEntities[user?.id]?.clan_nick ?? user?.display_name ?? '',
				name: user?.username ?? '',
				avatarUser: user?.avatar_url ?? '',
				displayName: user?.display_name ?? '',
				lastSentTimeStamp: '0',
				idDM: findFilterDm(user?.id),
				typeChat: TypeSearch.Dm_Type,
				type: ChannelType.CHANNEL_TYPE_DM
			});
		}
		return list as SearchItemProps[];
	}, [allClanUsersEntities, allUsesInAllClansEntities]);
	const normalizeSearchText = useMemo(() => {
		return normalizeString(searchText);
	}, [searchText]);

	const isSearchByUsername = useMemo(() => {
		return searchText.startsWith('@');
	}, [searchText]);

	const totalLists = useMemo(() => {
		const filterDmWithoutIdDM = listMemberSearch.filter((item) => item.idDM === undefined);
		const list = filterDmWithoutIdDM.concat(listChannelSearch, listDirectSearch);
		const sortedList = list.slice().sort((a: any, b: any) => b.lastSentTimeStamp - a.lastSentTimeStamp);
		return sortedList;
	}, [listMemberSearch, listChannelSearch, listDirectSearch, allUsesInAllClansEntities, accountId]);

	const totalListsFiltered = useMemo(() => {
		return filterListByName(totalLists, normalizeSearchText, isSearchByUsername);
	}, [totalLists, normalizeSearchText, isSearchByUsername]);

	const totalListsSorted = useMemo(() => {
		return sortFilteredList(totalListsFiltered, normalizeSearchText, isSearchByUsername);
	}, [totalListsFiltered, normalizeSearchText, isSearchByUsername]);

	const totalListSortedWithoutPreviousList = useMemo(() => {
		return [...totalListsSorted];
	}, [totalListsSorted]);

	const channelSearchSorted = useMemo(() => {
		return totalListsSorted.filter((item) => item.typeChat === TypeSearch.Channel_Type);
	}, [totalListsSorted]);

	const totalListsMemberFiltered = useMemo(() => {
		return filterListByName(listMemberSearch, normalizeSearchText, isSearchByUsername);
	}, [listMemberSearch, normalizeSearchText, isSearchByUsername]);

	const totalListMembersSorted = useMemo(() => {
		return sortFilteredList(totalListsMemberFiltered, normalizeSearchText, isSearchByUsername);
	}, [totalListsMemberFiltered, normalizeSearchText, isSearchByUsername]);

	const listRecent = useMemo(() => {
		const previous: SearchItemProps[] = [];
		if (totalListSortedWithoutPreviousList.length > 0) {
			for (let i = totalListSortedWithoutPreviousList.length - 1; i >= 0; i--) {
				if (
					previousChannels
						.map((item) => item.channelId)
						.includes(totalListSortedWithoutPreviousList[i]?.channelId || totalListSortedWithoutPreviousList[i]?.id || '')
				) {
					previous.unshift(totalListSortedWithoutPreviousList[i]);
					totalListSortedWithoutPreviousList.splice(i, 1);
				}
			}
		}

		if (listDirectSearch.length > 0) {
			for (let i = listDirectSearch.length - 1; i >= 0; i--) {
				const itemDMId = listDirectSearch[i]?.idDM || '';
				const existsInPrevious = previous.some((item) => item?.id === listDirectSearch[i]?.idDM);
				if (previousChannels.map((item) => item.channelId).includes(itemDMId) && !existsInPrevious) {
					previous.unshift(listDirectSearch[i]);
				}
			}
		}

		return previous;
	}, [listDirectSearch, previousChannels, totalListSortedWithoutPreviousList]);
	const listItemWithoutRecent = useMemo(() => {
		if (normalizeSearchText.startsWith('@')) {
			return totalListMembersSorted;
		}
		if (normalizeSearchText.startsWith('#')) {
			return channelSearchSorted;
		}

		if (normalizeSearchText) {
			return totalListsSorted;
		}
		return totalListSortedWithoutPreviousList;
	}, [channelSearchSorted, normalizeSearchText, totalListMembersSorted, totalListSortedWithoutPreviousList, totalListsSorted]);

	const handleSelectMem = useCallback(
		async (user: any) => {
			const foundDirect = listDirectSearch.find((item) => item.id === user.id);
			if (foundDirect !== undefined) {
				dispatch(
					channelsActions.setPreviousChannels({
						clanId: '0',
						channelId: foundDirect.idDM || ''
					})
				);
				dispatch(directActions.openDirectMessage({ channelId: foundDirect.idDM || '', clanId: '0' }));
				const result = await dispatch(
					directActions.joinDirectMessage({
						directMessageId: foundDirect.idDM ?? '',
						channelName: '',
						type: foundDirect?.type ?? ChannelType.CHANNEL_TYPE_DM,
						noCache: true
					})
				);
				if (result) {
					navigate(toDmGroupPageFromMainApp(foundDirect.idDM ?? '', user?.type ?? ChannelType.CHANNEL_TYPE_DM));
				}
			} else {
				const response = await createDirectMessageWithUser(user.id);
				if (response.channel_id) {
					const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
					navigate(directChat);
				}
			}
		},
		[createDirectMessageWithUser, dispatch, listDirectSearch, navigate, toDmGroupPageFromMainApp]
	);

	const handleSelectChannel = useCallback(
		async (channel: SearchItemProps) => {
			if (!channel?.id) {
				return;
			}

			if (channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
				const urlVoice = `https://meet.google.com/${channel.meeting_code}`;
				window.open(urlVoice, '_blank', 'noreferrer');
				return;
			}

			dispatch(categoriesActions.setCtrlKSelectedChannelId(channel?.id ?? ''));
			const channelUrl = toChannelPage(channel?.id ?? '', channel?.clanId ?? '');
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parent_id ?? '' }));
			navigate(channelUrl);
		},
		[dispatch, navigate, toChannelPage]
	);

	const handleItemClick = useCallback(
		(item: SearchItemProps) => {
			try {
				if (!item) {
					return;
				}
				dispatch(appActions.setIsShowCanvas(false));
				const isChannel = item?.typeChat === TypeSearch.Channel_Type;
				if (isChannel) {
					handleSelectChannel(item);
					dispatch(messagesActions.setIsFocused(true));
				} else {
					handleSelectMem(item);
				}
			} catch (error) {
				console.error({ error });
			} finally {
				onClose();
			}
		},
		[onClose, handleSelectChannel, dispatch, handleSelectMem]
	);

	return (
		<Modal
			show={open}
			dismissible={true}
			onClose={onClose}
			className="bg-[#111111] text-contentPrimary bg-opacity-90 focus-visible:[&>*]:outline-none"
		>
			<Modal.Body className="dark:bg-[#36393e] bg-bgLightMode px-6 py-4 rounded-[6px] h-[200px] w-full">
				<div className="flex flex-col">
					<InputField
						type="text"
						placeholder="Where would you like to go?"
						className="py-[18px] dark:bg-bgTertiary bg-bgLightModeThird dark:text-textDarkTheme text-textLightTheme text-[16px] mt-2 mb-[15px]"
						onChange={(e) => debouncedSetSearchText(e.target.value)}
					/>
				</div>
				<ListGroupSearchModal
					listRecent={listRecent}
					listItemWithoutRecent={listItemWithoutRecent}
					normalizeSearchText={normalizeSearchText}
					handleItemClick={handleItemClick}
				/>
				<FooterNoteModal />
			</Modal.Body>
		</Modal>
	);
}

export default memo(SearchModal);

const FooterNoteModal = memo(() => {
	return (
		<div className="pt-2">
			<span className="text-[13px] font-medium dark:text-contentTertiary text-textLightTheme">
				<span className="text-[#2DC770] opacity-100 font-bold">PROTIP: </span>Start searches with @, # to narrow down results.
			</span>
		</div>
	);
});
