import { useAppNavigation, useAuth, useDirect } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import {
	appActions,
	categoriesActions,
	channelsActions,
	directActions,
	listChannelsByUserActions,
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
import type { SearchItemProps } from '@mezon/utils';
import { TypeSearch, addAttributesSearchList, filterListByName, normalizeString, sortFilteredList } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';
import { ListGroupSearchModal } from './ListGroupSeacrhModal';

export type SearchModalProps = {
	onClose: () => void;
};

function SearchModal({ onClose }: SearchModalProps) {
	const { t } = useTranslation('common');
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
	const checkListDM = useRef(new Set<string>());
	const listDirectSearch = useMemo(() => {
		const listDmSearchMap: SearchItemProps[] = [];
		if (dmGroupChatList.length) {
			dmGroupChatList.map((itemDM: DirectEntity) => {
				if (itemDM.active === 1) {
					listDmSearchMap.push({
						id: itemDM.channel_id,
						name: itemDM?.usernames?.toString() ?? '',
						displayName: itemDM.channel_label,
						avatarUser: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? (itemDM?.avatars?.[0] ?? '') : itemDM?.channel_avatar,
						idDM: itemDM?.user_ids?.[0] ?? '',
						lastSentTimeStamp: itemDM.last_sent_message?.timestamp_seconds,
						typeChat: TypeSearch.Dm_Type,
						type: itemDM.type,
						count_messsage_unread: itemDM.count_mess_unread,
						lastSeenTimeStamp: Number(itemDM?.last_seen_message?.timestamp_seconds || 0)
					});
				}
				if (itemDM.type === ChannelType.CHANNEL_TYPE_DM && itemDM?.user_ids?.[0]) {
					checkListDM.current?.add(itemDM?.user_ids?.[0]);
				}
			});
		}
		const addPropsIntoSearchList = addAttributesSearchList(listDmSearchMap, Object.values(allUsesInAllClansEntities) as any);
		return addPropsIntoSearchList;
	}, [accountId, dmGroupChatList, allUsesInAllClansEntities]);
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

	const listMemberSearch = useMemo(() => {
		const list: SearchItemProps[] = [];

		for (const userId in allUsesInAllClansEntities) {
			const user = allUsesInAllClansEntities[userId];
			if (!checkListDM.current?.has(user?.id)) {
				list.push({
					id: user?.id ?? '',
					prioritizeName: allClanUsersEntities[user?.id]?.clan_nick ?? user?.display_name ?? '',
					name: user?.username ?? '',
					avatarUser: user?.avatar_url ?? '',
					displayName: user?.display_name ?? '',
					lastSentTimeStamp: '0',
					idDM: user?.id,
					typeChat: TypeSearch.Dm_Type,
					type: ChannelType.CHANNEL_TYPE_DM,
					searchName: (user.list_nick_names || []).join('.')
				});
			}
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
		const list = listMemberSearch.concat(listChannelSearch, listDirectSearch);
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
		async (user: SearchItemProps) => {
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
				const response = await createDirectMessageWithUser(user.id || '', user.displayName || user.name, user.name, user.avatarUser);
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
					listChannelsByUserActions.updateChannelBadgeCount({
						channelId: item?.channelId as string,
						count: (item?.count_messsage_unread || 0) * -1,
						isReset: true
					});
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
		<ModalLayout onClose={onClose}>
			<div className="relative z-10 mx-4 md:!w-[640px] px-6 py-4 rounded-[6px] shadow-shadowBorder bg-modal-theme">
				<div className="flex flex-col">
					<InputField
						type="text"
						placeholder={t('searchModal.placeholder')}
						className="py-[12px] md:py-[18px] text-[16px] mt-2 mb-[15px] bg-input-secondary rounded-lg text-theme-message border-theme-primary"
						onChange={(e) => debouncedSetSearchText(e.target.value)}
						autoFocus
					/>
				</div>
				<ListGroupSearchModal
					listRecent={listRecent}
					listItemWithoutRecent={listItemWithoutRecent}
					normalizeSearchText={normalizeSearchText}
					handleItemClick={handleItemClick}
				/>
				<FooterNoteModal />
			</div>
		</ModalLayout>
	);
}

export default memo(SearchModal);

const FooterNoteModal = memo(() => {
	const { t } = useTranslation('common');
	return (
		<div className="pt-2">
			<span className="text-[13px] font-medium text-theme-primary">
				<span className="text-[#2DC770] opacity-100 font-bold">{t('searchModal.protip')} </span>
				{t('searchModal.protipDescription')}
			</span>
		</div>
	);
});
