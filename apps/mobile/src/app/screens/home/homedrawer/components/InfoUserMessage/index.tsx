import { Text, useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeString } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { style } from './styles';

interface IProps {
	onPress: () => void;
	senderDisplayName: string;
	createTime: string;
	isShow: boolean;
	messageSenderId: string;
	mode: number;
}
export const InfoUserMessage = React.memo(({ createTime, isShow, onPress, senderDisplayName, messageSenderId, mode }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userRolesClan = useColorsRoleById(messageSenderId);
	const colorSenderName = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
			? userRolesClan.highestPermissionRoleColor
			: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR;
	}, [userRolesClan.highestPermissionRoleColor, mode]);

	if (isShow) {
		return (
			<TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.messageBoxTop}>
				<Text style={{ ...styles.userNameMessageBox, color: colorSenderName }}>{senderDisplayName}</Text>
				<Text style={styles.dateMessageBox}>{createTime ? convertTimeString(createTime) : ''}</Text>
			</TouchableOpacity>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
});
