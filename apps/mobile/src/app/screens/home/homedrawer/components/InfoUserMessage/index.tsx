import { useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { convertTimeString, DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import ImageNative from '../../../../../components/ImageNative';
import { styles } from './styles';

interface IProps {
	onPress: () => void;
	onLongPress: () => void;
	senderDisplayName: string;
	createTime: number;
	isShow: boolean;
	messageSenderId: string;
	mode: number;
}
export const InfoUserMessage = ({ createTime, isShow, onPress, onLongPress, senderDisplayName, messageSenderId, mode }: IProps) => {
	const { t } = useTranslation(['common']);
	const userRolesClan = useColorsRoleById(messageSenderId);
	const { themeValue } = useTheme();
	const colorSenderName = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
			? userRolesClan?.highestPermissionRoleColor?.startsWith('#')
				? userRolesClan.highestPermissionRoleColor
				: themeValue.text
			: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR;
	}, [mode, themeValue.text, userRolesClan.highestPermissionRoleColor]);

	const imageRoleUrl = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
			? userRolesClan.highestPermissionRoleIcon
			: '';
	}, [mode, userRolesClan.highestPermissionRoleIcon]);

	if (isShow) {
		return (
			<TouchableOpacity activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress} style={styles.messageBoxTop}>
				<Text
					style={{ ...styles.usernameMessageBox, color: colorSenderName?.startsWith?.('#') ? colorSenderName : themeValue.text }}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{senderDisplayName}
				</Text>
				{!!imageRoleUrl && <ImageNative url={imageRoleUrl} style={styles.roleIcon} resizeMode={'contain'} />}
				<Text style={styles.dateMessageBox}>{createTime ? convertTimeString(new Date(createTime * 1000).toISOString(), t) : ''}</Text>
			</TouchableOpacity>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
};
