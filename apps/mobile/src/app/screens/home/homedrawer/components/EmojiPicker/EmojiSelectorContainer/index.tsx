import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useEmojiSuggestionContext } from '@mezon/core';
import {
	ActionEmitEvent,
	BicycleIcon,
	BowlIcon,
	HeartIcon,
	LeafIcon,
	ObjectIcon,
	PenIcon,
	RibbonIcon,
	SmilingFaceIcon,
	debounce
} from '@mezon/mobile-components';
import { Colors, Metrics, size, useTheme } from '@mezon/mobile-ui';
import { emojiSuggestionActions, getStore, selectCurrentChannelId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { IEmoji } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, TextInput, View } from 'react-native';
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
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const [keywordSearch, setKeywordSearch] = useState<string>('');
	const flatListRef = useRef(null);
	const { t } = useTranslation('message');
	const dispatch = useDispatch();

	const channelId = useMemo(() => {
		const currentDirectId = selectDmGroupCurrentId(store.getState());
		const currentChannelId = selectCurrentChannelId(store.getState() as any);

		return currentDirectId ? currentDirectId : currentChannelId;
	}, [store]);

	const getEmojisByCategories = (emojis: IEmoji[], categoryParam: string) => {
		if (emojis?.length === 0 || !categoryParam) {
			return [];
		}

		return emojis
			.filter((emoji) => !!emoji.id && emoji?.category?.includes(categoryParam))
			.map((emoji) => ({
				...emoji,
				category: categoryParam
			}));
	};

	const cateIcon = useMemo(() => {
		const clanEmojis = categoryEmoji?.length
			? categoryEmoji?.map((item) =>
					item?.clan_logo ? (
						<View style={styles.clanLogo}>
							<MezonClanAvatar alt={item?.clan_name} image={item?.clan_logo} />
						</View>
					) : (
						<PenIcon color={themeValue.textStrong} />
					)
				)
			: [];
		return [
			<MezonIconCDN icon={IconCDN.starIcon} color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.clockIcon} color={themeValue.textStrong} />,
			...clanEmojis,
			<SmilingFaceIcon height={size.s_24} width={size.s_24} color={themeValue.textStrong} />,
			<LeafIcon color={themeValue.textStrong} />,
			<BowlIcon color={themeValue.textStrong} />,
			<MezonIconCDN icon={IconCDN.gameControllerIcon} color={themeValue.textStrong} />,
			<BicycleIcon color={themeValue.textStrong} />,
			<ObjectIcon color={themeValue.textStrong} />,
			<HeartIcon color={themeValue.textStrong} />,
			<RibbonIcon color={themeValue.textStrong} />
		];
	}, [categoryEmoji, themeValue]);

	const categoriesWithIcons = useMemo(() => {
		return categoriesEmoji.map((category, index) => ({
			name: category,
			icon: cateIcon[index],
			emojis: getEmojisByCategories(emojis, category)
		}));
	}, [categoriesEmoji, emojis, store]);

	const categoryRefs = useRef(
		categoriesEmoji.reduce((refs, item) => {
			refs[item] = React.createRef<View>();
			return refs;
		}, {})
	);

	const handleEmojiSelect = useCallback(
		async (emoji: IEmoji) => {
			onSelected(emoji.id, emoji.shortname);
			handleBottomSheetCollapse?.();
			if (!isReactMessage) {
				const emojiItemName = `:${emoji.shortname?.split(':').join('')}:`;
				DeviceEventEmitter.emit(ActionEmitEvent.ADD_EMOJI_PICKED, { shortName: emojiItemName, channelId });
				dispatch(emojiSuggestionActions.setSuggestionEmojiPicked(emojiItemName));
				dispatch(
					emojiSuggestionActions.setSuggestionEmojiObjPicked({
						shortName: emojiItemName,
						id: emoji.id
					})
				);
			}
		},
		[dispatch, handleBottomSheetCollapse, isReactMessage, onSelected, channelId]
	);

	const searchEmojis = (emojis: any[], searchTerm: string) => {
		return emojis.filter((emoji) => emoji.shortname.toLowerCase().includes(searchTerm?.toLowerCase()));
	};

	const onSearchEmoji = async (keyword: string) => {
		setKeywordSearch(keyword);
		const result = searchEmojis(emojis, keyword);
		setEmojiSearch(result);
	};

	const debouncedSetSearchText = useCallback(
		debounce((text) => onSearchEmoji(text), 300),
		[]
	);

	const ListCategoryArea = () => {
		return (
			<View style={{ backgroundColor: themeBasic === 'dark' || isReactMessage ? themeValue.primary : themeValue.tertiary }}>
				<View style={styles.textInputWrapper}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} height={18} width={18} color={themeValue.text} />
					<TextInput
						onFocus={handleBottomSheetExpand}
						placeholder={t('findThePerfectReaction')}
						style={styles.textInput}
						placeholderTextColor={Colors.textGray}
						onChangeText={debouncedSetSearchText}
					/>
				</View>

				<CategoryList categoriesWithIcons={categoriesWithIcons} selectedCategory={selectedCategory} />
			</View>
		);
	};

	const data = useMemo(() => {
		if (emojisSearch?.length > 0 && keywordSearch) {
			return [
				{ id: 'listCategoryArea', name: 'listCategoryArea' },
				{
					id: 'haveResults',
					name: 'Search results',
					emojis: emojisSearch
				}
			];
		} else if (emojisSearch?.length === 0 && keywordSearch) {
			return [
				{ id: 'listCategoryArea', name: 'listCategoryArea' },
				{
					id: 'noResult',
					name: 'Search results',
					emojis: []
				}
			];
		}

		return [{ id: 'listCategoryArea', name: 'listCategoryArea' }, ...categoriesWithIcons];
	}, [emojisSearch, categoriesWithIcons]);

	const renderItem = useCallback(({ item, index }) => {
		if (index === 0) {
			return <ListCategoryArea />;
		} else {
			return (
				<View ref={categoryRefs?.current?.[item?.name]}>
					<EmojiCategory emojisData={item.emojis} onEmojiSelect={handleEmojiSelect} categoryName={item.name} />
				</View>
			);
		}
	}, []);

	const handleSelectCategory = useCallback(
		(categoryName: string) => {
			if (!flatListRef.current || !data) return;

			const targetIndex = data.findIndex((item) => item.name === categoryName);

			if (targetIndex !== -1) {
				try {
					flatListRef.current?.scrollToIndex({
						index: targetIndex,
						animated: true
					});
					setSelectedCategory(categoryName);
				} catch (error) {
					console.warn('Scroll error:', error);
				}
			}
		},
		[flatListRef, data]
	);

	useEffect(() => {
		const scrollToCategoryListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SCROLL_TO_CATEGORY_EMOJI, ({ name }) =>
			handleSelectCategory(name)
		);

		return () => {
			scrollToCategoryListener.remove();
		};
	}, [handleSelectCategory]);

	return (
		<BottomSheetFlatList
			ref={flatListRef}
			data={data}
			keyExtractor={(item) => `${item.name}-emoji-panel`}
			renderItem={renderItem}
			stickyHeaderIndices={[0]}
			initialNumToRender={1}
			maxToRenderPerBatch={1}
			windowSize={10}
			removeClippedSubviews={false}
			disableVirtualization
			contentContainerStyle={Platform.OS === 'android' && { minHeight: Metrics.screenHeight * 0.91 }}
			onScrollToIndexFailed={(info) => {
				if (info?.highestMeasuredFrameIndex) {
					const wait = new Promise((resolve) => setTimeout(resolve, 200));
					if (info.highestMeasuredFrameIndex < info.index) {
						flatListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: false });
						wait.then(() => {
							flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
						});
					}
				}
			}}
		/>
	);
}
