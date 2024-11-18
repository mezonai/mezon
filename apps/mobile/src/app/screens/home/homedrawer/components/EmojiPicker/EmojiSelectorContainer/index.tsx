import {
	ActionEmitEvent,
	BicycleIcon,
	BowlIcon,
	GameControllerIcon,
	HeartIcon,
	Icons,
	LeafIcon,
	ObjectIcon,
	PenIcon,
	RibbonIcon,
	SmilingFaceIcon,
	debounce,
	useGetEmojis
} from '@mezon/mobile-components';
import { Colors, Metrics, baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { emojiSuggestionActions, selectCurrentClan } from '@mezon/store-mobile';
import { IEmoji, getSrcEmoji } from '@mezon/utils';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import { MezonClanAvatar } from '../../../../../../componentUI';
import { style } from './styles';

type EmojiSelectorContainerProps = {
	onSelected: (emojiId: string, shortname: string) => void;
	searchText?: string;
	isReactMessage?: boolean;
	onScroll?: (e: any) => void;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
};

type DisplayByCategoriesProps = {
	readonly categoryName?: string;
	readonly onEmojiSelect: (emoji: IEmoji) => void;
	readonly onEmojiHover?: (item: any) => void;
	readonly emojisData: any[];
};

function DisplayByCategories({ emojisData, categoryName, onEmojiSelect, onEmojiHover }: DisplayByCategoriesProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const emojisByCategoryName = emojisData;

	return (
		<View style={styles.displayByCategories}>
			<Text style={styles.titleCategories}>{categoryName}</Text>
			<EmojisPanel emojisData={emojisByCategoryName} onEmojiSelect={onEmojiSelect} onEmojiHover={onEmojiHover} />
		</View>
	);
}

const EmojisPanel: React.FC<DisplayByCategoriesProps> = ({ emojisData, onEmojiSelect }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={styles.emojisPanel}>
			{emojisData.map((item, index) => {
				return (
					<TouchableOpacity style={styles.wrapperIconEmoji} key={index} onPress={() => onEmojiSelect(item)}>
						<FastImage source={{ uri: getSrcEmoji(item?.id) }} style={styles.iconEmoji} resizeMode={'contain'} />
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

export default function EmojiSelectorContainer({
	onScroll,
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse
}: EmojiSelectorContainerProps) {
	const currentClan = useAppSelector(selectCurrentClan);
	const { categoriesEmoji, categoryEmoji, emojis } = useGetEmojis(currentClan?.clan_id || '0');
	const { themeValue, theme } = useTheme();
	const styles = style(themeValue);
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const [keywordSearch, setKeywordSearch] = useState<string>('');
	const refScrollView = useRef<ScrollView>(null);
	const { t } = useTranslation('message');
	const dispatch = useDispatch();

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
			<Icons.ClockIcon color={themeValue.textStrong} />,
			...clanEmojis,
			<SmilingFaceIcon height={size.s_24} width={size.s_24} color={themeValue.textStrong} />,
			<LeafIcon color={themeValue.textStrong} />,
			<BowlIcon color={themeValue.textStrong} />,
			<GameControllerIcon color={themeValue.textStrong} />,
			<BicycleIcon color={themeValue.textStrong} />,
			<ObjectIcon color={themeValue.textStrong} />,
			<HeartIcon color={themeValue.textStrong} />,
			<RibbonIcon color={themeValue.textStrong} />
		];
	}, [themeValue]);

	const categoriesWithIcons = useMemo(
		() =>
			categoriesEmoji.map((category, index) => ({
				displayName: category === 'Custom' && currentClan?.clan_name ? currentClan?.clan_name : category,
				name: category,
				icon: cateIcon[index],
				emojis: emojis?.reduce((acc, emoji) => {
					if (emoji?.category?.includes?.(category)) {
						acc.push({
							...emoji,
							category: category
						});
					}
					return acc;
				}, [])
			})),
		[categoriesEmoji, emojis, currentClan]
	);

	const categoryRefs = useRef(
		categoriesEmoji.reduce((refs, item) => {
			refs[item] = { position: 0 };
			return refs;
		}, {})
	);

	const handleEmojiSelect = useCallback(
		async (emoji: IEmoji) => {
			onSelected(emoji.id, emoji.shortname);
			// setRecentEmoji(emoji, currentClan?.id || '0');
			handleBottomSheetCollapse?.();
			if (!isReactMessage) {
				const emojiItemName = `:${emoji.shortname?.split(':').join('')}:`;
				DeviceEventEmitter.emit(ActionEmitEvent.ADD_EMOJI_PICKED, { shortName: emojiItemName });
				dispatch(emojiSuggestionActions.setSuggestionEmojiPicked(emojiItemName));
				dispatch(
					emojiSuggestionActions.setSuggestionEmojiObjPicked({
						shortName: emojiItemName,
						id: emoji.id
					})
				);
			}
		},
		[dispatch, handleBottomSheetCollapse, isReactMessage, onSelected]
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

	return (
		<ScrollView
			ref={refScrollView}
			showsVerticalScrollIndicator={false}
			stickyHeaderIndices={[0]}
			scrollEventThrottle={16}
			onScroll={onScroll}
			style={{ height: Metrics.screenHeight / (Platform.OS === 'ios' ? 1.4 : 1.3) }}
			contentContainerStyle={{ paddingBottom: size.s_50 }}
		>
			<View style={{ backgroundColor: theme === 'dark' || isReactMessage ? themeValue.primary : themeValue.tertiary }}>
				<View style={styles.textInputWrapper}>
					<Icons.MagnifyingIcon height={18} width={18} color={themeValue.text} />
					<TextInput
						onFocus={handleBottomSheetExpand}
						placeholder={t('findThePerfectReaction')}
						style={styles.textInput}
						placeholderTextColor={Colors.textGray}
						onChangeText={debouncedSetSearchText}
					/>
				</View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.wrapperCateContainer}
					contentContainerStyle={styles.cateContainer}
				>
					{categoriesWithIcons.map((item, index) => (
						<TouchableOpacity
							key={index}
							onPress={() => {
								setSelectedCategory(item.name);
								if (categoryRefs?.current?.[item?.name]?.position) {
									refScrollView.current?.scrollTo({
										y: categoryRefs.current[item.name].position - 130,
										animated: true
									});
								}
							}}
							style={{
								...styles.cateItem,
								backgroundColor: item.name === selectedCategory ? baseColor.blurple : 'transparent'
							}}
						>
							{item.icon}
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{keywordSearch ? (
				<EmojisPanel emojisData={emojisSearch || []} onEmojiSelect={handleEmojiSelect} />
			) : (
				categoriesWithIcons.map((item, index) => {
					return (
						<View
							ref={categoryRefs.current[item.name]} // Pass the ref here
							onLayout={(event) => {
								if (categoryRefs?.current?.[item?.name]?.position !== undefined) {
									categoryRefs.current[item.name].position = event.nativeEvent.layout.y;
								}
							}}
						>
							<DisplayByCategories
								key={index + item.name?.toString()}
								emojisData={item.emojis}
								onEmojiSelect={handleEmojiSelect}
								categoryName={item.displayName}
							/>
						</View>
					);
				})
			)}
		</ScrollView>
	);
}
