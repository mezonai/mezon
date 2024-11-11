import { useSearchMessages } from '@mezon/core';
import {
	appActions,
	searchMessagesActions,
	selectCurrentChannel,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	selectIsSearchMessage,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectIsUseProfileDM,
	selectTheme,
	selectValueInputSearchMessage,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Platform, SIZE_PAGE_SEARCH, SearchFilter, getPlatform, searchMentionsHashtag } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionsInput, OnChangeHandlerFunc } from 'react-mentions';
import { useSelector } from 'react-redux';
import SearchMessageChannelModal from './SearchMessageChannelModal';
import SelectGroup from './SelectGroup';
import darkMentionsInputStyle from './StyleSearchMessagesDark';
import lightMentionsInputStyle from './StyleSearchMessagesLight';

import { ApiSearchMessageRequest } from 'mezon-js/api.gen';
import { UserMentionList } from '../UserMentionList';
import SelectItemUser from './SelectItemUser';
import { hasKeySearch, searchFieldName } from './constant';

type SearchMessageChannelProps = {
	mode?: ChannelStreamMode;
};

const HAS_OPTIONS = [
	{ id: 'video', display: 'video' },
	{ id: 'link', display: 'link' },
	{ id: 'image', display: 'image' }
];

const SearchMessageChannel = ({ mode }: SearchMessageChannelProps) => {
	const dispatch = useAppDispatch();
	const { fetchSearchMessages, currentPage } = useSearchMessages();

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			channelId && dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId, isShowCreateThread }));
		},
		[dispatch]
	);

	const isActive = useSelector(selectIsShowMemberList);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const appearanceTheme = useSelector(selectTheme);

	const channelId = useMemo(
		() => (mode === ChannelStreamMode.STREAM_MODE_CHANNEL ? (currentChannel?.id ?? '') : (currentDmGroupId ?? '')),
		[mode, currentChannel, currentDmGroupId]
	);

	const valueInputSearch = useSelector(selectValueInputSearchMessage(channelId));
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, channelId));

	const userListData = UserMentionList({
		channelID: channelId,
		channelMode: mode
	});

	const userListDataSearchByMention = userListData.map((user) => {
		return {
			id: user?.id ?? '',
			display: user?.username ?? '',
			avatarUrl: user?.avatarUrl ?? '',
			subDisplay: user?.display
		};
	});

	const [expanded, setExpanded] = useState(false);
	const [isShowSearchMessageModal, setIsShowSearchMessageModal] = useState(false);
	const [isShowSearchOptions, setIsShowSearchOptions] = useState('');
	const [valueDisplay, setValueDisplay] = useState<string>('');
	const [search, setSearch] = useState<any | undefined | ApiSearchMessageRequest>();
	const [isShowMemberListBefore, setIsShowMemberListBefore] = useState<boolean>(false);
	const [isShowMemberListDMBefore, setIsShowMemberListDMBefore] = useState<boolean>(false);
	const [isUseProfileDMBefore, setIsUseProfileDMBefore] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const handleInputClick = useCallback(() => {
		setIsShowMemberListBefore(isActive);
		setIsShowMemberListDMBefore(isShowMemberListDM);
		setIsUseProfileDMBefore(isUseProfileDM);
		setExpanded(true);
		if (!hasKeySearch(valueInputSearch)) {
			setIsShowSearchMessageModal(true);
		}
	}, [isActive, isShowMemberListDM, isUseProfileDM, valueInputSearch]);

	const handleOutsideClick = useCallback(
		(event: MouseEvent) => {
			const targetIsOutside = inputRef.current && !inputRef.current.contains(event.target as Node);

			if (targetIsOutside && !valueInputSearch) {
				setExpanded(false);
				setIsShowSearchMessageModal(false);
				dispatch(searchMessagesActions.setIsSearchMessage({ channelId, isSearchMessage: false }));
			}
			if (targetIsOutside && valueInputSearch) {
				setExpanded(true);
				setIsShowSearchMessageModal(false);
			}
		},
		[channelId, valueInputSearch]
	);

	const handleChange: OnChangeHandlerFunc = useCallback(
		(event, newValue, newPlainTextValue, mentions) => {
			const value = event.target.value;
			const words = value.split(' ');
			const cleanedWords = words.filter((word) => {
				const mentionPrefixes = ['from:', 'mention:', 'has:'];
				const isMentionStart = mentionPrefixes.some((prefix) => word.startsWith(prefix));
				return !isMentionStart;
			});
			const cleanedValue = cleanedWords.join(' ').trim();

			dispatch(searchMessagesActions.setValueInputSearch({ channelId, value }));
			setValueDisplay(newPlainTextValue);
			const filter: SearchFilter[] = [];
			// TODO: check logic below code
			if (cleanedValue) {
				filter.push({
					field_name: 'content',
					field_value: cleanedValue
				});
			}

			for (const mention of mentions) {
				const convertMention = mention.display.split(':');
				filter.push({
					field_name: searchFieldName?.[convertMention[0]],
					field_value: convertMention?.[0] === 'mentions' ? `"user_id":"${mention.id}"` : convertMention?.[1]
				});
			}
			setSearch({ ...search, filters: filter });
		},
		[channelId, currentClanId, search]
	);

	const clearSearchInput = useCallback(() => {
		dispatch(searchMessagesActions.setValueInputSearch({ channelId, value: '' }));
		setValueDisplay('');
	}, [channelId]);

	const resetSearchBar = useCallback(() => {
		dispatch(searchMessagesActions.setIsSearchMessage({ channelId, isSearchMessage: false }));
		dispatch(appActions.setIsShowMemberList(isShowMemberListBefore));
		dispatch(appActions.setIsShowMemberListDM(isShowMemberListDMBefore));
		dispatch(appActions.setIsUseProfileDM(isUseProfileDMBefore));
		setIsShowSearchMessageModal(false);
		setExpanded(false);
		searchRef.current?.blur();
	}, [channelId, isShowMemberListBefore, isShowMemberListDMBefore, isUseProfileDMBefore]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) => {
			if (valueInputSearch && event.key === 'Enter') {
				setIsShowSearchMessageModal(false);
				dispatch(searchMessagesActions.setIsSearchMessage({ channelId, isSearchMessage: true }));
				// TODO: check logic below code
				setIsShowCreateThread(false, currentChannel?.parrent_id !== '0' ? currentChannel?.parrent_id : currentChannel.channel_id);
				if (isActive) dispatch(appActions.setIsShowMemberList(!isActive));
				if (isShowMemberListDM) dispatch(appActions.setIsShowMemberListDM(!isShowMemberListDM));
				if (isUseProfileDM) dispatch(appActions.setIsUseProfileDM(!isUseProfileDM));
				if (search) {
					const requestFilter = [
						...(search.filters || []),
						{ field_name: 'channel_id', field_value: channelId },
						{ field_name: 'clan_id', field_value: currentClanId as string }
					];
					const requestBody = { ...search, filters: requestFilter, from: 1, size: SIZE_PAGE_SEARCH };
					fetchSearchMessages(requestBody);
				}
			}

			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				if (valueInputSearch) {
					clearSearchInput();
				} else {
					resetSearchBar();
				}
			}
		},
		[channelId, currentChannel, search, valueInputSearch, isActive, isShowMemberListDM, isUseProfileDM]
	);

	const handleClose = useCallback(() => {
		clearSearchInput();
		searchRef.current?.focus();
		if (isSearchMessage) {
			resetSearchBar();
		}
	}, [isSearchMessage, clearSearchInput, resetSearchBar]);

	const handleClickSearchOptions = useCallback(
		(value: string) => {
			dispatch(
				searchMessagesActions.setValueInputSearch({
					channelId,
					value: !valueInputSearch ? value : valueInputSearch + value
				})
			);
			searchRef.current?.focus();
		},
		[channelId, valueInputSearch]
	);

	useEffect(() => {
		if (search) {
			const requestFilter = [
				...(search.filters || []),
				{ field_name: 'channel_id', field_value: channelId },
				{ field_name: 'clan_id', field_value: currentClanId as string }
			];
			const requestBody = { ...search, filters: requestFilter, from: currentPage, size: SIZE_PAGE_SEARCH };
			fetchSearchMessages(requestBody);
		}
	}, [currentPage]);

	useEffect(() => {
		document.addEventListener('click', handleOutsideClick);
		return () => {
			document.removeEventListener('click', handleOutsideClick);
		};
	}, [handleOutsideClick]);

	const handleSearchUserMention = useCallback(
		(search: string, callback: any) => {
			callback(searchMentionsHashtag(search, userListDataSearchByMention));
		},
		[userListDataSearchByMention]
	);

	const handleSearchFocus = useCallback(
		(event: KeyboardEvent) => {
			const platform = getPlatform();
			const prefixKey = platform === Platform.MACOS ? 'metaKey' : 'ctrlKey';
			if (event[prefixKey] && (event.key === 'f' || event.key === 'F')) {
				event.preventDefault();
				searchRef?.current?.focus();
				handleInputClick();
			}
		},
		[handleInputClick]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleSearchFocus);

		return () => {
			document.removeEventListener('keydown', handleSearchFocus);
		};
	}, [handleSearchFocus]);

	return (
		<div className="relative" ref={inputRef}>
			<div
				className={`transition-all duration-300 ${
					expanded ? 'w-80' : 'w-40'
				} h-8 pl-2 pr-2 py-3 dark:bg-bgTertiary bg-bgLightTertiary rounded items-center inline-flex`}
			>
				<MentionsInput
					inputRef={searchRef}
					placeholder="Search"
					value={valueInputSearch ?? ''}
					style={appearanceTheme === 'light' ? lightMentionsInputStyle : darkMentionsInputStyle}
					onChange={handleChange}
					className="w-full mr-[10px] dark:bg-transparent bg-transparent dark:text-white text-colorTextLightMode rounded-md focus-visible:!border-0 focus-visible:!outline-none focus-visible:[&>*]:!outline-none"
					allowSpaceInQuery={true}
					singleLine={true}
					onClick={handleInputClick}
					onKeyDown={handleKeyDown}
					customSuggestionsContainer={(children: React.ReactNode) => {
						return (
							<div
								className={`absolute left-0 top-10 pb-3 ${valueInputSearch ? 'pt-0' : 'pt-3'} rounded dark:bg-bgProfileBody bg-bgLightPrimary z-[9999] w-widthModalSearch min-h-heightModalSearch shadow`}
							>
								{valueInputSearch && (
									<div className="first:mt-0 mt-3 p-3 rounded-t dark:bg-bgSecondary600 border-b border-borderDivider last:border-b-0 last:bottom-b-0">
										<div className="flex items-center justify-between">
											<div className="flex flex-row items-center flex-1 overflow-x-hidden">
												<h3 className="text-xs font-medium text-textLightTheme dark:text-textPrimary uppercase mr-1 flex-shrink-0">
													Search for:
												</h3>
												<p className="text-sm font-semibold w-full mr-[10px] whitespace-normal text-ellipsis overflow-x-hidden">
													{valueDisplay}
												</p>
											</div>
											<button className="px-1 h-5 w-10 text-xs text-textLightTheme dark:text-textPrimary font-semibold rounded bg-borderDividerLight dark:bg-borderDividerLight">
												Enter
											</button>
										</div>
									</div>
								)}
								<SelectGroup groupName="From user">{children}</SelectGroup>
							</div>
						);
					}}
				>
					<Mention
						markup="has:[__display__](__id__)"
						appendSpaceOnAdd={true}
						data={HAS_OPTIONS}
						trigger="has:"
						displayTransform={(id: string, display: string) => {
							return `has:${display}`;
						}}
						renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
							<SelectItemUser search={search} isFocused={focused} title="has: " content={suggestion.display} key={suggestion.id} />
						)}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
					/>

					<Mention
						markup="from:[__display__](__id__)"
						appendSpaceOnAdd={true}
						data={handleSearchUserMention}
						trigger="from:"
						displayTransform={(id: string, display: string) => {
							return `from:${display}`;
						}}
						renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => {
							return (
								<SelectItemUser
									search={search}
									isFocused={focused}
									title="from: "
									content={suggestion.display}
									onClick={() => setIsShowSearchOptions('')}
								/>
							);
						}}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
					/>

					<Mention
						markup="mention:[__display__](__id__)"
						appendSpaceOnAdd={true}
						data={userListDataSearchByMention}
						trigger="mentions:"
						displayTransform={(id: string, display: string) => {
							return `mentions:${display}`;
						}}
						renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => {
							return (
								<SelectItemUser
									search={search}
									isFocused={focused}
									title="mentions: "
									content={suggestion.display}
									onClick={() => setIsShowSearchOptions('')}
								/>
							);
						}}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
					/>
				</MentionsInput>
			</div>
			<div className="w-6 h-6 flex flex-row items-center pl-1 absolute right-1 bg-transparent top-1/2 transform -translate-y-1/2">
				<button
					onClick={handleInputClick}
					className={`${valueInputSearch ? 'z-0 opacity-0 rotate-0' : 'z-10 opacity-100 rotate-90'} w-4 h-4 absolute transition-transform`}
				>
					<Icons.Search className="w-4 h-4 dark:text-white text-colorTextLightMode" />
				</button>
				<button
					onClick={handleClose}
					className={`${valueInputSearch ? 'z-10 opacity-100 rotate-90' : 'z-0 opacity-0 rotate-0'} w-4 h-4 absolute transition-transform`}
				>
					<Icons.Close defaultSize="w-4 h-4" />
				</button>
			</div>
			{isShowSearchMessageModal && !hasKeySearch(valueInputSearch ?? '') && (
				<SearchMessageChannelModal
					theme={appearanceTheme}
					hasKeySearch={hasKeySearch(valueInputSearch ?? '')}
					valueInputSearch={valueInputSearch}
					valueDisplay={valueDisplay}
					isShowSearchOptions={isShowSearchOptions}
					onClickSearchOptions={handleClickSearchOptions}
				/>
			)}
		</div>
	);
};

export default memo(SearchMessageChannel);
