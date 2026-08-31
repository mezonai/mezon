import { useAppNavigation, useDirect } from '@mezon/core';
import type { ChannelMetaEntity, DirectEntity } from '@mezon/store';
import {
	appActions,
	categoriesActions,
	channelsActions,
	directActions,
	listChannelsByUserActions,
	messagesActions,
	selectAllChannelsInAllClans,
	selectAllCtrlK,
	selectAllDirectMessages,
	selectChannelMetaEntities,
	selectDmMetaEntities,
	selectEntitesUserClans,
	selectPreviousChannels,
	useAppDispatch,
	useAppSelector,
	userChannelsActions
} from '@mezon/store';
import { InputField } from '@mezon/ui';
import type { SearchItemProps } from '@mezon/utils';
import { TypeSearch, filterListByName, generateE2eId, normalizeString, sortFilteredList } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalLayout } from '../../components';
import { ListGroupSearchModal } from './ListGroupSeacrhModal';

export type SearchModalProps = {
	onClose: () => void;
};
type ClassifiedLists = {
	recentList: SearchItemProps[];
	unreadList: SearchItemProps[];
};
const withChannelMetaUnread = (lastSent: number, lastSeen: number, countUnread: number | undefined, meta?: ChannelMetaEntity) => {
	const fromList = {
		lastSentTimeStamp: lastSent,
		lastSeenTimeStamp: lastSeen,
		count_messsage_unread: countUnread
	};
	if (!meta) {
		return fromList;
	}
	const listSaysUnread = (countUnread ?? 0) > 0 || lastSent > lastSeen;
	const metaSaysUnread = (meta.count_mess_unread ?? 0) > 0 || (meta.lastSentTimestamp ?? 0) > (meta.lastSeenTimestamp ?? 0);
	if (listSaysUnread && metaSaysUnread) {
		return fromList;
	}
	return {
		lastSentTimeStamp: Math.max(lastSent, meta.lastSentTimestamp ?? 0),
		lastSeenTimeStamp: meta.lastSeenTimestamp ?? 0,
		count_messsage_unread: meta.count_mess_unread ?? undefined
	};
};

