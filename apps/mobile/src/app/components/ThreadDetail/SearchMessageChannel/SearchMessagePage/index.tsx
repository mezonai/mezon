import { ACTIVE_TAB, ETypeSearch, IUerMention } from '@mezon/mobile-components';
import {
	DirectEntity,
	listChannelsByUserActions,
	selectAllChannelMembers,
	selectAllChannelsByUser,
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
	userMention: IUerMention;
	typeSearch: ETypeSearch;
	isSearchMessage?: boolean;
}

function SearchMessagePage({ searchText, currentChannel, userMention, typeSearch, isSearchMessage }: ISearchMessagePageProps) {
	const { t } = useTranslation(['searchMessageChannel']);
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MEMBER);

	const listChannels = useAppSelector(selectAllChannelsByUser);
	const channelMembers = useAppSelector((state) => selectAllChannelMembers(state, currentChannel?.channel_id || ''));
	const totalResult = useAppSelector((state) => selectTotalResultSearchMessage(state, currentChannel?.channel_id));
	const dispatch = useAppDispatch();
	const [isContentReady, setIsContentReady] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsContentReady(true);
		}, 200);

		return () => clearTimeout(timeout);
	}, [activeTab, searchText]);

	useEffect(() => {
		dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true, isClearChannel: true }));
	}, [dispatch]);

	const channelsSearch = useMemo(() => {
		if (!searchText) return listChannels;
		return (
			listChannels?.filter((channel) => {
				return normalizeString(channel?.channel_label)?.toLowerCase().includes(normalizeString(searchText)?.toLowerCase());
			}) || []
		).sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'channel_label'));
	}, [searchText, listChannels]);

	const membersSearch = useMemo(() => {
		if (!searchText) return channelMembers;
		return channelMembers
			?.filter((member) => {
				return (
					member?.user?.username?.toLowerCase()?.includes(searchText?.toLowerCase()) ||
					member?.user?.display_name?.toLowerCase()?.includes(searchText?.toLowerCase())
				);
			})
			.sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'display_name'));
	}, [searchText, channelMembers]);

	const TabList = useMemo(() => {
		return [
			{
				title: t('members'),
				quantitySearch: searchText && membersSearch?.length,
				display: !userMention && !!membersSearch?.length,
				index: ACTIVE_TAB.MEMBER
			},
			{
				title: t('channels'),
				quantitySearch: searchText && channelsSearch?.length,
				display: !userMention && !!channelsSearch?.length && !currentChannel?.channel_id,
				index: ACTIVE_TAB.CHANNEL
			},
			{
				title: t('Messages'),
				quantitySearch: totalResult,
				display: !!userMention || (!!totalResult && isSearchMessage),
				index: ACTIVE_TAB.MESSAGES
			}
		].filter((tab) => tab?.display);
	}, [
		t,
		searchText,
		membersSearch?.length,
		userMention,
		channelsSearch?.length,
		totalResult,
		isSearchMessage,
		currentChannel?.channel_id
	]);

	const handelHeaderTabChange = useCallback((index: number) => {
		setActiveTab(index);
	}, []);

	useEffect(() => {
		setActiveTab(TabList[0]?.index);
	}, [TabList]);

	const renderContent = useCallback(() => {
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
	}, [activeTab, typeSearch, currentChannel, membersSearch, channelsSearch]);

	return (
		<View style={{ flex: 1 }}>
			<HeaderTabSearch tabList={TabList} activeTab={activeTab} onPress={handelHeaderTabChange} />
			<View style={{ flex: 1 }}>{isContentReady ? renderContent() : null}</View>
		</View>
	);
}

export default React.memo(SearchMessagePage);
