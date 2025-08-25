import { size, useTheme } from '@mezon/mobile-ui';
import { ClansEntity, DirectEntity } from '@mezon/store-mobile';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Tooltip from 'react-native-walkthrough-tooltip';
import Images from '../../../../../assets/Images';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

export enum FilterType {
	ALL = 'all',
	USER = 'user',
	CHANNEL = 'channel'
}

interface FilterOptionsListProps {
	onPressOption: (filter: FilterType) => void;
	filterOptions: Array<{ type: FilterType; icon: IconCDN; label: string }>;
	themeValue: any;
	styles: any;
}

const FilterOptionsList = React.memo(({ onPressOption, filterOptions, themeValue, styles }: FilterOptionsListProps) => {
	const { t } = useTranslation(['sharing']);

	return (
		<View style={styles.tooltipContainer}>
			<Text style={styles.tooltipTitle}>{t('filterOptions')}</Text>
			{filterOptions.map((opt) => (
				<TouchableOpacity
					key={opt.type}
					style={[
						styles.filterOptionItem,
						opt.type === FilterType.USER && {
							borderBottomWidth: 1,
							borderBottomColor: themeValue.borderDim
						}
					]}
					onPress={() => onPressOption(opt.type)}
					activeOpacity={0.8}
				>
					<MezonIconCDN icon={opt.icon} width={size.s_16} height={size.s_16} color={themeValue.text} />
					<Text style={[styles.filterOptionText]}>{opt.label}</Text>
				</TouchableOpacity>
			))}
		</View>
	);
});

interface IRecentInteractiveSearch {
	clans: Record<string, ClansEntity>;
	topUserSuggestionUser?: DirectEntity;
	listDMText: DirectEntity[];
	listChannelsText: DirectEntity[];
	onSearchResults: (results: DirectEntity[]) => void;
	onChannelSelected: (channel: DirectEntity | undefined) => void;
	selectedChannel?: DirectEntity;
	placeholder?: string;
}

