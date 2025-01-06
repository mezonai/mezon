import { useChatTypings } from '@mezon/core';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { DirectEntity } from '@mezon/store-mobile';
import LottieView from 'lottie-react-native';
import { safeJSONParse } from 'mezon-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../assets/lottie';
import { UserStatus } from '../../components/UserStatus';
import { style } from './styles';

export const TypingDmItem = React.memo(({ directMessage }: { directMessage: DirectEntity }) => {
	const { themeValue, theme } = useTheme();
	const styles = style(themeValue);
	const { typingUsers } = useChatTypings({ channelId: directMessage?.channel_id, mode: directMessage?.type, isPublic: false, isDM: true });
	const metadata = useMemo(() => {
		if (typeof directMessage.metadata?.at(0) === 'string') {
			try {
				return safeJSONParse(directMessage.metadata?.at(0) || '');
			} catch (error) {
				console.error('Error parsing JSON:', directMessage.metadata?.at(0), error);
			}
		} else if (typeof directMessage.metadata?.at(0) === 'object') {
			return directMessage.metadata?.at(0);
		}
	}, [directMessage.metadata]);

	return (
		<View>
			{typingUsers?.length > 0 ? (
				<View style={[styles.statusTyping, styles.online]}>
					<LottieView source={theme === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE} autoPlay loop style={styles.lottie} />
				</View>
			) : (
				<UserStatus status={{ status: directMessage.is_online?.some(Boolean), isMobile: false }} customStatus={metadata?.user_status} />
			)}
		</View>
	);
});
