import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { EmojiDataOptionals } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import UserProfile from '../../UserProfile';
import { style } from '../styles';
import { ReactionMember } from './ReactionMember';
type ReactionSenderItem = {
	sender_id: string;
	count: number;
};
interface IMessageReactionContentItemProps {
	item: ReactionSenderItem;
	userId: string | null;
	removeEmoji: (emoji: EmojiDataOptionals) => void;
	channelId: string;
	currentEmojiSelected?: EmojiDataOptionals;
	currentClanId: string;
}

export const MessageReactionContentItem = memo((props: IMessageReactionContentItemProps) => {
	const { item, userId, removeEmoji, channelId, currentEmojiSelected, currentClanId } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation('message');
	const styles = style(themeValue);

	const renderRightActions = useCallback(
		(item: ReactionSenderItem) => {
			if (item?.sender_id !== userId) {
				return null;
			}
			return (
				<TouchableOpacity style={styles.deleteSwipeButton} onPress={() => removeEmoji?.(currentEmojiSelected)}>
					<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} color={baseColor.white} />
					<Text style={styles.deleteSwipeText}>{t('reactions.removeActions')}</Text>
				</TouchableOpacity>
			);
		},
		[currentEmojiSelected, removeEmoji, styles.deleteSwipeButton, styles.deleteSwipeText, t, userId]
	);

	const reactionMember = (
		<ReactionMember
			userId={item?.sender_id || ''}
			currentClanId={currentClanId}
			channelId={channelId}
			count={item?.count || 0}
			onSelectUserId={() => {
				const data = {
					snapPoints: ['60%', '90%'],
					hiddenHeaderIndicator: true,
					children: <UserProfile userId={item?.sender_id || ''} showAction={true} showRole={true} currentChannel={null} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}}
		/>
	);

	return (
		<View style={styles.reactionListItem}>
			{item?.sender_id === userId ? (
				<Swipeable renderRightActions={() => renderRightActions(item)}>{reactionMember}</Swipeable>
			) : (
				<View>{reactionMember}</View>
			)}
		</View>
	);
});
