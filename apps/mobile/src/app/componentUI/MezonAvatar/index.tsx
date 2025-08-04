import { IUserStatus } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { UserStatus } from '../../components/UserStatus';
import MezonClanAvatar from '../MezonClanAvatar';
import { style } from './styles';

interface IMezonAvatarProps {
	avatarUrl: string;
	username: string;
	width?: number;
	height?: number;
	userStatus?: IUserStatus;
	customStatus?: string;
	isBorderBoxImage?: boolean;
	stacks?: {
		avatarUrl: string;
		username: string;
	}[];
	isCountBadge?: boolean;
	countBadge?: number;
	isShow?: boolean;
	statusUserStyles?: ViewStyle;
	isMsgReply?: boolean;
}
const MezonAvatar = React.memo((props: IMezonAvatarProps) => {
	const { themeValue } = useTheme();
	const {
		avatarUrl,
		username,
		width = size.s_40,
		height = size.s_40,
		userStatus,
		customStatus,
		isBorderBoxImage,
		stacks,
		isShow = true,
		isCountBadge,
		countBadge,
		statusUserStyles,
		isMsgReply = false
	} = props;
	const styles = style(themeValue, height, width, stacks?.length);

	if (!isShow) return <View style={{ height, width }}></View>;

	if (stacks) {
		return (
			<View style={styles.listImageFriend}>
				{stacks.map((user, idx) => {
					return (
						<View key={idx} style={[styles.imageContainer, styles.borderBoxImage, { height, width }, { left: idx * 20 }]}>
							<MezonClanAvatar alt={user.username} image={user.avatarUrl} lightMode />
						</View>
					);
				})}

				{isCountBadge && (
					<View style={[styles.imageContainer, styles.borderBoxImage, { height, width }, { left: 3 * 20 }]}>
						<View style={styles.countBadge}>
							<Text style={styles.countBadgeText}>+{countBadge}</Text>
						</View>
					</View>
				)}
			</View>
		);
	}

	return (
		<View style={[styles.containerItem, { height, width }]}>
			<View style={[styles.boxImage, { height, width }, isBorderBoxImage && styles.borderBoxImage]}>
				<MezonClanAvatar alt={username} image={avatarUrl} isMsgReply={isMsgReply} lightMode />
			</View>

			{!!userStatus && <UserStatus status={userStatus} customStyles={statusUserStyles} customStatus={customStatus} />}
		</View>
	);
});

export default MezonAvatar;
