import { debounce } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import {
	emojiSuggestionActions,
	getStore,
	selectAllChannels,
	selectAllChannelsByUser,
	selectAllEmojiSuggestion,
	selectCurrentUserId,
	useAppDispatch
} from '@mezon/store-mobile';
import { ID_MENTION_HERE, MentionDataProps } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { FC, memo, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { removeDiacritics } from '../../utils/helpers';
import SuggestItem from './SuggestItem';
import { style } from './styles';

export interface MentionSuggestionsProps {
	keyword?: string;
	onSelect: (user: MentionDataProps) => void;
	listMentions: MentionDataProps[];
	isEphemeralMode?: boolean;
}

const Suggestions: FC<MentionSuggestionsProps> = memo(({ keyword, onSelect, listMentions, isEphemeralMode }) => {
	const styles = style();
	const [listMentionData, setListMentionData] = useState([]);
	const filteredMentions = useMemo(() => {
		if (!listMentions?.length || !keyword?.trim()) return listMentions || [];

		const search = keyword.trim();
		const searchLower = search.toLowerCase();
		const searchNorm = removeDiacritics(searchLower);

		const store = isEphemeralMode ? getStore() : null;
		const currentUserId = store ? selectCurrentUserId(store.getState()) : null;

		return listMentions
			.reduce((acc, mention) => {
				if (isEphemeralMode && (mention.id === ID_MENTION_HERE || mention.isRoleUser || mention.id === currentUserId)) {
					return acc;
				}

				const display = mention.display || '';
				const username = mention.username || '';
				const displayLower = display.toLowerCase();
				const usernameLower = username.toLowerCase();
				const displayNorm = removeDiacritics(displayLower);
				const usernameNorm = removeDiacritics(usernameLower);

				const score =
					displayLower === searchLower || usernameLower === searchLower
						? 2000
						: displayLower.startsWith(searchLower) || usernameLower.startsWith(searchLower)
							? 1900
							: displayLower.includes(searchLower) || usernameLower.includes(searchLower)
								? 1500
								: displayNorm === searchNorm || usernameNorm === searchNorm
									? 1000
									: displayNorm.startsWith(searchNorm) || usernameNorm.startsWith(searchNorm)
										? 900
										: displayNorm.includes(searchNorm) || usernameNorm.includes(searchNorm)
											? 500
											: 0;

				if (score > 0) {
					acc.push({ ...mention, score, len: display.length, name: display });
				}
				return acc;
			}, [])
			.sort((a, b) => b.score - a.score || a.len - b.len || a.display.localeCompare(b.display))
			.map(({ score, len, ...item }) => item);
	}, [listMentions, keyword, isEphemeralMode]);

	useEffect(() => {
		if (filteredMentions !== listMentionData) {
			LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
			setListMentionData(filteredMentions);
		}
	}, [filteredMentions, listMentionData]);

	const handleSuggestionPress = (user: MentionDataProps) => {
		onSelect({
			...user,
			name: user.display
		} as MentionDataProps);
	};

	return (
		<FlatList
			style={styles.flatListContainer}
			data={listMentionData}
			renderItem={({ item }) => {
				if (!item?.display) return <View />;
				return (
					<Pressable onPress={() => handleSuggestionPress(item)}>
						<SuggestItem
							isRoleUser={item?.isRoleUser}
							isDisplayDefaultAvatar={true}
							name={item?.display ?? ''}
							avatarUrl={item.avatarUrl}
							subText={item?.username}
							color={item?.color}
						/>
					</Pressable>
				);
			}}
			keyExtractor={(item, index) => `${item?.id}_${index}_mention_suggestion`}
			onEndReachedThreshold={0.1}
			keyboardShouldPersistTaps="handled"
			initialNumToRender={5}
			maxToRenderPerBatch={5}
			windowSize={15}
			updateCellsBatchingPeriod={10}
			decelerationRate={'fast'}
			disableVirtualization={true}
			removeClippedSubviews={true}
			getItemLayout={(_, index) => ({
				length: size.s_50,
				offset: size.s_50 * index,
				index
			})}
		/>
	);
});

export type ChannelsMention = {
	id: string;
	display: string;
	subText: string;
	name?: string;
};

export interface MentionHashtagSuggestionsProps {
	// readonly listChannelsMention?: ChannelsMention[];
	// channelId: string;
	keyword?: string;
	onSelect: (user: MentionDataProps) => void;
	directMessageId: string;
	mode: number;
}

const HashtagSuggestions: FC<MentionHashtagSuggestionsProps> = memo(({ keyword, onSelect, directMessageId, mode }) => {
	const styles = style();
	const channels = useSelector(selectAllChannels);
	const commonChannelDms = useSelector(selectAllChannelsByUser);
	const [channelsMentionData, setChannelsMentionData] = useState([]);
	const listChannelsMention = useMemo(() => {
		let channelsMention = [];
		LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types['easeInEaseOut'], LayoutAnimation.Properties['opacity']));
		if ([ChannelStreamMode.STREAM_MODE_DM].includes(mode)) {
			channelsMention = commonChannelDms;
		} else {
			channelsMention = channels;
		}
		return channelsMention?.map((item) => ({
			...item,
			id: item?.channelId ?? '',
			display: item?.channelLabel ?? '',
			subText: (item?.categoryName || item?.clan_name) ?? '',
			name: item?.channelLabel ?? ''
		}));
	}, [channels, commonChannelDms, mode]);

	const filterChannelsMention = debounce(() => {
		if (!listChannelsMention?.length) {
			setChannelsMentionData([]);
			return;
		}
		const filteredChannelsMention = listChannelsMention?.filter((item) => item?.name?.toLocaleLowerCase().includes(keyword?.toLocaleLowerCase()));
		setChannelsMentionData(filteredChannelsMention || []);
	}, 300);

	useEffect(() => {
		filterChannelsMention();
	}, [keyword, listChannelsMention]);

	const handleSuggestionPress = (channel: ChannelsMention) => {
		onSelect(channel);
	};

	return (
		<FlatList
			style={styles.flatListContainer}
			data={channelsMentionData}
			renderItem={({ item }) => (
				<Pressable onPress={() => handleSuggestionPress(item)}>
					<SuggestItem
						channelId={item?.id}
						channel={item}
						isDisplayDefaultAvatar={false}
						name={item?.display ?? ''}
						subText={(item as ChannelsMention).subText.toUpperCase()}
					/>
				</Pressable>
			)}
			keyExtractor={(_, index) => `${index}_hashtag_suggestion`}
			initialNumToRender={5}
			maxToRenderPerBatch={5}
			windowSize={5}
			onEndReachedThreshold={0.1}
			keyboardShouldPersistTaps="handled"
			removeClippedSubviews={true}
			getItemLayout={(_, index) => ({
				length: size.s_50,
				offset: size.s_50 * index,
				index
			})}
		/>
	);
});

