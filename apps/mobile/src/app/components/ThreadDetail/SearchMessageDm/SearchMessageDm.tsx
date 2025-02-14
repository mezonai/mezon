import { debounce, ETypeSearch } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { searchMessagesActions, selectTotalResultSearchMessage, useAppDispatch } from '@mezon/store-mobile';
import { SearchFilter, SIZE_PAGE_SEARCH } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { EmptySearchPage } from '../../EmptySearchPage';
import MessagesSearchTab from '../../MessagesSearchTab';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import { SearchMessageChannelContext } from '../SearchMessageChannel';
import HeaderTabSearch from '../SearchMessageChannel/SearchMessagePage/HeaderTabSearch';
import HeaderSearchMessageDm from './HeaderSearchMessageDm/HeaderSearchMessageDm';
export enum ACTIVE_TAB {
	MESSAGES = 0
}

export default function SearchMessageDm({ navigation, route }: any) {
	const { themeValue } = useTheme();
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MESSAGES);
	const handelHeaderTabChange = useCallback((index: number) => {
		setActiveTab(index);
	}, []);
	const [filtersSearch, setFiltersSearch] = useState<SearchFilter[]>();
	const totalResult = useSelector(selectTotalResultSearchMessage);

	const { currentChannel } = route?.params || {};
	const dispatch = useAppDispatch();

	useEffect(() => {
		setFiltersSearch([]);
		handleSearchMessageDm('');
	}, []);

	const TabList = useMemo(
		() =>
			[
				{
					title: 'Messages',
					quantitySearch: totalResult && totalResult,
					display: !!totalResult,
					index: ACTIVE_TAB?.MESSAGES
				}
			].filter((tab) => tab?.display),
		[totalResult]
	);
	const handleTextChange = useCallback(
		debounce((searchText) => {
			handleSearchMessageDm(searchText);
		}, 200),
		[]
	);

	const handleSearchMessageDm = async (searchText: string) => {
		const filter = [
			{
				field_name: 'content',
				field_value: searchText
			},
			{ field_name: 'channel_id', field_value: currentChannel?.channel_id },
			{ field_name: 'clan_id', field_value: currentChannel?.clan_id }
		];
		setFiltersSearch(filter || []);
		const payload = {
			filters: filter,
			from: 1,
			size: SIZE_PAGE_SEARCH
		};
		await dispatch(searchMessagesActions.fetchListSearchMessage(payload));
		await dispatch(searchMessagesActions.setCurrentPage(1));
	};

	const renderSearchPage = () => {
		switch (activeTab) {
			case ACTIVE_TAB.MESSAGES:
				return <MessagesSearchTab typeSearch={ETypeSearch.SearchChannel} currentChannel={currentChannel} />;
			default:
				return <EmptySearchPage />;
		}
	};

	useEffect(() => {
		setActiveTab(TabList[0]?.index);
	}, [TabList]);

	return (
		<SearchMessageChannelContext.Provider value={filtersSearch}>
			<StatusBarHeight />
			<View style={{ width: '100%', height: '100%', backgroundColor: themeValue.primary }}>
				<HeaderSearchMessageDm onChangeText={handleTextChange} />
				<HeaderTabSearch tabList={TabList} activeTab={activeTab} onPress={handelHeaderTabChange} />
				{renderSearchPage()}
			</View>
		</SearchMessageChannelContext.Provider>
	);
}
