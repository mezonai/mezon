import type { IOption, IUerMention } from '@mezon/mobile-components';
import { ETypeSearch, debounce } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { searchMessagesActions, selectValueInputSearchMessage, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import type { SearchFilter } from '@mezon/utils';
import { SIZE_PAGE_SEARCH } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { EmptySearchPage } from '../../EmptySearchPage';
import MessagesSearchTab from '../../MessagesSearchTab';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import { SearchMessageChannelContext } from '../SearchMessageChannel';
import HeaderSearchMessageDm from './HeaderSearchMessageDm/HeaderSearchMessageDm';
import MemberListSearchDm from './MemberListSearchDm';
export enum ACTIVE_TAB {
	MESSAGES = 0,
	MEMBERS = 1
}

export default function SearchMessageDm({ navigation, route }: any) {
	const { themeValue } = useTheme();
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MESSAGES);
	const [filtersSearch, setFiltersSearch] = useState<SearchFilter[]>();
	const { currentChannel } = route?.params || {};
	const dispatch = useAppDispatch();
	const valueInputSearch = useAppSelector((state) => selectValueInputSearchMessage(state, currentChannel?.channel_id || ''));
	const keywordSearch = useRef<string>(valueInputSearch || '');
	const [optionFilter, setOptionFilter] = useState<IOption>(null);
	const [userMention, setUserMention] = useState<IUerMention>(null);

	const handleSearchMessageDm = useCallback(
		async (searchText: string) => {
			try {
				const filter = [
					{ field_name: 'channel_id', field_value: currentChannel?.channel_id || '' },
					{ field_name: 'clan_id', field_value: currentChannel?.clan_id || '' }
				];

				if (searchText?.trim()) {
					filter.push({ field_name: 'content', field_value: searchText });
					setActiveTab(ACTIVE_TAB.MESSAGES);
				}
				if (userMention && optionFilter) {
					filter.push({
						field_name: optionFilter?.value,
						field_value: optionFilter?.value === 'mention' ? `"user_id":"${userMention?.id}"` : userMention?.display
					});
				}
				setFiltersSearch(filter || []);
				const payload = {
					filters: filter,
					from: 1,
					size: SIZE_PAGE_SEARCH
				};
				await dispatch(searchMessagesActions.fetchListSearchMessage(payload));
				dispatch(searchMessagesActions.setCurrentPage({ channelId: currentChannel?.channel_id || '', page: 1 }));
			} catch (error) {
				console.error('Fetch list search message error', error);
			}
		},
		[dispatch, currentChannel?.channel_id, currentChannel?.clan_id, userMention, optionFilter]
	);

	useEffect(() => {
		if (userMention) {
			handleSearchMessageDm(keywordSearch.current);
		}
	}, [userMention]);

	const handleTextChange = useMemo(
		() =>
			debounce((searchText: string) => {
				keywordSearch.current = searchText;
				handleSearchMessageDm(searchText);
			}, 300),
		[handleSearchMessageDm]
	);

	const handleSetValueInputSearch = useCallback(
		(value: string) => {
			dispatch(searchMessagesActions.setValueInputSearch({ channelId: currentChannel?.channel_id || '', value }));
			setActiveTab(null);
		},
		[dispatch, currentChannel?.channel_id]
	);

	const onSelectOptionFilter = useCallback((option: IOption) => {
		setOptionFilter(option);
		if (option?.value) {
			setActiveTab(ACTIVE_TAB.MEMBERS);
		} else {
			setUserMention(null);
		}
	}, []);

	useEffect(() => {
		return () => {
			if (keywordSearch.current) {
				handleSetValueInputSearch(keywordSearch.current);
			}
			setFiltersSearch([]);
		};
	}, []);

	const handleSelectUserInfo = useCallback((user) => {
		setUserMention(user);
		setActiveTab(ACTIVE_TAB.MESSAGES);
	}, []);

	const renderSearchPage = () => {
		switch (activeTab) {
			case ACTIVE_TAB.MESSAGES:
				return <MessagesSearchTab typeSearch={ETypeSearch.SearchChannel} currentChannel={currentChannel} />;
			case ACTIVE_TAB.MEMBERS:
				return (
					<MemberListSearchDm
						optionFilter={optionFilter}
						currentChannel={currentChannel}
						onSelect={handleSelectUserInfo}
						searchText={keywordSearch.current}
					/>
				);
			default:
				return <EmptySearchPage />;
		}
	};

	return (
		<SearchMessageChannelContext.Provider value={{ filtersSearch }}>
			<StatusBarHeight />
			<View style={{ flex: 1 }}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<HeaderSearchMessageDm
					onChangeText={handleTextChange}
					initialSearchText={keywordSearch.current}
					onClearStoreInput={handleSetValueInputSearch}
					onSelectOptionFilter={onSelectOptionFilter}
					optionFilter={optionFilter}
					userMention={userMention}
				/>
				{renderSearchPage()}
			</View>
		</SearchMessageChannelContext.Provider>
	);
}
