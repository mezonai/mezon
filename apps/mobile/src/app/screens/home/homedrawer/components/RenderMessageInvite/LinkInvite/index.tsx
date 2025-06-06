import { useInvite } from '@mezon/core';
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID, inviteLinkRegex, remove, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { appActions, clansActions, getStoreAsync } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from '../RenderMessageInvite.styles';

export const extractInviteIdFromUrl = (url: string): string | null => {
	const match = url?.match(inviteLinkRegex);
	return match ? match[1] : null;
};

function LinkInvite({ content }: { content: string }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { inviteUser } = useInvite();
	const navigation = useNavigation<any>();
	const inviteID = useMemo(() => extractInviteIdFromUrl(content), [content]);
	const { t } = useTranslation('linkMessageInvite');

	const handleJoinClanInvite = async () => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(true));
			const res = await inviteUser(inviteID || '');
			if (res?.clan_id) {
				requestAnimationFrame(async () => {
					navigation.navigate(APP_SCREEN.HOME);
					await remove(STORAGE_CHANNEL_CURRENT_CACHE);
					await store.dispatch(clansActions.fetchClans());
					store.dispatch(clansActions.joinClan({ clanId: res?.clan_id }));
					store.dispatch(clansActions.changeCurrentClan({ clanId: res?.clan_id }));
					save(STORAGE_CLAN_ID, res?.clan_id);
					store.dispatch(appActions.setLoadingMainMobile(false));
				});
			} else {
				Toast.show({
					type: 'error',
					text1: 'Something went wrong',
					text2: res?.statusText || 'Please try again later'
				});
				store.dispatch(appActions.setLoadingMainMobile(false));
			}
		} catch (e) {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	return (
		<View style={styles.boxLink}>
			<Text style={styles.title}>{t('title')}</Text>
			<TouchableOpacity style={styles.inviteClanBtn} onPress={handleJoinClanInvite}>
				<Text style={styles.inviteClanBtnText}>{t('join')}</Text>
			</TouchableOpacity>
		</View>
	);
}

export default React.memo(LinkInvite);
