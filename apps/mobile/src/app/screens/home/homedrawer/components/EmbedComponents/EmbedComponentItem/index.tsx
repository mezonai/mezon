import { baseColor, useTheme } from '@mezon/mobile-ui';
import { messagesActions, selectCurrentUserId, selectDataFormEmbedByMessageId, useAppDispatch } from '@mezon/store-mobile';
import { EButtonMessageStyle, IButtonMessage } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { Linking, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './styles';

type MessageButtonProps = {
	messageId: string;
	button: IButtonMessage;
	senderId: string;
	buttonId: string;
	channelId: string;
};

export const EmbedComponentItem = memo(({ messageId, button, senderId, buttonId, channelId }: MessageButtonProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentUserId = useSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();
	const embedData = useSelector((state) => selectDataFormEmbedByMessageId(state, messageId));

	const handleClickOptions = async () => {
		if (button?.url) {
			try {
				await Linking.openURL(button.url);
			} catch (err) {
				throw new Error(err);
			}
		} else {
			const data = JSON.stringify(embedData);

			dispatch(
				messagesActions.clickButtonMessage({
					message_id: messageId,
					channel_id: channelId as string,
					button_id: buttonId,
					sender_id: senderId,
					user_id: currentUserId,
					extra_data: data || ''
				})
			);
		}
	};

	const buttonColor = useMemo(() => {
		switch (button.style) {
			case EButtonMessageStyle.PRIMARY:
				return baseColor.bgButtonPrimary;
			case EButtonMessageStyle.SECONDARY:
				return baseColor.bgButtonSecondary;
			case EButtonMessageStyle.SUCCESS:
				return baseColor.bgSuccess;
			case EButtonMessageStyle.DANGER:
				return baseColor.bgDanger;
			case EButtonMessageStyle.LINK:
				return baseColor.bgButtonSecondary;
			default:
				return baseColor.bgButtonPrimary;
		}
	}, [button.style]);

	return (
		<TouchableOpacity style={[styles.button, { backgroundColor: buttonColor }]} onPress={handleClickOptions}>
			<Text style={[styles.buttonLabel, !!button?.url && { textDecorationLine: 'underline' }]}>{button.label}</Text>
		</TouchableOpacity>
	);
});
