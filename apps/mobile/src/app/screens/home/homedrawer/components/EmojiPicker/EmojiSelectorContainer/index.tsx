import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useEmojiSuggestionContext } from '@mezon/core';
import { ActionEmitEvent, debounce } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { emojiSuggestionActions, getStore, selectCurrentChannelId, selectCurrentTopicId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { FOR_SALE_CATE, IEmoji, RECENT_EMOJI_CATEGORY } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, Text, TextInput, View } from 'react-native';
import { useDispatch } from 'react-redux';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import CategoryList from './components/CategoryList';
import EmojiCategory from './components/EmojiCategory';
import { style } from './styles';

type EmojiSelectorContainerProps = {
	onSelected: (emojiId: string, shortname: string) => void;
	searchText?: string;
	isReactMessage?: boolean;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
};

export default function EmojiSelectorContainer({
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse
}: EmojiSelectorContainerProps) {
	const store = getStore();
	const { categoryEmoji, categoriesEmoji, emojis } = useEmojiSuggestionContext();
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const [keywordSearch, setKeywordSearch] = useState<string>('');
	const flatListRef = useRef(null);
	const timeoutRef = useRef<NodeJS.Timeout>(null);
	const { t } = useTranslation('message');
	const dispatch = useDispatch();

	const channelId = useMemo(() => {
		const currentDirectId = selectDmGroupCurrentId(store.getState());
		const currentChannelId = selectCurrentChannelId(store.getState() as any);
		const currentTopicId = selectCurrentTopicId(store.getState() as any);

		const channelId = currentTopicId ? currentTopicId : currentChannelId;

		return currentDirectId ? currentDirectId : channelId;
	}, []);

	const getEmojisByCategories = useMemo(
		() => (emojis: IEmoji[], categoryParam: string) => {
			if (emojis?.length === 0 || !categoryParam) {
				return [];
			}

			if (categoryParam?.toLowerCase() === FOR_SALE_CATE) {
				return emojis.filter((emoji) => emoji?.is_for_sale);
			}
			return emojis
				.filter((emoji) => !!emoji?.id && emoji?.category?.includes(categoryParam) && !emoji?.is_for_sale)
				.map((emoji) => ({
					...emoji,
					category: emoji?.category
				}));
		},
		[]
	);

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
			<MezonIconCDN icon={IconCDN.starIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.shopSparkleIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.clockIcon} color={themeValue.textStrong} />,
			...clanEmojis,
			<MezonIconCDN icon={IconCDN.reactionIcon} height={size.s_24} width={size.s_24} color={themeValue.textStrong} />,
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
			emojis: getEmojisByCategories(emojis, category)
		}));
	}, [categoriesEmoji, emojis, cateIcon]);

	const categoryRefs = useRef(
		categoriesEmoji.reduce((refs, item) => {
			refs[item] = React.createRef<View>();
			return refs;
		}, {})
	);

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
			onSelected(emojiId, emoji?.shortname);
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
		[dispatch, isReactMessage, onSelected, channelId]
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
		debounce((text) => onSearchEmoji(text), 300),
		[onSearchEmoji]
	);

	const ListCategoryArea = useCallback(() => {
		return (
			<View style={{ backgroundColor: themeValue.primary }}>
				<View style={styles.textInputWrapper}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} height={18} width={18} color={themeValue.text} />
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
	}, [themeBasic, isReactMessage, themeValue, categoriesWithIcons]);

	const data = useMemo(() => {
		if (emojisSearch?.length > 0 && keywordSearch) {
			return [
				{ id: 'listCategoryArea', name: 'listCategoryArea' },
				{
					id: 'haveResults',
					name: t('searchResult'),
					emojis: emojisSearch
				}
			];
		} else if (emojisSearch?.length === 0 && keywordSearch) {
			return [
				{ id: 'listCategoryArea', name: 'listCategoryArea' },
				{
					id: 'noResult',
					name: t('searchResult'),
					emojis: []
				}
			];
		}

		return [{ id: 'listCategoryArea', name: 'listCategoryArea' }, ...categoriesWithIcons];
	}, [emojisSearch, categoriesWithIcons]);

	const renderItem = useCallback(
		({ item, index }) => {
			if (index === 0) {
				return <ListCategoryArea />;
			} else {
				return (
					<View ref={categoryRefs?.current?.[item?.name]}>
						<EmojiCategory emojisData={item?.emojis} onEmojiSelect={handleEmojiSelect} categoryName={item?.name} />
					</View>
				);
			}
		},
		[handleEmojiSelect]
	);

	const handleSelectCategory = useCallback(
		(categoryName: string) => {
			if (!flatListRef?.current || data?.length === 0) return;
			const targetIndex = data.findIndex((item) => item?.name === categoryName);

			if (targetIndex !== -1) {
				handleBottomSheetExpand?.();

				if (timeoutRef?.current) {
					clearTimeout(timeoutRef.current);
				}
				timeoutRef.current = setTimeout(() => {
					try {
						if (flatListRef.current) {
							flatListRef.current.scrollToIndex({
								index: targetIndex,
								animated: true,
								viewPosition: 0,
								viewOffset: 120
							});
						}
					} catch (error) {
						console.warn('Scroll error:', error);
					}
				}, 300);
			}
		},
		[data]
	);
	useEffect(() => {
		return () => {
			if (timeoutRef?.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const keyExtractor = useCallback((item) => `${item.name}-emoji-panel`, []);

	return (
		<BottomSheetFlatList
			ref={flatListRef}
			data={data}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			stickyHeaderIndices={[0]}
			initialNumToRender={1}
			maxToRenderPerBatch={1}
			windowSize={2}
			removeClippedSubviews={true}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			disableVirtualization
			style={{ marginBottom: -size.s_20 }}
			contentContainerStyle={{ minHeight: '100%' }}
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
