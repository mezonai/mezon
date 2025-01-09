import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TrashIcon } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { EmojiDataOptionals, calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import { style } from '../styles';
import { ReactionMember } from './ReactionMember';

interface IMessageReactionContentProps {
	allReactionDataOnOneMessage: EmojiDataOptionals[];
	emojiSelectedId: string | null;
	userId: string | null;
	removeEmoji?: (emoji: EmojiDataOptionals) => void;
	onShowUserInformation?: (userId: string) => void;
	channelId?: string;
}

const { width } = Dimensions.get('window');

export const MessageReactionContent = memo((props: IMessageReactionContentProps) => {
	const { allReactionDataOnOneMessage, emojiSelectedId, channelId, userId, onShowUserInformation, removeEmoji } = props;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');
	const [isScrollable, setIsScrollable] = useState(false);
	const handleContentSizeChange = (contentWidth) => {
		setIsScrollable(contentWidth > width - size.s_20);
	};

	const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
	const [showConfirmDeleteEmoji, setShowConfirmDeleteEmoji] = useState<boolean>(false);

	const selectEmoji = (emojiId: string) => {
		setSelectedTabId(emojiId);
		setShowConfirmDeleteEmoji(false);
	};

	useEffect(() => {
		if (emojiSelectedId) {
			setSelectedTabId(emojiSelectedId);
		}
	}, [emojiSelectedId]);

	const dataSenderEmojis = useMemo(() => {
		return allReactionDataOnOneMessage?.reduce((acc, item) => {
			if (item?.emojiId === selectedTabId) {
				acc.push(...item.senders);
			}
			return acc;
		}, []);
	}, [allReactionDataOnOneMessage, selectedTabId]);

	const currentEmojiSelected = useMemo(() => {
		if (selectedTabId) {
			return allReactionDataOnOneMessage.find((emoji) => emoji?.id === selectedTabId || emoji?.emojiId === selectedTabId);
		}
		return null;
	}, [selectedTabId, allReactionDataOnOneMessage]);

	const isExistingMyEmoji = useMemo(() => {
		return currentEmojiSelected?.senders?.find((sender) => sender?.sender_id === userId)?.count > 0;
	}, [currentEmojiSelected, userId]);

	const checkToFocusOtherEmoji = useCallback(() => {
		const areStillEmoji = currentEmojiSelected.senders.filter((sender) => sender.sender_id !== userId).some((sender) => sender.count !== 0);
		if (areStillEmoji) return;

		const emojiDeletedIndex = allReactionDataOnOneMessage.findIndex((emoji) => emoji.id === currentEmojiSelected.id);

		let nextFocusEmoji = allReactionDataOnOneMessage[emojiDeletedIndex + 1];
		if (!nextFocusEmoji) {
			nextFocusEmoji = allReactionDataOnOneMessage[emojiDeletedIndex - 1];
		}
		setSelectedTabId(nextFocusEmoji?.id || null);
	}, [allReactionDataOnOneMessage, currentEmojiSelected, userId]);

	const onRemoveEmoji = useCallback(async () => {
		await removeEmoji(currentEmojiSelected);
		checkToFocusOtherEmoji();
		setShowConfirmDeleteEmoji(false);
	}, [removeEmoji, checkToFocusOtherEmoji, currentEmojiSelected]);

	const getTabHeader = () => {
		return (
			<FlatList
				onContentSizeChange={handleContentSizeChange}
				horizontal
				scrollEnabled={isScrollable}
				showsHorizontalScrollIndicator={false}
				data={allReactionDataOnOneMessage}
				keyExtractor={(item) => `${item.emojiId}_TabHeaderEmoji`}
				renderItem={({ item }) => (
					<Pressable
						onPress={() => selectEmoji(item.emojiId)}
						style={[styles.tabHeaderItem, selectedTabId === item.emojiId && styles.activeTab]}
					>
						<FastImage
							source={{
								uri: getSrcEmoji(item.emojiId)
							}}
							resizeMode={'contain'}
							style={styles.iconEmojiReactionDetail}
						/>
						<Text style={[styles.reactCount, styles.headerTabCount]}>{calculateTotalCount(item.senders)}</Text>
					</Pressable>
				)}
			/>
		);
	};

	const getContent = () => {
		return (
			<View style={styles.contentWrapper}>
				<View style={styles.removeEmojiContainer}>
					<Text style={styles.emojiText}>{currentEmojiSelected?.emoji}</Text>
					{isExistingMyEmoji ? (
						<View>
							{showConfirmDeleteEmoji ? (
								<Pressable style={styles.confirmDeleteEmoji} onPress={() => onRemoveEmoji()}>
									<TrashIcon />
									<Text style={styles.confirmText}>{t('reactions.removeActions')}</Text>
								</Pressable>
							) : (
								<Pressable onPress={() => setShowConfirmDeleteEmoji(true)}>
									<TrashIcon />
								</Pressable>
							)}
						</View>
					) : null}
				</View>
				<FlashList
					data={dataSenderEmojis || []}
					renderItem={({ item, index }) => {
						return (
							<View key={`${index}_${item.sender_id}_allReactionDataOnOneMessage`} style={{ marginBottom: size.s_10 }}>
								<ReactionMember userId={item.sender_id} channelId={channelId} onSelectUserId={onShowUserInformation} />
							</View>
						);
					}}
					estimatedItemSize={size.s_50}
				/>
			</View>
		);
	};
	return (
		<BottomSheetScrollView stickyHeaderIndices={[0]}>
			{!!allReactionDataOnOneMessage?.length && <View style={styles.contentHeader}>{getTabHeader()}</View>}
			{allReactionDataOnOneMessage?.length ? (
				<View>{getContent()}</View>
			) : (
				<View style={styles.noActionsWrapper}>
					<Text style={styles.noActionTitle}>{t('reactions.noActionTitle')}</Text>
					<Text style={styles.noActionContent}>{t('reactions.noActionDescription')}</Text>
				</View>
			)}
		</BottomSheetScrollView>
	);
});
