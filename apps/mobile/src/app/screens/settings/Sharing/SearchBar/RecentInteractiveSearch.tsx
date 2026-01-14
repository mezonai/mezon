import { size, useTheme } from '@mezon/mobile-ui';
import type { ClansEntity, DirectEntity } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Tooltip from 'react-native-walkthrough-tooltip';
import Images from '../../../../../assets/Images';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../components/ImageNative';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

export enum FilterType {
	ALL = 'all',
	USER = 'user',
	CHANNEL = 'channel'
}

interface IRecentInteractiveSearchProps {
	clans: Record<string, ClansEntity>;
	topUserSuggestionUser?: DirectEntity;
	listDMText: DirectEntity[];
	listChannelsText: DirectEntity[];
	onSearchResults: (results: DirectEntity[]) => void;
	onChannelSelected: (channel: DirectEntity | undefined) => void;
	selectedChannel?: DirectEntity;
}

export const RecentInteractiveSearch = memo(
	({
		clans,
		topUserSuggestionUser,
		listDMText,
		listChannelsText,
		onSearchResults,
		onChannelSelected,
		selectedChannel
	}: IRecentInteractiveSearchProps) => {
		const { themeValue } = useTheme();
		const { t } = useTranslation(['sharing']);
		const styles = style(themeValue);
		const [searchText, setSearchText] = useState<string>('');
		const [currentFilter, setCurrentFilter] = useState<FilterType>(FilterType.ALL);
		const [isVisibleToolTip, setIsVisibleToolTip] = useState<boolean>(false);
		const inputSearchRef = useRef<TextInput | null>(null);

		const filterOptions = useMemo(
			() => [
				{ type: FilterType.ALL, icon: IconCDN.communityIcon, label: t('all') },
				{ type: FilterType.USER, icon: IconCDN.userIcon, label: t('users') },
				{ type: FilterType.CHANNEL, icon: IconCDN.channelText, label: t('channels') }
			],
			[t]
		);

		const renderPlaceHolder = useMemo(() => {
			if (currentFilter === FilterType.ALL) {
				return t('selectChannelPlaceholder');
			}
			return currentFilter === FilterType.CHANNEL ? t('selectChannel') : t('selectUser');
		}, [currentFilter, t]);

		const groupHasCustomAvatar = useMemo(
			() => selectedChannel?.channel_avatar && !selectedChannel?.channel_avatar?.includes('avatar-group.png'),
			[selectedChannel?.channel_avatar]
		);

		const generateChannelMatch = useCallback((searchText: string, dataSource: DirectEntity[]) => {
			if (!searchText.trim()) return dataSource;

			const normalizedSearch = searchText.trim().toLowerCase();
			const matchChannels: DirectEntity[] = [];
			const matchChannelIds = new Set<string>();

			for (const channel of dataSource) {
				const channelLabel = channel?.channel_label?.toLowerCase();
				const hasUserMatch = channel?.usernames?.some?.((username: string) => username?.toLowerCase()?.includes(normalizedSearch));

				if (channelLabel?.includes(normalizedSearch) || hasUserMatch) {
					matchChannels.push(channel);
					if (channel?.channel_id) {
						matchChannelIds.add(channel.channel_id);
					}
				}
			}

			const childChannels = dataSource.filter((item) => item?.parent_id && matchChannelIds.has(item.parent_id));
			return [...matchChannels, ...childChannels];
		}, []);

		const debouncedSearch = useMemo(
			() =>
				debounce((keyword: string, filter: FilterType) => {
					let dataSource: DirectEntity[] = [];

					if (filter === FilterType.CHANNEL) {
						dataSource = listChannelsText;
					} else {
						dataSource = [
							...(topUserSuggestionUser ? [topUserSuggestionUser] : []),
							...listDMText,
							...(filter === FilterType.ALL ? listChannelsText : [])
						];
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

				if (filter === FilterType.CHANNEL) {
					dataSource = listChannelsText;
				} else {
					dataSource = [
						...(topUserSuggestionUser ? [topUserSuggestionUser] : []),
						...listDMText,
						...(filter === FilterType.ALL ? listChannelsText : [])
					];
				}

				searchText.trim() ? debouncedSearch(searchText, filter) : onSearchResults(dataSource);
				inputSearchRef?.current?.focus?.();
			},
			[debouncedSearch, listChannelsText, listDMText, onSearchResults, searchText, topUserSuggestionUser]
		);

		const handleClearSearch = useCallback(
			(hasSelected: boolean) => {
				if (hasSelected) {
					onChannelSelected(undefined);
				}
				setSearchText('');
				inputSearchRef?.current?.clear?.();
				setCurrentFilter(currentFilter);
				debouncedSearch('', currentFilter);
			},
			[currentFilter, debouncedSearch, onChannelSelected]
		);

		useEffect(() => {
			return () => {
				debouncedSearch?.cancel();
			};
		}, [debouncedSearch]);

		return (
			<View style={styles.searchInput}>
				<View style={styles.inputWrapper}>
					{selectedChannel ? (
						<View style={styles.iconLeftInput}>
							{selectedChannel?.type === ChannelType.CHANNEL_TYPE_GROUP ? (
								groupHasCustomAvatar ? (
									<View style={styles.avatarGroupImage}>
										<ImageNative
											url={createImgproxyUrl(selectedChannel?.channel_avatar ?? '')}
											style={styles.groupAvatarImage}
											resizeMode={'cover'}
										/>
									</View>
								) : (
									<FastImage source={Images.AVATAR_GROUP} style={styles.avatarGroupImage} />
								)
							) : (
								<View style={styles.avatarGroupImage}>
									<MezonClanAvatar
										image={selectedChannel?.avatars?.[0] || clans?.[selectedChannel?.clan_id]?.logo || ''}
										alt={clans?.[selectedChannel?.clan_id]?.clan_name || selectedChannel?.channel_label || ''}
										customFontSizeAvatarCharacter={size.h7}
									/>
								</View>
							)}
						</View>
					) : (
						<View style={styles.iconLeftInput}>
							<MezonIconCDN icon={IconCDN.magnifyingIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
						</View>
					)}

					{!selectedChannel && currentFilter !== FilterType.ALL && (
						<View style={styles.filterBadge}>
							<MezonIconCDN
								icon={currentFilter === FilterType.USER ? IconCDN.userIcon : IconCDN.channelText}
								width={size.s_16}
								height={size.s_16}
								color={themeValue.textStrong}
							/>
						</View>
					)}

					{selectedChannel ? (
						<Text style={styles.textChannelSelected} numberOfLines={1}>
							{selectedChannel?.channel_label || ''}
						</Text>
					) : (
						<TextInput
							ref={inputSearchRef}
							style={styles.textInput}
							onChangeText={handleSearchTextChange}
							onKeyPress={handleKeyPress}
							placeholder={renderPlaceHolder}
							placeholderTextColor={themeValue.textDisabled}
						/>
					)}

					{(selectedChannel || !!searchText?.length) && (
						<TouchableOpacity activeOpacity={0.8} onPress={() => handleClearSearch(!!selectedChannel)} style={styles.iconRightInput}>
							<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} />
						</TouchableOpacity>
					)}
				</View>

				<Tooltip
					isVisible={isVisibleToolTip}
					closeOnBackgroundInteraction
					disableShadow
					closeOnContentInteraction
					content={
						<View style={styles.tooltipContainer}>
							<Text style={styles.tooltipTitle}>{t('filterOptions')}</Text>
							{filterOptions.map((option, index) => (
								<TouchableOpacity
									key={option.type}
									style={[styles.filterOptionItem, index !== filterOptions.length - 1 && styles.tooltipUser]}
									onPress={() => handleFilterChange(option.type)}
									activeOpacity={0.8}
								>
									<MezonIconCDN icon={option.icon} width={size.s_16} height={size.s_16} color={themeValue.text} />
									<Text style={[styles.filterOptionText]}>{option.label}</Text>
								</TouchableOpacity>
							))}
						</View>
					}
					contentStyle={[styles.tooltipContent, { backgroundColor: themeValue.primary }]}
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
	}
);
