import { useClans } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelMembersEntity } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN } from '../../../../../../../navigation/ScreenTypes';
import { EProfileTab } from '../../../../../../../screens/settings/ProfileSetting';
import { style } from './EditUserProfileBtn.styles';

const EditUserProfileBtn = ({ user }: { user: ChannelMembersEntity }) => {
	const { themeValue } = useTheme();
	const { currentClan } = useClans();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const { t } = useTranslation('profile');
	const isClanOwner = useMemo(() => {
		return currentClan?.creator_id === user?.user?.id;
	}, [currentClan?.creator_id, user?.user?.id]);

	const navigateToUserProfileSetting = (profileTab: EProfileTab) => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.PROFILE, params: { profileTab } });
	};

	return (
		<View style={{ flexDirection: 'row', gap: size.s_10, alignItems: 'center', justifyContent: 'space-between', marginTop: size.s_20 }}>
			<TouchableOpacity onPress={() => navigateToUserProfileSetting(EProfileTab.UserProfile)} style={styles.btn}>
				<Text style={styles.textBtn}>{t('editUser')}</Text>
			</TouchableOpacity>
			{isClanOwner && (
				<TouchableOpacity onPress={() => navigateToUserProfileSetting(EProfileTab.ClanProfile)} style={styles.btn}>
					<Text style={styles.textBtn}>{t('editServer')}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};
export default EditUserProfileBtn;