export const RecentInteractiveSearch = React.memo(
	({
		clans,
		topUserSuggestionUser,
		listDMText,
		listChannelsText,
		onSearchResults,
		onChannelSelected,
		selectedChannel,
		placeholder
	}: IRecentInteractiveSearch) => {
		const { themeValue } = useTheme();
		const { t } = useTranslation(['sharing']);
		const styles = useMemo(() => style(themeValue), [themeValue]);
		const [searchText, setSearchText] = useState<string>('');
		const [currentFilter, setCurrentFilter] = useState<FilterType>(FilterType.ALL);
		const [isVisibleToolTip, setIsVisibleToolTip] = useState<boolean>(false);
		const inputSearchRef = useRef<TextInput | null>(null);

		const filterOptions = useMemo(
			() => [
				{ type: FilterType.USER as const, icon: IconCDN.userIcon, label: t('users') },
				{ type: FilterType.CHANNEL as const, icon: IconCDN.channelText, label: t('channels') }
			],
			[t]
		);

		const filterLabelMap: Record<FilterType, string> = useMemo(
			() => ({
				[FilterType.ALL]: t('all'),
				[FilterType.USER]: t('users'),
				[FilterType.CHANNEL]: t('channels')
			}),
			[t]
		);

		const generateChannelMatch = useCallback((searchText: string, dataSource: DirectEntity[]) => {
			if (!searchText.trim()) return dataSource;

			const normalizedSearch = searchText.trim().toLowerCase();
			const matchChannels: DirectEntity[] = [];
			const matchChannelIds = new Set<string>();

			// Single pass to find matching channels and collect their IDs
			for (const channel of dataSource) {
				const channelLabel = channel?.channel_label?.toString()?.toLowerCase();
				// Check if channel has user information for DM channels
				const hasUserMatch = channel?.usernames?.some?.((username: string) => username?.toLowerCase()?.includes(normalizedSearch));

				const isMatch = channelLabel?.includes(normalizedSearch) || hasUserMatch;

				if (isMatch) {
					matchChannels.push(channel);
					if (channel?.channel_id) {
						matchChannelIds.add(channel.channel_id);
					}
				}
			}

			// Find child channels in a single pass
			const childChannels = dataSource.filter((item) => item?.parent_id && matchChannelIds.has(item.parent_id));

			return [...matchChannels, ...childChannels];
		}, []);

		const debouncedSearch = useMemo(
			() =>
				debounce((keyword: string, filter: FilterType) => {
					let dataSource: DirectEntity[] = [];

					if (filter === FilterType.ALL) {
						dataSource = [...(topUserSuggestionUser ? [topUserSuggestionUser] : []), ...listDMText, ...listChannelsText];
					} else if (filter === FilterType.USER) {
						dataSource = [...(topUserSuggestionUser ? [topUserSuggestionUser] : []), ...listDMText];
					} else if (filter === FilterType.CHANNEL) {
						dataSource = listChannelsText;
					}

					const matchedChannels = generateChannelMatch(keyword, dataSource);
					onSearchResults(matchedChannels);
				}, 300),
			[generateChannelMatch, onSearchResults, topUserSuggestionUser, listDMText, listChannelsText]
		);

		const handleSearchTextChange = useCallback(
			(value: string) => {
				setSearchText(value);
				debouncedSearch(value, currentFilter);
			},
			[currentFilter, debouncedSearch]
		);

		const handleKeyPress = useCallback(
			(event: any) => {
				// If input is empty and backspace is pressed, reset filter to ALL
				if (event.nativeEvent.key === 'Backspace' && !searchText.trim() && currentFilter !== FilterType.ALL) {
					setCurrentFilter(FilterType.ALL);
					debouncedSearch('', FilterType.ALL);
				}
			},
			[searchText, currentFilter, debouncedSearch]
		);

		const handleFilterChange = useCallback(
			(filter: FilterType) => {
				setCurrentFilter(filter);
				setIsVisibleToolTip(false);

				let dataSource: DirectEntity[] = [];

				if (filter === FilterType.ALL) {
					dataSource = [...(topUserSuggestionUser ? [topUserSuggestionUser] : []), ...listDMText, ...listChannelsText];
				} else if (filter === FilterType.USER) {
					dataSource = [...(topUserSuggestionUser ? [topUserSuggestionUser] : []), ...listDMText];
				} else if (filter === FilterType.CHANNEL) {
					dataSource = listChannelsText;
				}

				if (searchText.trim()) {
					debouncedSearch(searchText, filter);
				} else {
					onSearchResults(dataSource);
				}
			},
			[debouncedSearch, listChannelsText, listDMText, onSearchResults, searchText, topUserSuggestionUser]
		);

		const handleClearSelection = useCallback(() => {
			onChannelSelected(undefined);
			setSearchText('');
			inputSearchRef?.current?.focus?.();
		}, [onChannelSelected]);

		useEffect(() => {
			onSearchResults([...((topUserSuggestionUser ? [topUserSuggestionUser] : []) as DirectEntity[]), ...listDMText, ...listChannelsText]);
		}, []);

		useEffect(() => {
			return () => {
				debouncedSearch.cancel();
			};
		}, [debouncedSearch]);

		const renderInputContent = useMemo(() => {
			return (
				<View style={styles.searchInput}>
					<View style={styles.inputWrapper}>
						{selectedChannel ? (
							<View style={styles.iconLeftInput}>
								{selectedChannel?.type === ChannelType.CHANNEL_TYPE_GROUP ? (
									<FastImage
										source={Images.AVATAR_GROUP}
										style={{
											width: size.s_18,
											height: size.s_18,
											borderRadius: size.s_18
										}}
									/>
								) : (
									<MezonAvatar
										avatarUrl={selectedChannel?.channel_avatar?.[0] || clans?.[selectedChannel?.clan_id]?.logo}
										username={clans?.[selectedChannel?.clan_id]?.clan_name || selectedChannel?.channel_label}
										width={size.s_18}
										height={size.s_18}
									/>
								)}
							</View>
						) : (
							<View style={styles.iconLeftInput}>
								<MezonIconCDN icon={IconCDN.magnifyingIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
							</View>
						)}

						{currentFilter !== FilterType.ALL && !selectedChannel && (
							<View style={styles.filterBadge}>
								<Text style={styles.filterBadgeText}>{filterLabelMap[currentFilter]}</Text>
							</View>
						)}

						{selectedChannel ? (
							<Text style={styles.textChannelSelected}>{selectedChannel?.channel_label}</Text>
						) : (
							<TextInput
								ref={inputSearchRef}
								style={styles.textInput}
								onChangeText={handleSearchTextChange}
								onKeyPress={handleKeyPress}
								placeholder={placeholder || t('selectChannelPlaceholder')}
								placeholderTextColor={themeValue.textDisabled}
							/>
						)}

						{selectedChannel ? (
							<TouchableOpacity activeOpacity={0.8} onPress={handleClearSelection} style={styles.iconRightInput}>
								<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} />
							</TouchableOpacity>
						) : (
							!!searchText?.length && (
								<TouchableOpacity
									activeOpacity={0.8}
									onPress={() => {
										setSearchText('');
										inputSearchRef?.current?.clear?.();
										// Reset filter to ALL when clearing search text
										if (currentFilter !== FilterType.ALL) {
											setCurrentFilter(FilterType.ALL);
											debouncedSearch('' as string, FilterType.ALL);
										} else {
											debouncedSearch('' as string, currentFilter);
										}
									}}
									style={styles.iconRightInput}
								>
									<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} />
								</TouchableOpacity>
							)
						)}
					</View>

					<Tooltip
						isVisible={isVisibleToolTip}
						closeOnBackgroundInteraction={true}
						disableShadow={true}
						closeOnContentInteraction={true}
						content={
							<FilterOptionsList
								onPressOption={(filter) => {
									handleFilterChange(filter);
									if (inputSearchRef.current) {
										inputSearchRef.current.focus();
									}
								}}
								filterOptions={filterOptions}
								themeValue={themeValue}
								styles={styles}
							/>
						}
						contentStyle={{ minWidth: size.s_150, padding: 0, borderRadius: size.s_10, backgroundColor: themeValue.primary }}
						arrowSize={{ width: 0, height: 0 }}
						placement="bottom"
						onClose={() => setIsVisibleToolTip(false)}
						showChildInTooltip={false}
						topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
					>
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={() => {
								setIsVisibleToolTip(true);
								if (inputSearchRef.current) {
									inputSearchRef.current.focus();
								}
							}}
							style={styles.filterButton}
						>
							<MezonIconCDN icon={IconCDN.filterHorizontalIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
						</TouchableOpacity>
					</Tooltip>
				</View>
			);
		}, [
			selectedChannel,
			searchText,
			currentFilter,
			isVisibleToolTip,
			filterOptions,
			handleFilterChange,
			handleKeyPress,
			t,
			placeholder,
			themeValue,
			styles,
			clans,
			handleSearchTextChange,
			handleClearSelection
		]);

		return <View>{renderInputContent}</View>;
	}
);
