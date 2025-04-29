import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Pressable, View } from 'react-native';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import { style } from './styles';

interface IProps {
	onPress: () => void;
	onLongPress: () => void;
	id: string;
	avatar: string;
	username: string;
	isShow: boolean;
}
export const AvatarMessage = React.memo(({ isShow, onPress, onLongPress, id, username, avatar }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	if (isShow) {
		return (
			<Pressable onPress={onPress} onLongPress={onLongPress} style={styles.wrapperAvatar}>
				<MezonAvatar avatarUrl={avatar} username={username} />
			</Pressable>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
});
