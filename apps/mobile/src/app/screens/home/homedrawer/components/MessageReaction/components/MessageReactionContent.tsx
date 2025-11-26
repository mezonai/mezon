import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectMessageByMessageId, useAppSelector } from '@mezon/store-mobile';
import type { EmojiDataOptionals } from '@mezon/utils';
import { calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import { combineMessageReactions } from '../../../../../../utils/helpers';
import { style } from '../styles';
import { MessageReactionContentItem } from './MessageReactionContentItem';

interface IMessageReactionContentProps {
	allReactionDataOnOneMessage: EmojiDataOptionals[];
	emojiSelectedId: string | null;
	userId: string | null;
	removeEmoji?: (emoji: EmojiDataOptionals) => void;
	channelId?: string;
	messageId?: string;
}

type ReactionSenderItem = {
	sender_id: string;
	count: number;
};

const { width } = Dimensions.get('window');

export const MessageReactionContent = memo((props: IMessageReactionContentProps) => {
	const { emojiSelectedId, channelId, userId, removeEmoji, messageId } = props;
	const messageReactions = useAppSelector((state) => selectMessageByMessageId(state, channelId, messageId));
	const allReactionDataOnOneMessage = combineMessageReactions(messageReactions?.reactions, messageId);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');
	const [isScrollable, setIsScrollable] = useState<boolean>(false);
	const handleContentSizeChange = (contentWidth) => {
		setIsScrollable(contentWidth > width - size.s_20);
	};

	const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
	const prevReactionsRef = useRef<EmojiDataOptionals[]>([]);

	const selectEmoji = (emojiId: string) => {
		setSelectedTabId(emojiId);
	};

	useEffect(() => {
		if (emojiSelectedId) {
			setSelectedTabId(emojiSelectedId);
		}
	}, [emojiSelectedId]);

	const dataSenderEmojis = useMemo(() => {
		return (
			allReactionDataOnOneMessage?.length > 0 &&
			allReactionDataOnOneMessage.reduce((acc, item) => {
				if (item?.emojiId === selectedTabId) {
					acc.push(...(item?.senders || []));
				}
				return acc;
			}, [])
		);
	}, [allReactionDataOnOneMessage, selectedTabId]);

	const currentEmojiSelected = useMemo(() => {
		if (selectedTabId && allReactionDataOnOneMessage?.length > 0) {
			return allReactionDataOnOneMessage.find((emoji) => emoji?.emojiId === selectedTabId);
		}
		return null;
	}, [selectedTabId, allReactionDataOnOneMessage]);

	const isExistingMyEmoji = useMemo(() => {
		return currentEmojiSelected?.senders?.length > 0 && currentEmojiSelected.senders.find((sender) => sender?.sender_id === userId)?.count > 0;
	}, [currentEmojiSelected, userId]);

	const checkToFocusOtherEmoji = useCallback(() => {
		const prevSelected = prevReactionsRef.current?.length > 0 && prevReactionsRef.current?.find((e) => e?.emojiId === selectedTabId);
		const nowSelected = allReactionDataOnOneMessage?.length > 0 && allReactionDataOnOneMessage.find((e) => e?.emojiId === selectedTabId);

		if (calculateTotalCount(prevSelected?.senders || []) > 0 && calculateTotalCount(nowSelected?.senders || []) === 0) {
			const emojiDeletedIndex = prevReactionsRef.current?.findIndex((e) => e?.emojiId === selectedTabId);
			const neighbor = prevReactionsRef.current?.[emojiDeletedIndex - 1] ?? prevReactionsRef.current?.[emojiDeletedIndex + 1] ?? null;
			setSelectedTabId(neighbor?.emojiId || null);
		}
	}, [allReactionDataOnOneMessage, selectedTabId]);

	useEffect(() => {
		if (dataSenderEmojis?.length === 0 && selectedTabId) {
			checkToFocusOtherEmoji();
		}
	}, [checkToFocusOtherEmoji, dataSenderEmojis?.length]);

	useEffect(() => {
		prevReactionsRef.current = allReactionDataOnOneMessage || [];
	}, [allReactionDataOnOneMessage, selectedTabId]);

	const getTabHeader = () => {
		return (
			<FlatList
				onContentSizeChange={handleContentSizeChange}
				horizontal
				scrollEnabled={isScrollable}
				showsHorizontalScrollIndicator={false}
				data={allReactionDataOnOneMessage || []}
				keyExtractor={(item) => `${item?.emojiId}_TabHeaderEmoji`}
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={2}
				renderItem={({ item }) => (
					<Pressable
						onPress={() => selectEmoji(item?.emojiId)}
						style={[styles.tabHeaderItem, selectedTabId === item?.emojiId && styles.activeTab]}
					>
						<FastImage
							source={{
								uri: getSrcEmoji(item?.emojiId || '')
							}}
							resizeMode={'contain'}
							style={styles.iconEmojiReactionDetail}
						/>
						<Text style={[styles.reactCount, styles.headerTabCount]}>{calculateTotalCount(item?.senders || [])}</Text>
					</Pressable>
				)}
			/>
		);
	};

	const renderItem = useCallback(
		({ item }: { item: ReactionSenderItem }) => {
			return (
				<MessageReactionContentItem
					item={item}
					userId={userId}
					removeEmoji={removeEmoji}
					channelId={channelId || ''}
					currentEmojiSelected={currentEmojiSelected}
					currentClanId={messageReactions?.clan_id || ''}
				/>
			);
		},
		[userId, removeEmoji, channelId, currentEmojiSelected, messageReactions?.clan_id]
	);

	return (
		<BottomSheetScrollView stickyHeaderIndices={[0]}>
			{!!allReactionDataOnOneMessage?.length && <View style={styles.contentHeader}>{getTabHeader()}</View>}
			{allReactionDataOnOneMessage?.length ? (
				<View style={styles.contentWrapper}>
					<View style={styles.removeEmojiContainer}>
						<Text numberOfLines={1} style={styles.emojiText}>
							{currentEmojiSelected?.emoji || ''}
						</Text>
						<View style={styles.deleteEmojiWrapper}>
							{isExistingMyEmoji ? (
								<Pressable style={styles.confirmDeleteEmoji} onPress={() => removeEmoji?.(currentEmojiSelected)}>
									<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} color={baseColor.white} />
								</Pressable>
							) : null}
						</View>
					</View>
					<FlashList
						data={dataSenderEmojis || []}
						renderItem={renderItem}
						estimatedItemSize={size.s_50}
						keyExtractor={(item, index) => `${index}_${item?.sender_id}_allReactionDataOnOneMessage`}
					/>
				</View>
			) : (
				<View style={styles.noActionsWrapper}>
					<Text style={styles.noActionTitle}>{t('reactions.noActionTitle')}</Text>
					<Text style={styles.noActionContent}>{t('reactions.noActionDescription')}</Text>
				</View>
			)}
		</BottomSheetScrollView>
	);
});
