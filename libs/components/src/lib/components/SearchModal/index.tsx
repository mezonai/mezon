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
import { TypeSearch, addAttributesSearchList, filterListByName, generateE2eId, normalizeString, sortFilteredList } from '@mezon/utils';
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
						id: itemDM.channelId,
						name: itemDM?.usernames?.toString() ?? '',
						displayName: itemDM.channelLabel,
						avatarUser: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? (itemDM?.avatars?.[0] ?? '') : itemDM?.channelAvatar,
						idDM: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? itemDM?.userIds?.[0] : itemDM.channelId,
						lastSentTimeStamp: itemDM.lastSentMessage?.timestampSeconds,
						typeChat: TypeSearch.Dm_Type,
						type: itemDM.type,
						count_messsage_unread: itemDM.countMessUnread,
						lastSeenTimeStamp: Number(itemDM?.lastSeenMessage?.timestampSeconds || 0)
					});
				}
				if (itemDM.type === ChannelType.CHANNEL_TYPE_DM && itemDM?.userIds?.[0]) {
					checkListDM.current?.add(itemDM?.userIds?.[0]);
				}
			});
		}
		const addPropsIntoSearchList = addAttributesSearchList(listDmSearchMap, Object.values(allUsesInAllClansEntities) as any);
		return addPropsIntoSearchList;
	}, [accountId, dmGroupChatList, allUsesInAllClansEntities]);
	const listChannelSearch = useMemo(() => {
		const list = listChannels.map((item) => {
			return {
				id: item?.channelId ?? '',
				name: item?.channelLabel ?? '',
				subText: item?.clanName ?? '',
				icon: '#',
				clanId: item?.clanId ?? '',
				channelId: item?.channelId ?? '',
				lastSentTimeStamp: Number(item?.lastSentMessage?.timestampSeconds || 0),
				typeChat: TypeSearch.Channel_Type,
				prioritizeName: item?.channelLabel ?? '',
				channelPrivate: item.channelPrivate,
				type: item.type,
				parentId: item.parentId,
				meetingCode: item.meetingCode,
				count_messsage_unread: item?.countMessUnread,
				lastSeenTimeStamp: Number(item?.lastSeenMessage?.timestampSeconds || 0)
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
					prioritizeName: allClanUsersEntities[user?.id]?.clanNick ?? user?.displayName ?? '',
					name: user?.username ?? '',
					avatarUser: user?.avatarUrl ?? '',
					displayName: user?.displayName ?? '',
					lastSentTimeStamp: '0',
					idDM: user?.id,
					typeChat: TypeSearch.Dm_Type,
					type: ChannelType.CHANNEL_TYPE_DM,
					searchName: (user.listNickNames || []).join('.')
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
				const existsInPrevious = previous.some((item) => item?.idDM === listDirectSearch[i]?.idDM);
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
			dispatch(appActions.setIsShowSettingFooterStatus(false));
			if (foundDirect !== undefined) {
				dispatch(
					channelsActions.setPreviousChannels({
						clanId: '0',
						channelId: foundDirect.id || ''
					})
				);
				dispatch(directActions.openDirectMessage({ channelId: foundDirect.id || '', clanId: '0' }));
				const result = await dispatch(
					directActions.joinDirectMessage({
						directMessageId: foundDirect.id ?? '',
						channelName: '',
						type: foundDirect?.type ?? ChannelType.CHANNEL_TYPE_DM,
						noCache: true
					})
				);
				if (result) {
					navigate(toDmGroupPageFromMainApp(foundDirect.id ?? '', user?.type ?? ChannelType.CHANNEL_TYPE_DM));
				}
			} else {
				const response = await createDirectMessageWithUser(user.idDM || '', user.displayName || user.name, user.name, user.avatarUser);
				if (response.channelId) {
					const directChat = toDmGroupPageFromMainApp(response.channelId, Number(response.type));
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
			dispatch(appActions.setIsShowSettingFooterStatus(false));
			dispatch(categoriesActions.setCtrlKSelectedChannelId(channel?.id ?? ''));
			const channelUrl = toChannelPage(channel?.id ?? '', channel?.clanId ?? '');
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parentId ?? '' }));
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
			<div
				className="relative z-10 mx-4 md:!w-[640px] px-6 py-4 rounded-[6px] shadow-shadowBorder bg-modal-theme"
				data-e2e={generateE2eId('modal.search')}
			>
				<div className="flex flex-col" data-e2e={generateE2eId('modal.search.input')}>
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
