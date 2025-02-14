import { Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { selectUnreadMessageIdByChannelId, useAppSelector } from '@mezon/store';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

interface INewMessageRedLineProps {
	messageId: string;
	channelId: string;
	isEdited?: boolean;
	isSending?: boolean;
	isMe?: boolean;
}

export const NewMessageRedLine = memo((props: INewMessageRedLineProps) => {
	const { channelId = '', messageId = '', isEdited = false, isSending = false, isMe = false } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation('message');
	const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, channelId as string));
	const isUnread = useMemo(() => {
		return lastMessageUnreadId === messageId && !isEdited && !isSending && !isMe;
	}, [lastMessageUnreadId, messageId, isEdited, isSending, isMe]);

	return (
		<View style={{ alignItems: 'center' }}>
			{isUnread && (
				<View style={{ height: 1, width: '95%', backgroundColor: Colors.red, margin: size.s_10 }}>
					<View style={{ position: 'absolute', left: 0, alignItems: 'center', width: '100%' }}>
						<View style={{ paddingHorizontal: size.s_10, marginTop: -size.s_10, backgroundColor: themeValue.primary }}>
							<Text color={Colors.red} style={{ top: Platform.OS === 'ios' ? size.s_4 : 0 }}>
								{t('newMessages')}
							</Text>
						</View>
					</View>
				</View>
			)}
		</View>
	);
});
