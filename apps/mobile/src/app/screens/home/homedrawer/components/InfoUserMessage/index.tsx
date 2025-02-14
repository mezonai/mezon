import { Text, useColorsRoleById } from '@mezon/mobile-ui';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeString } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface IProps {
	onPress: () => void;
	senderDisplayName: string;
	createTime: string;
	isShow: boolean;
	messageSenderId: string;
	mode: number;
}
export const InfoUserMessage = ({ createTime, isShow, onPress, senderDisplayName, messageSenderId, mode }: IProps) => {
	const userRolesClan = useColorsRoleById(messageSenderId);
	const colorSenderName =
		mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
			? userRolesClan.highestPermissionRoleColor
			: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR;

	if (isShow) {
		return (
			<TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.messageBoxTop}>
				<Text style={{ ...styles.usernameMessageBox, color: colorSenderName }} numberOfLines={1} ellipsizeMode="tail">
					{senderDisplayName}
				</Text>
				<Text style={styles.dateMessageBox}>{createTime ? convertTimeString(createTime) : ''}</Text>
			</TouchableOpacity>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
};
