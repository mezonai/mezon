import { useTheme } from '@mezon/mobile-ui';
import type { PinMessageEntity } from '@mezon/store-mobile';
import { messagesActions, selectMemberClanByUserId, selectMessageByMessageId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import type { IExtendedMessage, IMessageWithUser } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { MessageAttachment } from '../../../screens/home/homedrawer/components/MessageAttachment';
import { RenderTextMarkdownContent } from '../../../screens/home/homedrawer/components/RenderTextMarkdown';
import { style } from './PinMessageItem.styles';

interface IPinMessageItemProps {
	pinMessageItem: PinMessageEntity;
	handleUnpinMessage: (pinMessageItem: PinMessageEntity) => void;
	contentMessage: IExtendedMessage;
	currentClanId: string;
}

const PinMessageItem = memo(({ pinMessageItem, handleUnpinMessage, contentMessage, currentClanId }: IPinMessageItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const message =
		useAppSelector((state) => selectMessageByMessageId(state, pinMessageItem?.channel_id, pinMessageItem?.message_id)) ||
		({} as IMessageWithUser);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const senderUser = useAppSelector((state) => selectMemberClanByUserId(state, pinMessageItem?.sender_id || ''));

	const prioritySenderName = useMemo(() => {
		if (pinMessageItem?.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}
		const displayName = senderUser?.user?.display_name || senderUser?.user?.username || pinMessageItem?.username || '';

		if (currentClanId === '0') {
			return displayName;
		}
		return senderUser?.clan_nick || displayName;
	}, [
		pinMessageItem?.sender_id,
		pinMessageItem?.username,
		senderUser?.user?.display_name,
		senderUser?.user?.username,
		senderUser?.clan_nick,
		currentClanId
	]);

	const prioritySenderAvatar = useMemo(() => {
		const userAvatar = senderUser?.user?.avatar_url || pinMessageItem?.avatar || '';
		if (currentClanId === '0') {
			return userAvatar;
		}
		return senderUser?.clan_avatar || userAvatar;
	}, [currentClanId, pinMessageItem?.avatar, senderUser?.clan_avatar, senderUser?.user?.avatar_url]);

	const handleJumpMess = () => {
		if (pinMessageItem?.message_id && pinMessageItem?.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId,
					messageId: pinMessageItem.message_id ?? '',
					channelId: pinMessageItem.channel_id ?? ''
				})
			);
		}
		if (currentClanId === '0') {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: pinMessageItem?.channel_id });
		} else {
			navigation.goBack();
		}
	};

	const pinMessageAttachments = useMemo(() => {
		try {
			return safeJSONParse(pinMessageItem?.attachment || '[]') || [];
		} catch (e) {
			console.error({ e });
		}
	}, [pinMessageItem?.attachment]);

	return (
		<TouchableOpacity onPress={handleJumpMess} style={styles.pinMessageItemWrapper}>
			<View style={styles.avatarWrapper}>
				<MezonClanAvatar alt={pinMessageItem?.username || ''} image={prioritySenderAvatar} />
			</View>

			<View style={styles.pinMessageItemBox}>
				<Text style={styles.pinMessageItemName}>{prioritySenderName}</Text>
				<RenderTextMarkdownContent content={contentMessage} isEdited={false} />
				{pinMessageAttachments?.length > 0 && (
					<MessageAttachment
						attachments={pinMessageAttachments}
						clanId={message?.clan_id}
						channelId={message?.channel_id}
						messageCreatTime={message?.create_time_seconds}
						senderId={message?.sender_id}
					/>
				)}
			</View>
			<View>
				<TouchableOpacity
					style={styles.pinMessageItemClose}
					onPress={() => {
						handleUnpinMessage(pinMessageItem);
					}}
				>
					<MezonIconCDN icon={IconCDN.circleXIcon} color={themeValue.text} />
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
});

export default PinMessageItem;
