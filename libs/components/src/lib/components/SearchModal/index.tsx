import { useAppNavigation, useDirect } from '@mezon/core';
import type { ChannelMetaEntity, ChannelsEntity, DirectEntity } from '@mezon/store';
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
	selectClanView,
	selectClansEntities,
	selectCtrlKQuery,
	selectCurrentClanId,
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

const GROUP_LIMIT = 5;

const toChannelItem = (channel: ChannelsEntity, clanName: string, meta?: ChannelMetaEntity): SearchItemProps => ({
	count_messsage_unread: meta?.count_mess_unread,
	channelId: channel.id,
	id: channel.id,
	channel_private: channel.channel_private || 0,
	name: channel?.channel_label ?? '',
	subText: clanName,
	icon: '#',
	clanId: channel?.clan_id ?? '',
	typeChat: TypeSearch.Channel_Type,
	prioritizeName: channel?.channel_label ?? '',
	age_restricted: channel.age_restricted,
	type: channel?.type,
	parent_id: channel?.parent_id,
	lastSeenTimeStamp: meta?.lastSeenTimestamp ?? 0,
	lastSentTimeStamp: meta?.lastSentTimestamp ?? 0
});

const dedupeById = (items: SearchItemProps[]) => {
	const seenIds = new Set<string>();
	return items.filter((item) => {
		if (!item.id) {
			return true;
		}
		if (seenIds.has(item.id)) {
			return false;
		}
		seenIds.add(item.id);
		return true;
	});
};

function SearchModal({ onClose }: SearchModalProps) {
	const { t } = useTranslation('common');
	const dispatch = useAppDispatch();
	const allClanUsersEntities = useAppSelector(selectEntitesUserClans);
	const dmGroupChatList = useAppSelector(selectAllDirectMessages);
	const dmMetaEntities = useAppSelector(selectDmMetaEntities);
	const channelMetaEntities = useAppSelector(selectChannelMetaEntities);
	const cltrKList = useAppSelector(selectAllCtrlK);
	const ctrlKQuery = useAppSelector(selectCtrlKQuery);
	const clansEntities = useAppSelector(selectClansEntities);
	const previousChannels = useAppSelector(selectPreviousChannels);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const isClanView = useAppSelector(selectClanView);

	const resolveClanName = useCallback(
		(clanId?: string, fallback?: string) => (clanId ? clansEntities?.[clanId]?.clan_name : '') || fallback || '',
		[clansEntities]
	);

	const { toDmGroupPageFromMainApp, toChannelPage, navigate } = useAppNavigation();
	const { createDirectMessageWithUser } = useDirect();

	const [searchText, setSearchText] = useState('');

	const isAwaitingResults = searchText.trim() !== '' && ctrlKQuery !== searchText;

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
		if (isAwaitingResults) {
			return list;
		}
		if (cltrKList.length) {
			cltrKList.forEach((item) => {
				if (!item.id) {
					return;
				}
				if (checkListDM.current.has(item.id)) {
					return;
				}
				if (item.typeChat === TypeSearch.Channel_Type) {
					const isDirectConversation =
						!item.clanId ||
						item.clanId === '0' ||
						item.type === ChannelType.CHANNEL_TYPE_GROUP ||
						item.type === ChannelType.CHANNEL_TYPE_DM;
					if (isDirectConversation) {
						return;
					}

					const meta = channelMetaEntities[item.id];
					list.push({
						...item,
						subText: resolveClanName(item.clanId, item.subText),
						lastSentTimeStamp: meta?.lastSentTimestamp ?? 0,
						lastSeenTimeStamp: meta?.lastSeenTimestamp ?? 0,
						count_messsage_unread: meta ? meta.count_mess_unread : item.count_messsage_unread
					});
					return;
				}
				list.push(item);
			});
		}
		return list;
	}, [cltrKList, isAwaitingResults, channelMetaEntities, resolveClanName]);
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
		const memberSources = [...listMemberSearch, ...listDirectSearch, ...listChannelSearch].filter(
			(item) => item.typeChat !== TypeSearch.Channel_Type
		);
		if (!memberSources.length) {
			return [];
		}

		return filterListByName(memberSources, normalizeSearchText, isSearchByUsername);
	}, [listMemberSearch, listDirectSearch, listChannelSearch, normalizeSearchText, isSearchByUsername]);

	const totalListMembersSorted = useMemo(() => {
		return sortFilteredList(totalListsMemberFiltered, normalizeSearchText, isSearchByUsername);
	}, [totalListsMemberFiltered, normalizeSearchText, isSearchByUsername]);

	const listItemWithoutRecent = useMemo(() => {
		if (normalizeSearchText.startsWith('@')) {
			return dedupeById(totalListMembersSorted);
		}
		if (normalizeSearchText.startsWith('#')) {
			return dedupeById(channelSearchSorted);
		}

		return dedupeById(totalListsSorted);
	}, [channelSearchSorted, normalizeSearchText, totalListMembersSorted, totalListsSorted]);

	const allChannels = useAppSelector(selectAllChannelsInAllClans);

	const classificationList = useMemo<ClassifiedLists>(() => {
		const recentPool: SearchItemProps[] = [];
		const unreadPool: SearchItemProps[] = [];
		const seenRecent = new Set<string>();

		if (isClanView) {
			const clanChannels = allChannels[currentClanId as string]?.entities?.entities;
			for (const previous of previousChannels) {
				const channel = clanChannels?.[previous.channelId];
				if (!channel?.id || seenRecent.has(channel.id)) {
					continue;
				}
				seenRecent.add(channel.id);
				recentPool.push(toChannelItem(channel, resolveClanName(channel.clan_id, channel.clan_name), channelMetaEntities?.[channel.id]));
			}

			for (const channel of Object.values(clanChannels ?? {})) {
				if (!channel?.id) {
					continue;
				}
				const meta = channelMetaEntities?.[channel.id];
				if (!meta || !(meta.count_mess_unread || meta.lastSeenTimestamp < meta.lastSentTimestamp)) {
					continue;
				}
				unreadPool.push(toChannelItem(channel, resolveClanName(channel.clan_id, channel.clan_name), meta));
			}
		} else {
			const conversationsById = new Map(listDirectSearch.map((item) => [item.id, item]));
			for (const previous of previousChannels) {
				const conversation = conversationsById.get(previous.channelId);
				if (!conversation?.id || seenRecent.has(conversation.id)) {
					continue;
				}
				seenRecent.add(conversation.id);
				recentPool.push(conversation);
			}

			for (const conversation of listDirectSearch) {
				if (!conversation.id) {
					continue;
				}
				const hasUnread = conversation.lastSentTimeStamp > conversation.lastSeenTimeStamp || (conversation.count_messsage_unread ?? 0) > 0;
				if (!hasUnread) {
					continue;
				}
				unreadPool.push(conversation);
			}
		}

		unreadPool.sort((a, b) => (Number(b.lastSentTimeStamp) || 0) - (Number(a.lastSentTimeStamp) || 0));
		const unreadList = unreadPool.slice(0, GROUP_LIMIT);
		const unreadIds = new Set(unreadList.map((item) => item.id));
		const recentList = recentPool.filter((item) => !unreadIds.has(item.id)).slice(0, GROUP_LIMIT);

		return { recentList, unreadList };
	}, [isClanView, currentClanId, previousChannels, allChannels, channelMetaEntities, listDirectSearch, resolveClanName]);

	const { recentList: listRecent, unreadList } = classificationList;
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
					isAwaitingResults={isAwaitingResults}
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
