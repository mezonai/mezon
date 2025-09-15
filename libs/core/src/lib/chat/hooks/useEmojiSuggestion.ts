import {
	emojiSuggestionActions,
	selectAllEmojiRecent,
	selectAllEmojiSuggestion,
	selectEmojiListStatus,
	selectEmojiObjSuggestion,
	selectShiftPressedStatus,
	selectTextToSearchEmojiSuggestion,
	useAppDispatch
} from '@mezon/store';
import type { IEmoji } from '@mezon/utils';
import { getIdSaleItemFromSource } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

interface EmojiSuggestionProps {
	isMobile?: boolean;
}

const filterEmojiData = (emojis: IEmoji[]) => {
	return emojis
		.filter((emoji) => emoji.id && emoji.shortname)
		.map(({ id, src, shortname, category, is_for_sale, creator_id }) => {
			if (is_for_sale && src) {
				const idSale = getIdSaleItemFromSource(src);
				return {
					id: idSale!,
					display: shortname!,
					src,
					category,
					shortname,
					is_for_sale,
					creator_id
				};
			}
			return {
				id: id!,
				display: shortname!,
				src,
				category,
				shortname,
				is_for_sale,
				creator_id
			};
		});
};

export function useEmojiSuggestion({ isMobile = false }: EmojiSuggestionProps = {}) {
	const emojiMetadata = useSelector(selectAllEmojiSuggestion);
	const emojiConverted = useSelector(selectAllEmojiRecent);

	const emojis = useMemo(() => filterEmojiData([...(emojiMetadata || []), ...(emojiConverted || [])]), [emojiMetadata, emojiConverted]);

	const isEmojiListShowed = useSelector(selectEmojiListStatus);
	const emojiPicked = useSelector(selectEmojiObjSuggestion);

	const textToSearchEmojiSuggestion = useSelector(selectTextToSearchEmojiSuggestion);
	const shiftPressedState = useSelector(selectShiftPressedStatus);

	const dispatch = useAppDispatch();

	const setSuggestionEmojiObjPicked = useCallback(
		(emojId: string, emojiShortname: string, fromTopic?: boolean) => {
			dispatch(emojiSuggestionActions.setSuggestionEmojiObjPicked({ id: emojId, shortName: emojiShortname, fromTopic }));
		},
		[dispatch]
	);

	const setIsEmojiListShowed = useCallback(
		(isOpen: boolean) => {
			dispatch(emojiSuggestionActions.setStatusSuggestionEmojiList(isOpen));
		},
		[dispatch]
	);

	const setTextToSearchEmojiSuggesion = useCallback(
		(textSearch: string) => {
			dispatch(emojiSuggestionActions.setTextToSearchEmojiSuggestion(textSearch));
		},
		[dispatch]
	);

	const setAddEmojiActionChatbox = useCallback(
		(isAdd: boolean) => {
			dispatch(emojiSuggestionActions.setAddEmojiActionChatbox(isAdd));
		},
		[dispatch]
	);

	const setShiftPressed = useCallback(
		(isPress: boolean) => {
			dispatch(emojiSuggestionActions.setShiftPressed(isPress));
		},
		[dispatch]
	);

	const categoryEmoji = useMemo(() => {
		return emojiMetadata
			.map((emoji) => ({
				id: emoji.clan_id,
				clan_name: emoji.clan_name,
				clan_logo: emoji.logo
			}))
			.filter((emoji, index, self) => emoji.id !== '0' && index === self.findIndex((s) => s.id === emoji.id));
	}, [emojiMetadata]);

	const clanNames = useMemo(() => {
		return categoryEmoji.map((emoji) => emoji.clan_name || '');
	}, [categoryEmoji]);

	const categoriesEmoji = useMemo(() => {
		const defaultCategories = ['Recent', 'Frequency', 'People', 'Nature', 'Food', 'Activities', 'Travel', 'Objects', 'Symbols', 'Flags'];
		const mergedCategories = [...defaultCategories.slice(0, 2), ...clanNames, ...defaultCategories.slice(2)];
		return [...new Set(mergedCategories)];
	}, [clanNames]);

	return useMemo(
		() => ({
			emojiPicked,
			setIsEmojiListShowed,
			isEmojiListShowed,
			textToSearchEmojiSuggestion,
			setTextToSearchEmojiSuggesion,
			categoriesEmoji,
			categoryEmoji,
			setAddEmojiActionChatbox,
			setShiftPressed,
			shiftPressedState,
			emojis,
			emojiConverted,
			setSuggestionEmojiObjPicked
		}),
		[
			emojiPicked,
			setIsEmojiListShowed,
			isEmojiListShowed,
			textToSearchEmojiSuggestion,
			setTextToSearchEmojiSuggesion,
			setAddEmojiActionChatbox,
			setShiftPressed,
			shiftPressedState,
			emojis,
			emojiConverted,
			setSuggestionEmojiObjPicked,
			categoriesEmoji,
			categoryEmoji
		]
	);
}

export function useEmojiConverted() {
	const emojiMetadata = useSelector(selectAllEmojiRecent);
	return emojiMetadata;
}
