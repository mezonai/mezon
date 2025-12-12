import { ACTIVE_TAB, type ETypeSearch, type IOption, type IUerMention } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import { searchMessagesActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import type { IChannel, SearchFilter } from '@mezon/utils';
import { SIZE_PAGE_SEARCH } from '@mezon/utils';
import type { RouteProp } from '@react-navigation/native';
import { createContext, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import InputSearchMessageChannel from './InputSearchMessageChannel';
import SearchMessagePage from './SearchMessagePage';
import SearchOptionPage from './SearchOptionPage';

type RootStackParamList = {
	SearchMessageChannel: {
		typeSearch: ETypeSearch;
		currentChannel: IChannel | DirectEntity;
		nameChannel?: string;
		isClearSearch?: boolean;
	};
};

type MuteThreadDetailRouteProp = RouteProp<RootStackParamList, 'SearchMessageChannel'>;
interface ISearchMessageChannelProps {
	route: MuteThreadDetailRouteProp;
}

interface ISearchMessageChannelContext {
	filtersSearch?: SearchFilter[];
	activeTab?: number;
}

const Backspace = 'Backspace';
export const SearchMessageChannelContext = createContext<ISearchMessageChannelContext>({});

const SearchMessageChannel = ({ route }: ISearchMessageChannelProps) => {
	const { currentChannel, typeSearch, nameChannel, isClearSearch } = route?.params || {};
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const [userMention, setUserMention] = useState<IUerMention>();
	const [searchText, setSearchText] = useState<string>('');
	const [isSearchMessagePage, setSearchMessagePage] = useState<boolean>(true);
	const [filtersSearch, setFiltersSearch] = useState<SearchFilter[]>();
	const [activeTab, setActiveTab] = useState<number>(ACTIVE_TAB.MEMBER);
	const [optionFilter, setOptionFilter] = useState<IOption>();
	const currentClanId = useSelector(selectCurrentClanId);

	const handleSearchText = useCallback((text: string) => {
		if (!text.length) {
			setSearchMessagePage(true);
		}
		setSearchText(text);
	}, []);

	const handleOptionFilter = useCallback((option: IOption) => {
		setOptionFilter(option);
		setUserMention(null);
		if (option) setSearchMessagePage(false);
	}, []);

	const handleSelectUserInfo = useCallback((user: IUerMention) => {
		setUserMention(user);
		setSearchMessagePage(true);
	}, []);

	const channelId = useMemo(() => {
		if (optionFilter?.value === 'channel_id' && userMention) {
			return userMention?.channel_id || userMention?.id;
		}
		return nameChannel ? currentChannel?.channel_id || currentChannel?.id : '0';
	}, [optionFilter?.value, userMention, nameChannel, currentChannel?.channel_id, currentChannel?.id]);

	const shouldSearchMessage = useMemo(() => {
		return (searchText?.trim()?.length > 0 || (optionFilter && userMention)) && channelId;
	}, [searchText, optionFilter, userMention, channelId]);

	const shouldClearSearch = useMemo(() => {
		return channelId && !searchText?.trim() && !(optionFilter && userMention);
	}, [channelId, searchText, optionFilter, userMention]);

	const handleSearchMessage = useCallback(() => {
		try {
			const filter: SearchFilter[] = [
				{ field_name: 'channel_id', field_value: channelId },
				{ field_name: 'clan_id', field_value: currentClanId }
			];

			if (optionFilter && userMention && optionFilter?.value !== 'channel_id') {
				filter.push({
					field_name: optionFilter?.value,
					field_value:
						optionFilter?.value === 'mention' ? `"user_id":"${userMention?.id}"` : userMention?.subDisplay || userMention?.display
				});
			}

			if (searchText.trim()) {
				filter.push({
					field_name: 'content',
					field_value: searchText.trim()
				});
			}

			setFiltersSearch(filter);

			dispatch(
				searchMessagesActions.fetchListSearchMessage({
					filters: filter,
					from: 1,
					size: SIZE_PAGE_SEARCH
				})
			);
		} catch (error) {
			console.error('Fetch list search message error', error);
		}
	}, [channelId, currentClanId, optionFilter, userMention, searchText]);

	useEffect(() => {
		if (shouldSearchMessage) handleSearchMessage();
	}, [shouldSearchMessage, handleSearchMessage]);

	useEffect(() => {
		if (shouldClearSearch) {
			dispatch(searchMessagesActions.clearSearchResults({ channelId }));
			setFiltersSearch([]);
		}
	}, [channelId, shouldClearSearch]);

	const handleKeyPress = useCallback(
		(e) => {
			if (e.nativeEvent.key === Backspace && !searchText.length) {
				setUserMention(null);
				setOptionFilter(null);
			}
		},
		[searchText.length]
	);

	return (
		<SearchMessageChannelContext.Provider value={{ filtersSearch, activeTab }}>
			<View style={{ flex: 1 }}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<StatusBarHeight />
				<InputSearchMessageChannel
					onKeyPress={handleKeyPress}
					optionFilter={optionFilter}
					inputValue={searchText}
					onChangeText={handleSearchText}
					onChangeOptionFilter={handleOptionFilter}
					userMention={userMention}
					nameChannel={nameChannel}
					isClearSearch={isClearSearch}
				/>
				{isSearchMessagePage ? (
					<SearchMessagePage
						userMention={userMention}
						currentChannel={currentChannel}
						nameChannel={nameChannel}
						searchText={searchText}
						typeSearch={typeSearch}
						onActiveTabChange={setActiveTab}
						channelIdFilter={channelId}
					/>
				) : (
					<SearchOptionPage
						optionFilter={optionFilter}
						currentChannel={currentChannel}
						onSelect={handleSelectUserInfo}
						searchText={searchText}
					/>
				)}
			</View>
		</SearchMessageChannelContext.Provider>
	);
};

export default memo(SearchMessageChannel);
