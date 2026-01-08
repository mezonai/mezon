import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentTopicId } from '@mezon/store-mobile';
import type { EmojiDataOptionals } from '@mezon/utils';
import { calculateTotalCount, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { DeviceEventEmitter, Keyboard, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import type { IMessageReactionProps } from '../../types';
import { MessageReactionContent } from './components/MessageReactionContent';
import { ReactionItem } from './components/MessageReactionItem';
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

export const MessageReactionWrapper = React.memo((props: IMessageReactionProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { message, openEmojiPicker, mode, preventAction = false, messageReactions } = props || {};
	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.UpcomingEvent ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;

	const userId = props?.userId;
	const currentTopicId = useSelector(selectCurrentTopicId);

	const removeEmoji = useCallback(
		async (emojiData: EmojiDataOptionals) => {
			const { id, emoji, senders, emojiId } = emojiData;
			const countToRemove = senders?.find?.((sender) => sender.senderId === userId)?.count;

			DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
				id,
				mode: mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL,
				messageId: message?.id ?? '',
				channelId: message?.channelId ?? '',
				emojiId: emojiId ?? '',
				emoji: emoji?.trim() ?? '',
				senderId: message?.senderId ?? '',
				countToRemove,
				actionDelete: true,
				topicId: currentTopicId || ''
			} as IReactionMessageProps);
		},
		[mode, message?.id, message?.channelId, message?.senderId, currentTopicId, userId]
	);

	const onReactItemLongPress = useCallback(
		(emojiId: string) => {
			const data = {
				snapPoints: ['60%', '90%'],
				children: (
					<MessageReactionContent
						allReactionDataOnOneMessage={messageReactions}
						emojiSelectedId={emojiId}
						userId={userId}
						removeEmoji={removeEmoji}
						channelId={message?.channelId}
						messageId={message?.id}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			Keyboard.dismiss();
		},
		[message?.channelId, message?.id, messageReactions, removeEmoji, userId]
	);

	const renderedReactions = useMemo(() => {
		return messageReactions?.map((emojiItemData: EmojiDataOptionals) => {
			if (calculateTotalCount(emojiItemData.senders) === 0 || !emojiItemData?.emojiId) {
				return null;
			}

			return (
				<ReactionItem
					key={emojiItemData.emojiId}
					emojiItemData={emojiItemData}
					userId={userId}
					preventAction={preventAction}
					onReactItemLongPress={onReactItemLongPress}
					message={message}
					mode={mode}
					styles={styles}
					topicId={currentTopicId}
				/>
			);
		});
	}, [messageReactions, userId, preventAction, message, mode, styles, onReactItemLongPress, currentTopicId]);
	return (
		<View style={[styles.reactionWrapper, styles.reactionSpace, isMessageSystem && { paddingTop: 0, marginLeft: size.s_40 }]}>
			{!messageReactions?.length &&
				!!message?.reactions?.length &&
				message?.reactions?.map((i, idx) => {
					return <View key={`${idx}_reaction_temp`} style={[styles.imageReactionTemp]} />;
				})}
			{renderedReactions}

			{messageReactions?.length && !preventAction ? (
				<Pressable onPress={() => !preventAction && openEmojiPicker?.()} style={styles.addEmojiIcon}>
					<MezonIconCDN icon={IconCDN.faceIcon} height={size.s_20} width={size.s_20} color={baseColor.gray} />
				</Pressable>
			) : null}
		</View>
	);
});
