import { ACTIVE_TAB, ETypeSearch, IUerMention } from '@mezon/mobile-components';
import { DirectEntity, selectAllInfoChannels, selectAllUsersByUser, selectTotalResultSearchMessage } from '@mezon/store-mobile';
import { IChannel, SearchItemProps, compareObjects, normalizeString } from '@mezon/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChannelsSearchTab } from '../../../ChannelsSearchTab';
import { EmptySearchPage } from '../../../EmptySearchPage';
import MembersSearchTab from '../../../MembersSearchTab/MembersSearchTab';
import MessagesSearchTab from '../../../MessagesSearchTab';
import HeaderTabSearch from './HeaderTabSearch';

interface ISearchMessagePageProps {
	currentChannel: IChannel | DirectEntity;
	searchText: string;
	userMention: IUerMention;
	isSearchMessagePage: boolean;
	typeSearch: ETypeSearch;
}

function SearchMessagePage({ searchText, currentChannel, userMention, isSearchMessagePage, typeSearch }: ISearchMessagePageProps) {
	const { t } = useTranslation(['searchMessageChannel']);
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MEMBER);
	const listChannels = useSelector(selectAllInfoChannels);
	const totalResult = useSelector(selectTotalResultSearchMessage);
	const allUsesInAllClans = useSelector(selectAllUsersByUser);

	const channelsSearch = useMemo(() => {
		if (!searchText) return listChannels;
		return (
			listChannels?.filter((channel) => {
				return normalizeString(channel?.channel_label)?.toLowerCase().includes(normalizeString(searchText)?.toLowerCase());
			}) || []
		).sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'channel_label'));
	}, [listChannels, searchText]);

	const membersSearch = useMemo(() => {
		if (!searchText) return allUsesInAllClans;
		return allUsesInAllClans
			?.filter((member) => {
				return member?.username?.toLowerCase()?.includes(searchText?.toLowerCase());
			})
			.sort((a: SearchItemProps, b: SearchItemProps) => compareObjects(a, b, searchText, 'display_name'));
	}, [allUsesInAllClans, searchText]);

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
				display: !userMention && !!channelsSearch?.length,
				index: ACTIVE_TAB.CHANNEL
			},
			{
				title: t('Messages'),
				quantitySearch: totalResult,
				display: !!userMention || !!totalResult,
				index: ACTIVE_TAB.MESSAGES
			}
		].filter((tab) => tab?.display);
	}, [channelsSearch?.length, membersSearch?.length, searchText, t, userMention, totalResult]);

	function handelHeaderTabChange(index: number) {
		setActiveTab(index);
	}

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
		<View style={{ height: '100%', width: '100%' }}>
			<HeaderTabSearch tabList={TabList} activeTab={activeTab} onPress={handelHeaderTabChange} />
			<View>{renderContent()}</View>
		</View>
	);
}

export default React.memo(SearchMessagePage);
