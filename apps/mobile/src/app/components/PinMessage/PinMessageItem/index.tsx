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
		useAppSelector((state) => selectMessageByMessageId(state, pinMessageItem?.channelId, pinMessageItem?.messageId)) ||
		({} as IMessageWithUser);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const senderUser = useAppSelector((state) => selectMemberClanByUserId(state, pinMessageItem?.senderId || ''));

	const prioritySenderName = useMemo(() => {
		if (pinMessageItem?.senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}
		const displayName = senderUser?.user?.displayName || senderUser?.user?.username || pinMessageItem?.username || '';

		if (currentClanId === '0') {
			return displayName;
		}
		return senderUser?.clanNick || displayName;
	}, [
		pinMessageItem?.senderId,
		pinMessageItem?.username,
		senderUser?.user?.displayName,
		senderUser?.user?.username,
		senderUser?.clanNick,
		currentClanId
	]);

	const prioritySenderAvatar = useMemo(() => {
		const userAvatar = senderUser?.user?.avatarUrl || pinMessageItem?.avatar || '';
		if (currentClanId === '0') {
			return userAvatar;
		}
		return senderUser?.clanAvatar || userAvatar;
	}, [currentClanId, pinMessageItem?.avatar, senderUser?.clanAvatar, senderUser?.user?.avatarUrl]);

	const handleJumpMess = () => {
		if (pinMessageItem?.messageId && pinMessageItem?.channelId) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId,
					messageId: pinMessageItem.messageId ?? '',
					channelId: pinMessageItem.channelId ?? ''
				})
			);
		}
		if (currentClanId === '0') {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: pinMessageItem?.channelId });
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
						clanId={message?.clanId}
						channelId={message?.channelId}
						messageCreatTime={message?.createTimeSeconds}
						senderId={message?.senderId}
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
