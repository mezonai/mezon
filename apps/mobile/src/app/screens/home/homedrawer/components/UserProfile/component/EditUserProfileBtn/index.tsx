import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { ChannelMembersEntity, selectCurrentClanCreatorId } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN } from '../../../../../../../navigation/ScreenTypes';
import { EProfileTab } from '../../../../../../../screens/settings/ProfileSetting';
import { style } from './EditUserProfileBtn.styles';

const EditUserProfileBtn = ({ user }: { user: ChannelMembersEntity }) => {
	const { themeValue } = useTheme();
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const { t } = useTranslation('profile');
	const isClanOwner = useMemo(() => {
		return currentClanCreatorId === user?.user?.id;
	}, [currentClanCreatorId, user?.user?.id]);

	const navigateToUserProfileSetting = (profileTab: EProfileTab) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.PROFILE, params: { profileTab } });
	};

	return (
		<View style={{ flexDirection: 'row', gap: size.s_10, alignItems: 'center', justifyContent: 'space-between', marginTop: size.s_20 }}>
			<TouchableOpacity onPress={() => navigateToUserProfileSetting(EProfileTab.UserProfile)} style={styles.btn}>
				<Text style={styles.textBtn}>{t('editUser')}</Text>
			</TouchableOpacity>
			{!!isClanOwner && (
				<TouchableOpacity onPress={() => navigateToUserProfileSetting(EProfileTab.ClanProfile)} style={styles.btn}>
					<Text style={styles.textBtn}>{t('editServer')}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};
export default EditUserProfileBtn;
