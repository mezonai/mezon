import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useEmojiSuggestionContext } from '@mezon/core';
import { ActionEmitEvent, debounce, isEmpty } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	emojiSuggestionActions,
	getStore,
	selectAllAccount,
	selectCurrentTopicId,
	selectDmGroupCurrentId,
	selectMemberByIdAndClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { IEmoji } from '@mezon/utils';
import { FOR_SALE_CATE, RECENT_EMOJI_CATEGORY } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { Icons } from '../../../../../../componentUI/MobileIcons';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import CategoryList from './components/CategoryList';
import EmojiCategoryHeader from './components/EmojiCategoryHeader';
import EmojisPanel from './components/EmojisPanel';
import { style } from './styles';

type EmojiSelectorContainerProps = {
	onSelected: (emojiId: string, shortname: string, displayName?: string, avatarUrl?: string) => void;
	isReactMessage?: boolean;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
	currentChannelId?: string;
	clanId?: string;
};

const COLUMNS = 9;

export default function EmojiSelectorContainer({
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse,
	currentChannelId,
	clanId
}: EmojiSelectorContainerProps) {
	const store = getStore();
	const { categoryEmoji, categoriesEmoji, emojis } = useEmojiSuggestionContext();
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = useMemo(() => style(themeValue, isTabletLandscape), [themeValue, isTabletLandscape]);
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const [keywordSearch, setKeywordSearch] = useState<string>('');
	const flatListRef = useRef(null);
	const timeoutRef = useRef<any>(null);
	const { t } = useTranslation('message');
	const dispatch = useAppDispatch();
	const userProfile = useAppSelector(selectAllAccount);
	const userClanProfile = useAppSelector((state) => selectMemberByIdAndClanId(state, clanId || '', userProfile?.user?.id || ''));
	const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set([FOR_SALE_CATE]));

	const toggleCategory = useCallback((categoryName: string) => {
		setCollapsedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryName)) {
				next.delete(categoryName);
			} else {
				next.add(categoryName);
			}
			return next;
		});
	}, []);

	const senderName = useMemo(() => {
		return userClanProfile?.clan_nick || userProfile?.user?.display_name || userProfile?.user?.username || '';
	}, [userClanProfile, userProfile]);

	const senderAvatar = useMemo(() => {
		return userClanProfile?.clan_avatar || userProfile?.user?.avatar_url || '';
	}, [userClanProfile, userProfile]);

	const channelId = useMemo(() => {
		const currentDirectId = selectDmGroupCurrentId(store.getState());
		const currentTopicId = selectCurrentTopicId(store.getState() as any);

		const channelId = currentTopicId ? currentTopicId : currentChannelId;

		return currentDirectId ? currentDirectId : channelId;
	}, [currentChannelId, store]);

	const emojisByCategory = useMemo(() => {
		const map = new Map<string, IEmoji[]>();
		if (!emojis) return map;

		categoriesEmoji?.forEach((cat) => map.set(cat, []));

		for (const emoji of emojis) {
			if (!emoji?.id || emoji?.is_for_sale) continue;
			if (emoji?.category) {
				categoriesEmoji.forEach((cat) => {
					if (emoji?.category?.includes(cat)) {
						const list = map.get(cat);
						if (list) list.push(emoji);
					}
				});
			}
		}

		const forSale = emojis.filter((e) => e?.is_for_sale);
		map.set(FOR_SALE_CATE, forSale);

		return map;
	}, [emojis, categoriesEmoji]);

	const cateIcon = useMemo(() => {
		const clanEmojis = categoryEmoji?.length
			? categoryEmoji?.map((item) =>
					item?.clan_logo ? (
						<View style={styles.clanLogo}>
							<MezonClanAvatar alt={item?.clan_name} image={item?.clan_logo} />
						</View>
					) : (
						<View style={styles.clanLogoText}>
							<Text style={styles.clanNameText}>{item?.clan_name?.charAt(0)?.toUpperCase()}</Text>
						</View>
					)
				)
			: [];
		return [
			<Icons.ClockIcon color={themeValue.textStrong} width={size.s_24} height={size.s_24} />,
			<MezonIconCDN icon={IconCDN.shopSparkleIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.starIcon} color={themeValue.textStrong} />,
			...clanEmojis,
			<Icons.EmojiIcon color={themeValue.textStrong} width={size.s_20} height={size.s_20} />,
			<MezonIconCDN icon={IconCDN.leafIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.bowlIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.gameControllerIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.bicycleIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.objectIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.heartIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.redFlag} color={themeValue.textStrong} />
		];
	}, [categoryEmoji, themeValue]);

	const categoriesWithIcons = useMemo(() => {
		return categoriesEmoji.map((category, index) => ({
			name: category,
			icon: cateIcon[index],
			emojis: emojisByCategory?.get(category) || []
		}));
	}, [categoriesEmoji, cateIcon, emojisByCategory]);

	const getEmojiIdFromSrc = (src) => {
		try {
			if (!src) return '';
			return src?.split('/')?.pop().split('.')[0];
		} catch (e) {
			return '';
		}
	};
	const handleEmojiSelect = useCallback(
		async (emoji: IEmoji) => {
			const emojiId = getEmojiIdFromSrc(emoji?.src) || emoji?.id;
			onSelected(emojiId, emoji?.shortname, senderName, senderAvatar);
			handleBottomSheetCollapse?.();
			Keyboard.dismiss();
			if (!isReactMessage) {
				const emojiItemName = `:${emoji?.shortname?.split(':').join('')}:`;
				DeviceEventEmitter.emit(ActionEmitEvent.ADD_EMOJI_PICKED, { shortName: emojiItemName, channelId });
				dispatch(emojiSuggestionActions.setSuggestionEmojiPicked(emojiItemName));
				dispatch(
					emojiSuggestionActions.setSuggestionEmojiObjPicked({
						shortName: emojiItemName,
						id: emojiId
					})
				);
			}
		},
		[onSelected, senderName, senderAvatar, handleBottomSheetCollapse, isReactMessage, channelId, dispatch]
	);

	const searchEmojis = useCallback((emojis: IEmoji[], searchTerm: string) => {
		return emojis.filter(
			(emoji) => emoji?.shortname?.toLowerCase().includes(searchTerm?.toLowerCase()) && emoji?.category !== RECENT_EMOJI_CATEGORY
		);
	}, []);

	const onSearchEmoji = useCallback(
		async (keyword: string) => {
			setKeywordSearch(keyword);
			const result = searchEmojis(emojis, keyword);
			setEmojiSearch(result);
		},
		[emojis, searchEmojis]
	);

	const debouncedSetSearchText = useCallback(
		(text: string) => {
			debounce(() => onSearchEmoji(text), 300)();
		},
		[onSearchEmoji]
	);

	const flatData = useMemo(() => {
		const items = [];

		items.push({ type: 'SEARCH_AREA', id: 'SEARCH_AREA' });

		if (keywordSearch) {
			if (emojisSearch?.length > 0) {
				items.push({ type: 'HEADER_SIMPLE', id: 'HEADER_RESULTS', title: t('searchResult') });
				for (let i = 0; i < emojisSearch?.length; i += COLUMNS) {
					const chunk = emojisSearch?.slice(i, i + COLUMNS);
					if (chunk?.length < COLUMNS) {
						const paddingCount = COLUMNS - chunk?.length;
						chunk.push(...Array.from({ length: paddingCount }, (_, idx) => ({ id: `pad-${i}-${idx}`, isEmpty: true }) as any));
					}
					items.push({ type: 'ROW', id: `ROW-SEARCH-${i}`, data: chunk });
				}
			} else {
				items.push({ type: 'HEADER_SIMPLE', id: 'HEADER_NO_RESULTS', title: t('searchResult') });
				items.push({ type: 'NO_RESULT', id: 'NO_RESULT' });
			}
			return items;
		}

		const processCategory = (category: string) => {
			items.push({ type: 'HEADER', id: `HEADER-${category}`, category });

			if (!collapsedCategories.has(category)) {
				const categoryEmojis = emojisByCategory.get(category) || [];
				if (categoryEmojis?.length > 0) {
					for (let i = 0; i < categoryEmojis?.length; i += COLUMNS) {
						const chunk = categoryEmojis?.slice(i, i + COLUMNS);
						if (chunk?.length < COLUMNS) {
							const paddingCount = COLUMNS - chunk?.length;
							chunk?.push(
								...Array.from({ length: paddingCount }, (_, idx) => ({ id: `pad-${category}-${i}-${idx}`, isEmpty: true }) as any)
							);
						}
						items.push({ type: 'ROW', id: `ROW-${category}-${i}`, data: chunk });
					}
				}
			}
		};

		categoriesEmoji.forEach((category) => {
			if (isEmpty(emojisByCategory?.get(category))) return;
			processCategory(category);
		});

		return items;
	}, [keywordSearch, emojisSearch, categoriesEmoji, collapsedCategories, emojisByCategory, t]);

	const handleSelectCategory = useCallback(
		(categoryName: string) => {
			const index = flatData.findIndex((item) => item?.type === 'HEADER' && item?.category === categoryName);

			if (index !== -1) {
				handleBottomSheetExpand?.();

				setCollapsedCategories((prev) => {
					const next = new Set(prev);
					next.delete(categoryName);
					return next;
				});

				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				timeoutRef.current = setTimeout(() => {
					flatListRef.current?.scrollToIndex({
						index,
						animated: true,
						viewPosition: 0,
						viewOffset: 120
					});
				}, 100);
			}
		},
		[flatData, handleBottomSheetExpand]
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const renderItem = useCallback(
		({ item }) => {
			switch (item.type) {
				case 'SEARCH_AREA':
					return (
						<View>
							{!isReactMessage && (
								<LinearGradient
									start={{ x: 1, y: 0 }}
									end={{ x: 0, y: 0 }}
									colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
									style={[StyleSheet.absoluteFillObject]}
								/>
							)}

							<View style={styles.textInputWrapper}>
								<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
								<TextInput
									onFocus={handleBottomSheetExpand}
									placeholder={t('findThePerfectReaction')}
									style={styles.textInput}
									placeholderTextColor={themeValue.textDisabled}
									onChangeText={debouncedSetSearchText}
								/>
							</View>
							{!isReactMessage && <CategoryList categoriesWithIcons={categoriesWithIcons} setSelectedCategory={handleSelectCategory} />}
						</View>
					);
				case 'HEADER':
					return (
						<EmojiCategoryHeader
							categoryName={item?.category}
							isExpanded={!collapsedCategories.has(item?.category)}
							onToggle={() => toggleCategory(item?.category)}
						/>
					);
				case 'HEADER_SIMPLE':
					return (
						<View style={styles.categoryHeader}>
							<Text style={styles.titleCategories}>{item?.title}</Text>
						</View>
					);
				case 'ROW':
					return <EmojisPanel emojisData={item?.data} onEmojiSelect={handleEmojiSelect} styles={styles} />;
				case 'NO_RESULT':
					return null;
				default:
					return null;
			}
		},
		[
			styles,
			themeValue,
			isReactMessage,
			categoriesWithIcons,
			handleSelectCategory,
			collapsedCategories,
			toggleCategory,
			handleEmojiSelect,
			t,
			debouncedSetSearchText,
			handleBottomSheetExpand
		]
	);

	const keyExtractor = useCallback((item) => `${item?.id}-emoji-panel`, []);

	return (
		<BottomSheetFlatList
			ref={flatListRef}
			data={flatData}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			stickyHeaderIndices={[0]}
			initialNumToRender={10}
			maxToRenderPerBatch={8}
			updateCellsBatchingPeriod={16}
			windowSize={5}
			removeClippedSubviews={true}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			style={styles.flatListStyle}
			contentContainerStyle={styles.flatListContentContainer}
			onScrollToIndexFailed={(info) => {
				if (info?.highestMeasuredFrameIndex) {
					const wait = new Promise((resolve) => setTimeout(resolve, 100));
					if (info.highestMeasuredFrameIndex < info.index) {
						flatListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true });
						wait.then(() => {
							flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
						});
					}
				}
			}}
		/>
	);
}
