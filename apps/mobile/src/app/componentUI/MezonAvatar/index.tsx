import type { IUserStatus } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import type { ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { UserStatus } from '../../components/UserStatus';
import MezonClanAvatar from '../MezonClanAvatar';
import { createPositionStyle, style } from './styles';

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
	customFontSizeAvatarCharacter?: number;
	customImageStyle?: ViewStyle;
}
const MezonAvatar = memo((props: IMezonAvatarProps) => {
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
		customFontSizeAvatarCharacter,
		customImageStyle
	} = props;
	const styles = style(themeValue, height, width, stacks?.length);

	if (!isShow) return <View style={styles.emptyView}></View>;

	if (stacks) {
		return (
			<View style={styles.listImageFriend}>
				{stacks.map((user, idx) => {
					return (
						<View
							key={idx}
							style={[styles.imageContainer, styles.borderBoxImage, styles.sizedContainer, createPositionStyle(idx), customImageStyle]}
						>
							<MezonClanAvatar
								alt={user.username}
								image={user.avatarUrl}
								customFontSizeAvatarCharacter={customFontSizeAvatarCharacter}
								lightMode
							/>
						</View>
					);
				})}

				{isCountBadge && (
					<View style={[styles.imageContainer, styles.borderBoxImage, styles.sizedContainer, createPositionStyle(3), customImageStyle]}>
						<View style={styles.countBadge}>
							<Text style={styles.countBadgeText}>+{countBadge}</Text>
						</View>
					</View>
				)}
			</View>
		);
	}

	return (
		<View style={[styles.containerItem, styles.sizedContainer]}>
			<View style={[styles.boxImage, styles.sizedContainer, isBorderBoxImage && styles.borderBoxImage, customImageStyle]}>
				<MezonClanAvatar alt={username} image={avatarUrl} customFontSizeAvatarCharacter={customFontSizeAvatarCharacter} lightMode />
			</View>

			{!!userStatus && <UserStatus status={userStatus} customStyles={statusUserStyles} customStatus={customStatus} />}
		</View>
	);
});

export default MezonAvatar;
