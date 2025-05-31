import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import { style } from './styles';

interface IProps {
	onPress: () => void;
	onLongPress: () => void;
	id: string;
	avatar: string;
	username: string;
	isShow: boolean;
	isAnonymous?: boolean;
}
export const AvatarMessage = React.memo(({ isShow, onPress, onLongPress, id, username, avatar, isAnonymous }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	if (isShow) {
		return (
			<Pressable onPress={onPress} onLongPress={onLongPress} style={styles.wrapperAvatar}>
				{avatar || isAnonymous ? (
					<MezonAvatar avatarUrl={avatar} username={username} />
				) : (
					<View style={styles.avatarMessageBoxDefault}>
						<Text style={styles.textAvatarMessageBoxDefault}>{username?.charAt?.(0)}</Text>
					</View>
				)}
			</Pressable>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
});
