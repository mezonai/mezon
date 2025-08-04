import { ETypeSearch, IOption, IUerMention } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { DirectEntity, searchMessagesActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { IChannel, SIZE_PAGE_SEARCH, SearchFilter } from '@mezon/utils';
import { RouteProp } from '@react-navigation/native';
import { createContext, memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
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

type SearchMessageChannelProps = {
	route: MuteThreadDetailRouteProp;
};

const Backspace = 'Backspace';

export const SearchMessageChannelContext = createContext(null);

const SearchMessageChannel = ({ route }: SearchMessageChannelProps) => {
	const { currentChannel, typeSearch, nameChannel, isClearSearch } = route?.params || {};
	const { themeValue } = useTheme();
	const [userMention, setUserMention] = useState<IUerMention>();
	const [isSearchMessagePage, setSearchMessagePage] = useState<boolean>(true);
	const currentClanId = useSelector(selectCurrentClanId);
	const [filtersSearch, setFiltersSearch] = useState<SearchFilter[]>();
	const dispatch = useAppDispatch();
	const [optionFilter, setOptionFilter] = useState<IOption>();

	const [searchText, setSearchText] = useState<string>('');
	const handleSearchText = useCallback((text) => {
		if (!text.length) {
			setSearchMessagePage(true);
		}
		setSearchText(text);
	}, []);

	const handleOptionFilter = useCallback((option) => {
		setOptionFilter(option);
		setUserMention(null);
		if (option) setSearchMessagePage(false);
	}, []);

	const handleSelectUserInfo = useCallback((user) => {
		setUserMention(user);
		setSearchMessagePage(true);
	}, []);

	useEffect(() => {
		if (nameChannel) handleSearchMessage();
	}, [searchText, userMention, nameChannel]);

	const handleSearchMessage = () => {
		const filter: SearchFilter[] = [];

		filter.push({ field_name: 'channel_id', field_value: currentChannel?.id }, { field_name: 'clan_id', field_value: currentClanId as string });

		if (optionFilter && userMention) {
			filter.push({
				field_name: optionFilter?.value,
				field_value: optionFilter?.value === 'mention' ? `"user_id":"${userMention?.id}"` : userMention?.display
			});
		}
		if (searchText?.trim()) {
			filter.push({
				field_name: 'content',
				field_value: searchText
			});
		}
		const payload = {
			filters: filter,
			from: 1,
			size: SIZE_PAGE_SEARCH
		};
		setFiltersSearch(filter);

		if ((searchText?.trim() || (optionFilter && userMention)) && !!currentChannel?.id) {
			dispatch(searchMessagesActions.setCurrentPage({ channelId: currentChannel?.id, page: 1 }));
			dispatch(searchMessagesActions.fetchListSearchMessage(payload));
		}
	};

	const handleKeyPress = useCallback(
		(e) => {
			if (e.nativeEvent.key === Backspace && !searchText?.length) {
				setUserMention(null);
				setOptionFilter(null);
			}
		},
		[searchText?.length]
	);

	return (
		<SearchMessageChannelContext.Provider value={filtersSearch}>
			<View style={{ flex: 1, backgroundColor: themeValue.primary }}>
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
						isSearchMessage={Boolean(searchText?.trim())}
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
