import { useGetPriorityNameFromUserClan } from '@mezon/core';
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
import { ChannelType, safeJSONParse } from 'mezon-js';
import { memo, useContext, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
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
	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(pinMessageItem.sender_id || '');
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

	const pinMessageAttachments = useMemo(() => {
		try {
			return safeJSONParse(pinMessageItem?.attachment || '[]') || [];
		} catch (e) {
			console.error({ e });
		}
	}, [pinMessageItem?.attachment]);

	return (
		<TouchableOpacity onPress={handleJumpMess} style={styles.pinMessageItemWrapper}>
			<MezonAvatar avatarUrl={priorityAvatar} username={namePriority}></MezonAvatar>
			<View style={styles.pinMessageItemBox}>
				<Text style={styles.pinMessageItemName}>{namePriority}</Text>
				<RenderTextMarkdownContent content={contentMessage} isEdited={false} />
				{pinMessageAttachments?.length > 0 && (
					<MessageAttachment attachments={pinMessageAttachments} clanId={message?.clan_id} channelId={message?.channel_id} />
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