export interface IEmojiSuggestionProps {
	keyword?: string;
	onSelect: (emoji: any) => void;
}

const EmojiSuggestion: FC<IEmojiSuggestionProps> = memo(({ keyword, onSelect }) => {
	const styles = style();
	const emojiListPNG = useSelector(selectAllEmojiSuggestion);
	const dispatch = useAppDispatch();
	const [formattedEmojiData, setFormattedEmojiData] = useState([]);

	const fetchEmojis = debounce(() => {
		if (!keyword) {
			setFormattedEmojiData([]);
			return;
		}
		LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types['easeInEaseOut'], LayoutAnimation.Properties['opacity']));
		const filteredListEmoji = emojiListPNG
			?.filter((emoji) => emoji?.shortname && emoji?.shortname?.indexOf(keyword?.toLowerCase()) > -1)
			?.slice(0, 20);
		setFormattedEmojiData(filteredListEmoji);
	}, 300);

	useEffect(() => {
		fetchEmojis();
	}, [keyword, emojiListPNG]);

	const getEmojiIdFromSrc = (src) => {
		try {
			if (!src) return '';
			return src?.split('/')?.pop().split('.')[0];
		} catch (e) {
			return '';
		}
	};

	const handleEmojiSuggestionPress = (emoji: any) => {
		const emojiId = getEmojiIdFromSrc(emoji?.src) || emoji?.id;

		const emojiItemName = `:${emoji?.shortname?.split?.(':')?.join('')}:`;
		onSelect({
			...emoji,
			display: emojiItemName,
			name: emojiItemName
		});
		dispatch(
			emojiSuggestionActions.setSuggestionEmojiObjPicked({
				shortName: emojiItemName,
				id: emojiId
			})
		);
	};

	return (
		<FlatList
			style={styles.flatListContainer}
			data={formattedEmojiData}
			renderItem={({ item }) => (
				<Pressable onPress={() => handleEmojiSuggestionPress(item)}>
					<SuggestItem
						isDisplayDefaultAvatar={false}
						name={`:${item?.shortname?.split?.(':')?.join('')}:` ?? ''}
						emojiId={item?.id}
						emojiSrcUnlock={item?.src}
					/>
				</Pressable>
			)}
			initialNumToRender={5}
			maxToRenderPerBatch={5}
			windowSize={5}
			onEndReachedThreshold={0.1}
			keyboardShouldPersistTaps="handled"
			keyExtractor={(_, index) => `${index}_emoji_suggestion`}
			removeClippedSubviews={true}
			getItemLayout={(_, index) => ({
				length: size.s_50,
				offset: size.s_50 * index,
				index
			})}
		/>
	);
});

export { EmojiSuggestion, HashtagSuggestions, Suggestions };

