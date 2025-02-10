import { Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	PinMessageEntity,
	messagesActions,
	selectCurrentClanId,
	selectMessageByMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IExtendedMessage, IMessageWithUser } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { memo, useContext, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { MessageAttachment } from '../../../screens/home/homedrawer/components/MessageAttachment';
import { RenderTextMarkdownContent } from '../../../screens/home/homedrawer/components/RenderTextMarkdown';
import { threadDetailContext } from '../../ThreadDetail/MenuThreadDetail';
import { style } from './PinMessageItem.styles';

interface IPinMessageItemProps {
	pinMessageItem: PinMessageEntity;
	handleUnpinMessage: (pinMessageItem: PinMessageEntity) => void;
	contentMessage: IExtendedMessage;
}

const PinMessageItem = memo(({ pinMessageItem, handleUnpinMessage, contentMessage }: IPinMessageItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const message =
		useAppSelector((state) => selectMessageByMessageId(state, pinMessageItem?.channel_id, pinMessageItem?.message_id)) ||
		({} as IMessageWithUser);
	const dispatch = useAppDispatch();
	const currentChannel = useContext(threadDetailContext);
	const currentClanId = useSelector(selectCurrentClanId);
	const navigation = useNavigation<any>();
	const isDmOrGroup = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	const handleJumpMess = () => {
		if (pinMessageItem.message_id && pinMessageItem.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: isDmOrGroup ? '0' : currentClanId,
					messageId: pinMessageItem.message_id ?? '',
					channelId: pinMessageItem.channel_id ?? ''
				})
			);
		}
		if (isDmOrGroup) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: pinMessageItem?.channel_id });
		} else {
			navigation.goBack();
		}
	};

	return (
		<TouchableOpacity onPress={handleJumpMess} style={styles.pinMessageItemWrapper}>
			<MezonAvatar avatarUrl={pinMessageItem?.avatar} username={pinMessageItem?.username}></MezonAvatar>
			<View style={styles.pinMessageItemBox}>
				<Text style={styles.pinMessageItemName}>{pinMessageItem?.username}</Text>
				<RenderTextMarkdownContent content={contentMessage} isEdited={false} />
				{message?.attachments?.length > 0 && (
					<MessageAttachment attachments={message?.attachments || []} senderId={message?.sender_id} createTime={message?.create_time} />
				)}
			</View>
			<View>
				<TouchableOpacity
					style={styles.pinMessageItemClose}
					onPress={() => {
						handleUnpinMessage(pinMessageItem);
					}}
				>
					<Icons.CircleXIcon color={themeValue.text} />
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
});

export default PinMessageItem;
