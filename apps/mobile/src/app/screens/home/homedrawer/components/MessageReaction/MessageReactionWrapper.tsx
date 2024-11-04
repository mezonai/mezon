import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, FaceIcon } from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { EmojiDataOptionals, SenderInfoOptionals, calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { UserInformationBottomSheet } from '../../../../../../app/components/UserInformationBottomSheet';
import { IMessageReactionProps } from '../../types';
import { MessageReactionBS } from './components/MessageReactionBS';
import { style } from './styles';

export type IReactionMessageProps = {
	id: string;
	mode: number;
	clanId?: string;
	messageId: string;
	channelId: string;
	emojiId: string;
	emoji: string;
	countToRemove?: number;
	senderId: string;
	actionDelete?: boolean;
};

export const MessageReactionWrapper = React.memo(
	(props: IMessageReactionProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { message, openEmojiPicker, mode, preventAction = false, userProfile, messageReactions } = props || {};
		const [currentEmojiSelectedId, setCurrentEmojiSelectedId] = useState<string | null>(null);
		const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
		const bottomSheetRef = useRef<BottomSheetModal>(null);

		const userId = useMemo(() => userProfile?.user?.id, [userProfile?.user?.id]);

		const removeEmoji = useCallback(
			async (emojiData: EmojiDataOptionals) => {
				const { id, emoji, senders, emojiId } = emojiData;
				const countToRemove = senders?.find?.((sender) => sender.sender_id === userId)?.count;

				DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
					id: id,
					mode: mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL,
					messageId: message?.id ?? '',
					channelId: message?.channel_id ?? '',
					emojiId: emojiId ?? '',
					emoji: emoji?.trim() ?? '',
					senderId: userId ?? '',
					countToRemove: countToRemove,
					actionDelete: true
				} as IReactionMessageProps);
			},
			[message?.channel_id, message?.id, mode, userId]
		);

		const onReactItemLongPress = (emojiId: string) => {
			bottomSheetRef.current?.present();
			setCurrentEmojiSelectedId(emojiId);
		};

		const onShowUserInformation = useCallback((userId: string) => {
			bottomSheetRef.current?.close();
			setSelectedUserId(userId);
		}, []);

		const onCloseUserInformationBottomSheet = useCallback(() => {
			setSelectedUserId(null);
		}, []);

		return (
			<View style={[styles.reactionWrapper, messageReactions.length > 0 && styles.reactionSpace]}>
				{messageReactions?.map((emojiItemData: EmojiDataOptionals, index) => {
					const isMyReaction = emojiItemData?.senders?.find?.((sender: SenderInfoOptionals) => sender.sender_id === userId);

					if (calculateTotalCount(emojiItemData.senders) === 0) {
						return null;
					}
					if (!emojiItemData?.emojiId) return null;
					return (
						<Pressable
							delayLongPress={200}
							onLongPress={() => !preventAction && onReactItemLongPress(emojiItemData.emojiId)}
							onPress={() => {
								if (preventAction) return;
								DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
									id: emojiItemData.id ?? '',
									mode,
									messageId: message?.id ?? '',
									channelId: message?.channel_id ?? '',
									emojiId: emojiItemData?.emojiId ?? '',
									emoji: emojiItemData.emoji ?? '',
									senderId: userId ?? '',
									countToRemove: 1,
									actionDelete: false
								} as IReactionMessageProps);
							}}
							key={index + emojiItemData.emojiId}
							style={[styles.reactItem, isMyReaction ? styles.myReaction : styles.otherReaction]}
						>
							<FastImage
								source={{ uri: getSrcEmoji(emojiItemData.emojiId ?? '') }}
								style={styles.iconEmojiReaction}
								resizeMode={'contain'}
							/>
							<Text style={styles.reactCount}>{calculateTotalCount(emojiItemData.senders)}</Text>
						</Pressable>
					);
				})}

				{messageReactions?.length ? (
					<Pressable onPress={() => !preventAction && openEmojiPicker?.()} style={styles.addEmojiIcon}>
						<FaceIcon color={Colors.gray72} />
					</Pressable>
				) : null}

				<MessageReactionBS
					bottomSheetRef={bottomSheetRef}
					allReactionDataOnOneMessage={messageReactions}
					emojiSelectedId={currentEmojiSelectedId}
					onClose={() => setCurrentEmojiSelectedId(null)}
					removeEmoji={removeEmoji}
					onShowUserInformation={onShowUserInformation}
					userId={userId}
					channelId={message?.channel_id}
				/>

				<UserInformationBottomSheet userId={selectedUserId} onClose={onCloseUserInformationBottomSheet} />
			</View>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.message?.id + JSON.stringify(prevProps?.messageReactions) + prevProps?.userProfile?.user?.id ===
			nextProps?.message?.id + JSON.stringify(nextProps?.messageReactions) + nextProps?.userProfile?.user?.id
		);
	}
);
