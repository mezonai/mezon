import { load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { selectTypingUsersById } from '@mezon/store-mobile';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../assets/lottie';
import { style } from './styles';

interface IProps {
	channelId: string;
	isDM: boolean;
	mode: ChannelStreamMode;
	isPublic: boolean;
}

export const MessageUserTyping = React.memo(({ channelId, isDM, mode, isPublic }: IProps) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const typingUsers = useSelector((state) => selectTypingUsersById(state, channelId, userId));
	const typingLabel = useMemo(() => {
		if (typingUsers?.length === 1) {
			return `${typingUsers[0].typingName} is typing...`;
		}
		if (typingUsers?.length > 1) {
			return 'Several people are typing...';
		}
		return '';
	}, [typingUsers]);

	if (!typingLabel) {
		return null;
	}
	return (
		<View style={styles.typingContainer}>
			<LottieView source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE} autoPlay loop style={styles.threeDot} />
			<Text style={styles.typingLabel} numberOfLines={1}>
				{typingLabel}
			</Text>
		</View>
	);
});
