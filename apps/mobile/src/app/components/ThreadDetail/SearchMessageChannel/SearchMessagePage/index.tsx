import { ACTIVE_TAB, ETypeSearch, IUerMention } from '@mezon/mobile-components';
import {
	DirectEntity,
	getStore,
	listChannelsByUserActions,
	selectAllChannelMembers,
	selectAllChannelsByUser,
	selectAllUsersByUser,
	selectTotalResultSearchMessage,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IChannel, SearchItemProps, compareObjects, normalizeString } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ChannelsSearchTab } from '../../../ChannelsSearchTab';
import { EmptySearchPage } from '../../../EmptySearchPage';
import MembersSearchTab from '../../../MembersSearchTab/MembersSearchTab';
import MessagesSearchTab from '../../../MessagesSearchTab';
import HeaderTabSearch from './HeaderTabSearch';

interface ISearchMessagePageProps {
	currentChannel: IChannel | DirectEntity;
	searchText: string;
	nameChannel: string;
	userMention: IUerMention;
	typeSearch: ETypeSearch;
	isSearchMessage?: boolean;
}

function SearchMessagePage({ searchText, currentChannel, userMention, typeSearch, isSearchMessage, nameChannel = '' }: ISearchMessagePageProps) {
	const { t } = useTranslation(['searchMessageChannel']);
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MEMBER);
	const store = getStore();
	const totalResult = useAppSelector((state) => selectTotalResultSearchMessage(state, currentChannel?.channel_id));
	const dispatch = useAppDispatch();
	const [isContentReady, setIsContentReady] = useState(false);

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
		const listChannels = selectAllChannelsByUser(store.getState());
		if (!searchText) return listChannels;
		return (
			listChannels?.filter((channel) => {
				return normalizeString(channel?.channel_label)?.toLowerCase().includes(normalizeString(searchText)?.toLowerCase());
			}) || []
		).sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'channel_label'));
	}, [searchText, store, nameChannel]);

	const formatMemberData = useCallback((userChannels) => {
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
		if (!nameChannel || !currentChannel?.channel_id) return [];

		try {
			const userChannels = selectAllChannelMembers(store.getState(), currentChannel.channel_id);
			return formatMemberData(userChannels);
		} catch (e) {
			return [];
		}
	}, [nameChannel, currentChannel?.channel_id, store, formatMemberData]);

	const allUsers = useMemo(() => {
		if (nameChannel) return [];
		return selectAllUsersByUser(store.getState()) || [];
	}, [nameChannel, store]);

	const filterAndSortMembers = useCallback((members, searchTerm) => {
		if (!searchTerm) return members;

		const normalizedSearchTerm = searchTerm.toLowerCase();

		return members
			?.filter((member) => {
				const username = member?.username?.toLowerCase() || '';
				const displayName = member?.display_name?.toLowerCase() || '';

				return username.includes(normalizedSearchTerm) || displayName.includes(normalizedSearchTerm);
			})
			.sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchTerm, 'display_name'));
	}, []);

	const membersSearch = useMemo(() => {
		const allMembers = nameChannel ? channelMembers : allUsers;
		return filterAndSortMembers(allMembers, searchText);
	}, [nameChannel, channelMembers, allUsers, searchText, filterAndSortMembers]);

	const TabList = useMemo(() => {
		const data = [
			{
				title: t('members'),
				quantitySearch: searchText && membersSearch?.length,
				display: !userMention && !!membersSearch?.length,
				index: ACTIVE_TAB.MEMBER
			}
		];
		if (nameChannel) {
			data.push({
				title: t('Messages'),
				quantitySearch: totalResult,
				display: !!userMention || (!!totalResult && isSearchMessage),
				index: ACTIVE_TAB.MESSAGES
			});
		} else {
			data.push({
				title: t('channels'),
				quantitySearch: searchText && channelsSearch?.length,
				display: !userMention && !!channelsSearch?.length,
				index: ACTIVE_TAB.CHANNEL
			});
		}
		return data?.filter((tab) => tab?.display);
	}, [t, searchText, membersSearch?.length, userMention, channelsSearch?.length, totalResult, isSearchMessage, nameChannel]);

	const handelHeaderTabChange = useCallback((index: number) => {
		setActiveTab(index);
	}, []);

	useEffect(() => {
		setActiveTab(TabList[0]?.index);
	}, [TabList]);

	const renderContent = () => {
		switch (activeTab) {
			case ACTIVE_TAB.MESSAGES:
				return <MessagesSearchTab typeSearch={typeSearch} currentChannel={currentChannel} />;
			case ACTIVE_TAB.MEMBER:
				return <MembersSearchTab listMemberSearch={membersSearch} />;
			case ACTIVE_TAB.CHANNEL:
				return <ChannelsSearchTab listChannelSearch={channelsSearch} />;
			default:
				return <EmptySearchPage />;
		}
	};

	return (
		<View style={{ flex: 1 }}>
			<HeaderTabSearch tabList={TabList} activeTab={activeTab} onPress={handelHeaderTabChange} />
			<View style={{ flex: 1 }}>{isContentReady ? renderContent() : null}</View>
		</View>
	);
}

export default React.memo(SearchMessagePage);
