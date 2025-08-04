import { useAuth, useMemberStatus } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';

import { selectAccountCustomStatus } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../../../../components/ImageNative';
import { UserStatus } from '../../../../components/UserStatus';
import { APP_SCREEN } from '../../../../navigation/ScreenTypes';
import { style } from './styles';

const ProfileBar = () => {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const styles = style(themeValue);
	const user = useAuth();
	const currentUserCustomStatus = useSelector(selectAccountCustomStatus);
	const userStatus = useMemberStatus(user?.userId || '');

	const handleOpenProfileSettings = () => {
		navigation.navigate(APP_SCREEN.PROFILE.HOME);
	};

	return (
		<Pressable style={styles.wrapperProfile} onPress={handleOpenProfileSettings}>
			<View>
				<View style={styles.imageWrapper}>
					<ImageNative
						url={createImgproxyUrl(user?.userProfile?.user?.avatar_url ?? '', { width: 150, height: 150, resizeType: 'fit' })}
						style={styles.imageWrapper}
					/>
				</View>
				<UserStatus status={userStatus} iconSize={size.s_10} />
			</View>
			<View style={styles.userInfo}>
				<Text style={styles.username}>{user?.userProfile?.user?.username}</Text>
				{!!currentUserCustomStatus && (
					<Text style={styles.status} numberOfLines={1}>
						{currentUserCustomStatus}
					</Text>
				)}
			</View>
		</Pressable>
	);
};

export default memo(ProfileBar);
