import type { ETypeSearch, ITabList, IUerMention } from '@mezon/mobile-components';
import { ACTIVE_TAB } from '@mezon/mobile-components';
import type { ChannelMembersEntity, DirectEntity } from '@mezon/store-mobile';
import {
	getStore,
	listChannelsByUserActions,
	selectAllChannelMembers,
	selectAllChannelsByUser,
	selectAllDirectMessages,
	selectAllUsesInAllClansEntities,
	selectDirectsOpenlist,
	selectEntitesUserClans,
	selectTotalResultSearchMessage,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { IChannel, SearchItemProps } from '@mezon/utils';
import { addAttributesSearchList, compareObjects, normalizeString } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { removeDiacritics } from '../../../../utils/helpers';
import { ChannelsSearchTab } from '../../../ChannelsSearchTab';
import { EmptySearchPage } from '../../../EmptySearchPage';
import MembersSearchTab from '../../../MembersSearchTab/MembersSearchTab';
import MessagesSearchTab from '../../../MessagesSearchTab';
import HeaderTabSearch from './HeaderTabSearch';
import { style } from './styles';

interface ISearchMessagePageProps {
	typeSearch: ETypeSearch;
	searchText: string;
	currentChannel: IChannel | DirectEntity;
	nameChannel: string;
	userMention: IUerMention;
	onActiveTabChange: (tab: number) => void;
	channelIdFilter: string;
}

const SearchMessagePage = ({
	typeSearch,
	searchText,
	currentChannel,
	nameChannel,
	userMention,
	onActiveTabChange,
	channelIdFilter
}: ISearchMessagePageProps) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['searchMessageChannel']);
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MEMBER);
	const [isContentReady, setIsContentReady] = useState(false);
	const allClanUsersEntitiesRef = useRef(useSelector(selectEntitesUserClans));
	const dmGroupChatListRef = useRef(useAppSelector(selectAllDirectMessages));
	const allUsesInAllClansEntitiesRef = useRef(useSelector(selectAllUsesInAllClansEntities));
	const allClanUsersEntities = allClanUsersEntitiesRef.current;
	const dmGroupChatList = dmGroupChatListRef.current;
	const allUsesInAllClansEntities = allUsesInAllClansEntitiesRef.current;
	const checkListDM = useRef(new Set<string>());
	const listDirectSearch = useMemo(() => {
		const listDmSearchMap = [];
		if (dmGroupChatList.length) {
			dmGroupChatList.map((itemDM: DirectEntity) => {
				if (itemDM.active === 1) {
					listDmSearchMap.push({
						id: itemDM.type === ChannelType.CHANNEL_TYPE_GROUP ? itemDM.channel_id : itemDM?.user_ids?.[0],
						username: itemDM?.usernames?.toString() ?? '',
						display_name: itemDM.channel_label,
						channel_label: itemDM.channel_label,
						avatar_url: itemDM.type === ChannelType.CHANNEL_TYPE_DM ? (itemDM?.avatars?.[0] ?? '') : itemDM?.channel_avatar,
						type: itemDM.type === ChannelType.CHANNEL_TYPE_GROUP ? itemDM.type : ''
					});
				}
				if (itemDM.type === ChannelType.CHANNEL_TYPE_DM && itemDM?.user_ids?.[0]) {
					checkListDM.current?.add(itemDM?.user_ids?.[0]);
				}
			});
		}
		return addAttributesSearchList(listDmSearchMap, Object.values(allUsesInAllClansEntities) as any);
	}, [dmGroupChatList, allUsesInAllClansEntities]);
	const listMemberSearch = useMemo(() => {
		const list = [];

		for (const userId in allUsesInAllClansEntities) {
			const user = allUsesInAllClansEntities[userId];
			if (!checkListDM.current?.has(user?.id)) {
				list.push({
					id: user?.id ?? '',
					display_name: allClanUsersEntities[user?.id]?.clan_nick ?? user?.display_name ?? '',
					username: user?.username ?? '',
					avatar_url: user?.avatar_url ?? ''
				});
			}
		}
		return list as SearchItemProps[];
	}, [allClanUsersEntities, allUsesInAllClansEntities]);

	const totalLists = useMemo(() => {
		if (nameChannel) return [];

		return (listMemberSearch || []).concat(listDirectSearch || []);
	}, [nameChannel, listMemberSearch, listDirectSearch]);

	const channelId = useMemo(() => {
		if (!currentChannel) {
			if (channelIdFilter) return channelIdFilter;
			return '0';
		}
		return currentChannel?.channel_id || currentChannel?.id;
	}, [channelIdFilter, currentChannel]);

	const store = getStore();
	const totalResult = useAppSelector((state) => selectTotalResultSearchMessage(state, channelId));

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsContentReady(true);
		}, 300);

		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true, isClearChannel: true }));
	}, [dispatch]);

	const channelsSearch = useMemo(() => {
		if (nameChannel) return [];
		const listChannels = selectAllChannelsByUser(store.getState()) || [];
		if (!searchText) return listChannels;

		try {
			return listChannels
				.filter((channel) => {
					return normalizeString(channel?.channel_label).toLowerCase().includes(normalizeString(searchText).toLowerCase());
				})
				.sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'channel_label'));
		} catch (err) {
			console.error('Filter/sort channelsSearch error', err);
			return [];
		}
	}, [searchText, store, nameChannel]);

	const formatMemberData = useCallback((userChannels: ChannelMembersEntity[]) => {
		return (
			userChannels?.map?.((i) => ({
				avatar_url: i?.clan_avatar || i?.user?.avatar_url,
				display_name: i?.clan_nick || i?.user?.display_name || i?.user?.username,
				id: i?.id,
				username: i?.user?.username
			})) || []
		);
	}, []);

	const channelMembers = useMemo(() => {
		if (!nameChannel || !currentChannel) return [];

		try {
			const userChannels = selectAllChannelMembers(store.getState(), channelId);
			return formatMemberData(userChannels);
		} catch {
			return [];
		}
	}, [nameChannel, currentChannel, store, channelId, formatMemberData]);

	const allDirectMessages = useMemo(() => {
		if (nameChannel) return [];

		return selectDirectsOpenlist(store.getState())?.filter((dm) => Number(dm?.type) === ChannelType.CHANNEL_TYPE_GROUP) || [];
	}, [nameChannel, store]);

	const filterAndSortMembers = useCallback((members, searchTerm: string) => {
		if (!searchTerm.trim() || !members?.length) return members || [];

		const search = searchTerm.trim().toLowerCase();
		const searchNorm = removeDiacritics(search);

		return members
			.map((member) => {
				const username = (member?.username || '').toLowerCase();
				const displayName = (member?.display_name || '').toLowerCase();
				const usernameNorm = removeDiacritics(username);
				const displayNorm = removeDiacritics(displayName);

				const displayScore =
					displayName === search
						? 1050
						: displayName.startsWith(search)
							? 950
							: displayNorm === searchNorm
								? 850
								: displayNorm.startsWith(searchNorm)
									? 750
									: displayName.includes(search)
										? 550
										: displayNorm.includes(searchNorm)
											? 450
											: 0;

				const usernameScore =
					username === search
						? 1000
						: username.startsWith(search)
							? 900
							: usernameNorm === searchNorm
								? 800
								: usernameNorm.startsWith(searchNorm)
									? 700
									: username.includes(search)
										? 500
										: usernameNorm.includes(searchNorm)
											? 400
											: 0;

				const score = Math.max(displayScore, usernameScore);

				return score ? { member, score, len: displayName.length || username.length } : null;
			})
			?.filter(Boolean)
			?.sort((a, b) => b.score - a.score || a.len - b.len)
			?.map((item) => item.member);
	}, []);

	const membersSearch = useMemo(() => {
		const allMembers = nameChannel ? channelMembers : totalLists;
		return filterAndSortMembers(allMembers, searchText);
	}, [nameChannel, channelMembers, totalLists, filterAndSortMembers, searchText]);

	const dmGroupsSearch = useMemo(() => {
		if (nameChannel) return [];
		if (!searchText) return allDirectMessages || [];

		return (
			allDirectMessages?.filter((dmGroup) => {
				const groupLabel = dmGroup?.channel_label || dmGroup?.usernames?.[0] || '';
				return normalizeString(groupLabel)?.toLowerCase().includes(normalizeString(searchText)?.toLowerCase());
			}) || []
		).sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'channel_label'));
	}, [searchText, nameChannel, allDirectMessages]);

	const TabList = useMemo(() => {
		const data: ITabList[] = [];

		if (!userMention) {
			data.push({
				title: t('members'),
				quantitySearch: membersSearch?.length + dmGroupsSearch.length,
				index: ACTIVE_TAB.MEMBER
			});

			if (!nameChannel) {
				data.push({
					title: t('channels'),
					quantitySearch: channelsSearch.length,
					index: ACTIVE_TAB.CHANNEL
				});
			}
		}

		data.push({
			title: t('Messages'),
			quantitySearch: userMention || searchText.trim() ? totalResult : undefined,
			index: ACTIVE_TAB.MESSAGES
		});

		return data;
	}, [channelsSearch.length, dmGroupsSearch.length, membersSearch?.length, nameChannel, searchText, t, totalResult, userMention]);

	const handelHeaderTabChange = useCallback(
		(index: number) => {
			setActiveTab(index);
			onActiveTabChange(index);
		},
		[onActiveTabChange]
	);

	useEffect(() => {
		if (!TabList.some((t) => t.index === activeTab)) {
			setActiveTab(TabList[0].index);
			onActiveTabChange(TabList[0].index);
		}
	}, [TabList, activeTab, onActiveTabChange]);

	const renderContent = () => {
		switch (activeTab) {
			case ACTIVE_TAB.MESSAGES:
				return <MessagesSearchTab typeSearch={typeSearch} currentChannel={currentChannel} channelIdFilter={channelIdFilter} />;
			case ACTIVE_TAB.MEMBER:
				return <MembersSearchTab listMemberSearch={membersSearch} listDMGroupSearch={dmGroupsSearch} />;
			case ACTIVE_TAB.CHANNEL:
				return <ChannelsSearchTab listChannelSearch={channelsSearch} />;
			default:
				return <EmptySearchPage />;
		}
	};

	return (
		<View style={style.flex}>
			<HeaderTabSearch tabList={TabList} activeTab={activeTab} onPress={handelHeaderTabChange} />
			<View style={style.flex}>{isContentReady ? renderContent() : null}</View>
		</View>
	);
};

export default memo(SearchMessagePage);
