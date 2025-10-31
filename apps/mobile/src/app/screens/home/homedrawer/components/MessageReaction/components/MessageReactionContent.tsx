import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectMessageByMessageId, useAppSelector } from '@mezon/store-mobile';
import type { EmojiDataOptionals } from '@mezon/utils';
import { calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import { combineMessageReactions } from '../../../../../../utils/helpers';
import UserProfile from '../../UserProfile';
import { style } from '../styles';
import { ReactionMember } from './ReactionMember';

interface IMessageReactionContentProps {
	allReactionDataOnOneMessage: EmojiDataOptionals[];
	emojiSelectedId: string | null;
	userId: string | null;
	removeEmoji?: (emoji: EmojiDataOptionals) => void;
	channelId?: string;
	messageId?: string;
}

const { width } = Dimensions.get('window');

export const MessageReactionContent = memo((props: IMessageReactionContentProps) => {
	const { emojiSelectedId, channelId, userId, removeEmoji, messageId } = props;
	const messageReactions = useAppSelector((state) => selectMessageByMessageId(state, channelId, messageId));
	const allReactionDataOnOneMessage = combineMessageReactions(messageReactions?.reactions, messageId);
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
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={2}
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
									<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} />
									<Text style={styles.confirmText}>{t('reactions.removeActions')}</Text>
								</Pressable>
							) : (
								<Pressable onPress={() => setShowConfirmDeleteEmoji(true)}>
									<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} />
								</Pressable>
							)}
						</View>
					) : null}
				</View>
				<FlashList
					data={dataSenderEmojis}
					renderItem={({ item, index }: { item: { sender_id: string; count: number }; index: number }) => {
						return (
							<View key={`${index}_${item.sender_id}_allReactionDataOnOneMessage`} style={styles.reactionListItem}>
								<ReactionMember
									userId={item.sender_id}
									channelId={channelId}
									count={item.count}
									onSelectUserId={() => {
										const data = {
											snapPoints: ['60%', '90%'],
											hiddenHeaderIndicator: true,
											children: <UserProfile userId={item.sender_id} showAction={true} showRole={true} currentChannel={null} />
										};
										DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
									}}
								/>
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
