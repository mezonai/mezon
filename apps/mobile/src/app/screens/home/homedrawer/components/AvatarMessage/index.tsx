import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Pressable, View } from 'react-native';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import { style } from './styles';

interface IProps {
	onPress: () => void;
	id: string;
	avatar: string;
	username: string;
	isShow: boolean;
}
export const AvatarMessage = React.memo(({ isShow, onPress, id, username, avatar }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	if (isShow) {
		return (
			<Pressable onPress={onPress} style={styles.wrapperAvatar}>
				<MezonAvatar avatarUrl={avatar} username={username} />
			</Pressable>
		);
	}

	return <View style={styles.wrapperAvatarCombine} />;
});
