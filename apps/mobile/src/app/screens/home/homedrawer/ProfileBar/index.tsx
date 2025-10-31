import { useAuth, useMemberStatus } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';

import { selectAccountCustomStatus } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { UserStatus } from '../../../../components/UserStatus';
import { IconCDN } from '../../../../constants/icon_cdn';
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

	const handleOpenSetting = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.HOME });
	};

	return (
		<Pressable style={styles.wrapperProfile} onPress={handleOpenProfileSettings}>
			<View style={styles.profileWrapper}>
				<View>
					<View style={styles.imageWrapper}>
						<MezonClanAvatar
							alt={user?.userProfile?.user?.username || ''}
							image={createImgproxyUrl(user?.userProfile?.user?.avatar_url ?? '', { width: 150, height: 150, resizeType: 'fit' })}
						/>
					</View>
					<UserStatus status={userStatus} iconSize={size.s_10} />
				</View>
				<View style={styles.userInfo}>
					<Text style={styles.username} numberOfLines={1}>
						{user?.userProfile?.user?.display_name || user?.userProfile?.user?.username}
					</Text>
					{!!currentUserCustomStatus && (
						<Text style={styles.status} numberOfLines={1}>
							{currentUserCustomStatus}
						</Text>
					)}
				</View>
			</View>

			<TouchableOpacity style={styles.settingButton} onPress={handleOpenSetting}>
				<MezonIconCDN icon={IconCDN.settingIcon} width={24} height={24} color={themeValue.text} />
			</TouchableOpacity>
		</Pressable>
	);
};

export default memo(ProfileBar);