function SearchModal({ onClose }: SearchModalProps) {
	const { t } = useTranslation('common');
	const dispatch = useAppDispatch();
	const allClanUsersEntities = useAppSelector(selectEntitesUserClans);
	const dmGroupChatList = useAppSelector(selectAllDirectMessages);
	const dmMetaEntities = useAppSelector(selectDmMetaEntities);
	const cltrKList = useAppSelector(selectAllCtrlK);
	const previousChannels = useAppSelector(selectPreviousChannels);

	const { toDmGroupPageFromMainApp, toChannelPage, navigate } = useAppNavigation();
	const { createDirectMessageWithUser } = useDirect();

	const [searchText, setSearchText] = useState('');

	const debouncedSetSearchText = useMemo(() => debounce((value) => setSearchText(value), 300), []);
	const checkListDM = useRef(new Set<string>());
	const listDirectSearch = useMemo(() => {
		const listDmSearchMap: SearchItemProps[] = [];
		if (dmGroupChatList.length) {
			dmGroupChatList.map((itemDM: DirectEntity) => {
				if (itemDM.active === 1) {
					const clanNicks = (itemDM?.user_ids || []).map((uid) => allClanUsersEntities[uid]?.clan_nick).filter(Boolean);
					const dmMeta = withChannelMetaUnread(
						Number(itemDM.last_sent_message?.timestamp_seconds || 0),
						Number(itemDM?.last_seen_message?.timestamp_seconds || 0),
						itemDM.count_mess_unread,
						dmMetaEntities[itemDM.channel_id ?? '']
					);
					listDmSearchMap.push({
						id: itemDM.channel_id,
						name: (itemDM?.usernames?.toString() || itemDM?.display_names?.toString() || itemDM?.channel_label?.toString()) ?? '',
						displayName: itemDM.channel_label,
						avatarUser: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? (itemDM?.avatars?.[0] ?? '') : itemDM?.channel_avatar,
						idDM: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? itemDM?.user_ids?.[0] : itemDM.channel_id,
						lastSentTimeStamp: dmMeta.lastSentTimeStamp,
						typeChat: TypeSearch.Dm_Type,
						type: itemDM.type,
						count_messsage_unread: dmMeta.count_messsage_unread,
						lastSeenTimeStamp: dmMeta.lastSeenTimeStamp,
						searchName: [...(itemDM?.usernames || []), ...(itemDM?.display_names || []), ...clanNicks, itemDM?.channel_label]
							.filter(Boolean)
							.join('.'),
						prioritizeName: itemDM.channel_label || itemDM?.display_names?.toString() || itemDM?.usernames?.toString() || ''
					});
				}
				if (itemDM.active === 1 && itemDM.type === ChannelType.CHANNEL_TYPE_DM && itemDM?.user_ids?.[0]) {
					checkListDM.current?.add(itemDM?.user_ids?.[0]);
				}
				if (itemDM.type === ChannelType.CHANNEL_TYPE_GROUP) {
					checkListDM.current?.add(itemDM?.id);
				}
			});
		}
		return listDmSearchMap;
	}, [dmGroupChatList, cltrKList, dmMetaEntities, allClanUsersEntities]);
	const listChannelSearch = useMemo(() => {
		const list: SearchItemProps[] = [];
		if (cltrKList.length) {
			cltrKList.forEach((item) => {
				if (!item.id) {
					return;
				}
				if (checkListDM.current.has(item.id)) {
					return;
				}
				list.push(item);
			});
		}
		return list;
	}, [cltrKList]);
	const listMemberSearch = useMemo(() => {
		const list: SearchItemProps[] = [];
		const addedUserIds = new Set<string>();

		dmGroupChatList.forEach((itemDM: DirectEntity) => {
			if (itemDM.active !== 1 && itemDM.type === ChannelType.CHANNEL_TYPE_DM && itemDM?.user_ids?.[0]) {
				const userId = itemDM.user_ids[0];
				const clanNick = allClanUsersEntities[userId]?.clan_nick;
				if (!addedUserIds.has(userId) && !checkListDM.current?.has(userId)) {
					list.push({
						id: userId,
						prioritizeName: clanNick ?? itemDM?.display_names?.[0] ?? itemDM?.usernames?.[0] ?? '',
						name: itemDM?.usernames?.[0] ?? '',
						avatarUser: itemDM?.avatars?.[0] ?? '',
						displayName: itemDM?.display_names?.[0] ?? '',
						lastSentTimeStamp: itemDM?.last_sent_message?.timestamp_seconds || '0',
						idDM: userId,
						typeChat: TypeSearch.Dm_Type,
						type: ChannelType.CHANNEL_TYPE_DM,
						searchName: [...(itemDM?.usernames || []), ...(itemDM?.display_names || []), clanNick].filter(Boolean).join('.')
					});
					addedUserIds.add(userId);
				}
			}
		});

		return list as SearchItemProps[];
	}, [allClanUsersEntities, dmGroupChatList]);
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
	}, [listMemberSearch, listChannelSearch, listDirectSearch]);

	const totalListsFiltered = useMemo(() => {
		return filterListByName(totalLists, normalizeSearchText, isSearchByUsername);
	}, [totalLists, normalizeSearchText, isSearchByUsername]);

	const totalListsSorted = useMemo(() => {
		return sortFilteredList(totalListsFiltered, normalizeSearchText, isSearchByUsername);
	}, [totalListsFiltered, normalizeSearchText, isSearchByUsername]);

	const channelSearchSorted = useMemo(() => {
		return totalListsSorted.filter((item) => item.typeChat === TypeSearch.Channel_Type);
	}, [totalListsSorted]);

	const totalListsMemberFiltered = useMemo(() => {
		if (!listMemberSearch.length) {
			return [];
		}

		return filterListByName(listMemberSearch, normalizeSearchText, isSearchByUsername);
	}, [listMemberSearch, normalizeSearchText, isSearchByUsername]);

	const totalListMembersSorted = useMemo(() => {
		return sortFilteredList(totalListsMemberFiltered, normalizeSearchText, isSearchByUsername);
	}, [totalListsMemberFiltered, normalizeSearchText, isSearchByUsername]);

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
		return totalListsSorted;
	}, [channelSearchSorted, normalizeSearchText, totalListMembersSorted, totalListsSorted, totalListsSorted]);

	const channelMetaEntities = useAppSelector(selectChannelMetaEntities);
	const allChannels = useAppSelector(selectAllChannelsInAllClans);

	const classificationList = useMemo(() => {
		const recentIds = new Set(previousChannels.map((item) => item.channelId));

		const { recentList, unreadList } = listItemWithoutRecent.reduce<ClassifiedLists>(
			(acc, item) => {
				const hasUnread = item.lastSentTimeStamp > item.lastSeenTimeStamp || (item.count_messsage_unread ?? 0) > 0;
				if (!hasUnread) return acc;

				const isChannel = item.type === ChannelType.CHANNEL_TYPE_CHANNEL || item.type === ChannelType.CHANNEL_TYPE_THREAD;
				const isDmOrGroup = item.type === ChannelType.CHANNEL_TYPE_DM || item.type === ChannelType.CHANNEL_TYPE_GROUP;

				if (isChannel) {
					acc.unreadList.push(item);
				} else if (isDmOrGroup && item.id && !recentIds.has(item.id)) {
					acc.unreadList.push(item);
				}

				return acc;
			},
			{ recentList: [], unreadList: [] }
		);

		const listPrevious = new Set<string>();
		if (previousChannels.length > 0) {
			for (const previous of previousChannels) {
				if (listPrevious.has(previous.channelId)) {
					continue;
				}
				const channel = allChannels[previous.clanId].entities.entities?.[previous.channelId];
				const meta = channelMetaEntities?.[previous.channelId];

				if (channel) {
					listPrevious.add(channel.id);
					recentList.push({
						count_messsage_unread: meta.count_mess_unread,
						channelId: meta.id,
						id: meta.id,
						channel_private: channel.channel_private || 0,
						name: channel?.channel_label ?? '',
						subText: channel.clan_name || '',
						icon: '#',
						clanId: channel?.clan_id ?? '',
						typeChat: TypeSearch.Channel_Type,
						prioritizeName: channel?.channel_label ?? '',
						age_restricted: channel.age_restricted,
						type: channel?.type,
						parent_id: channel?.parent_id,
						lastSeenTimeStamp: meta.lastSeenTimestamp,
						lastSentTimeStamp: meta.lastSentTimestamp
					});
				}
			}
		}

		Object.values(channelMetaEntities)?.map((meta) => {
			if ((meta.count_mess_unread || meta.lastSeenTimestamp < meta.lastSentTimestamp) && !listPrevious.has(meta.id)) {
				if (allChannels[meta.clanId]?.entities?.entities?.[meta.id]) {
					const channel = allChannels[meta.clanId].entities.entities?.[meta.id];

					unreadList.push({
						count_messsage_unread: meta.count_mess_unread,
						channelId: meta.id,
						id: meta.id,
						channel_private: channel.channel_private || 0,
						name: channel?.channel_label ?? '',
						subText: channel.clan_name || '',
						icon: '#',
						clanId: channel?.clan_id ?? '',
						typeChat: TypeSearch.Channel_Type,
						prioritizeName: channel?.channel_label ?? '',
						age_restricted: channel.age_restricted,
						type: channel?.type,
						parent_id: channel?.parent_id,
						lastSeenTimeStamp: meta.lastSeenTimestamp,
						lastSentTimeStamp: meta.lastSentTimestamp
					});
				}
			}
		});

		return { recentList, unreadList };
	}, [listItemWithoutRecent, previousChannels, channelMetaEntities]);

	const { recentList, unreadList } = classificationList;

	const listRecent = useMemo(() => {
		const previous: SearchItemProps[] = recentList;
		if (listDirectSearch.length > 0) {
			for (let i = listDirectSearch.length - 1; i >= 0; i--) {
				const itemDMId = listDirectSearch[i]?.id || '';
				if (previousChannels.map((item) => item.channelId).includes(itemDMId)) {
					previous.unshift(listDirectSearch[i]);
				}
			}
		}

		return previous;
	}, [recentList, listDirectSearch, previousChannels, totalListsSorted]);
	const handleSelectMem = useCallback(
		async (user: SearchItemProps) => {
			const foundDirect = dmGroupChatList.find((item) => item.id === user.id);
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
				if (response.channel_id) {
					const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
					navigate(directChat);
				}
			}
		},
		[createDirectMessageWithUser, dispatch, dmGroupChatList, navigate, toDmGroupPageFromMainApp]
	);

	const handleSelectChannel = useCallback(
		async (channel: SearchItemProps) => {
			if (!channel?.id) {
				return;
			}
			dispatch(appActions.setIsShowSettingFooterStatus(false));
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

	useEffect(() => {
		dispatch(userChannelsActions.fetchSearchCtrlK({ textSearch: searchText }));
	}, [searchText]);

	return (
		<ModalLayout onClose={onClose}>
			<div
				className="relative z-10 mx-4 md:!w-[640px] px-6 py-4 rounded-[6px] shadow-shadowBorder bg-modal-theme-search"
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
					unreadList={unreadList}
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
