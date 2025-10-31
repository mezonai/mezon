import { useInvite } from '@mezon/core';
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID, remove, save } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { appActions, clansActions, getStoreAsync, inviteActions, selectInviteById, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ImageNative from '../../components/ImageNative';
import { IconCDN } from '../../constants/icon_cdn';
import useCheckClanLimit from '../../hooks/useCheckClanLimit';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

const InviteClanScreen = ({ route }: { route: any }) => {
	const code = route?.params?.code;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('linkMessageInvite');
	const selectInvite = useAppSelector(selectInviteById(code || ''));
	const { checkClanLimit } = useCheckClanLimit();

	const fetchInviteData = useCallback(() => {
		if (code && !selectInvite) {
			dispatch(inviteActions.getLinkInvite({ inviteId: code }));
		}
	}, [code]);

	useEffect(() => {
		fetchInviteData();
	}, [fetchInviteData]);

	const handleJoinClanInvite = async () => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(true));
			const isClanLimit = checkClanLimit();
			if (isClanLimit) {
				onDismiss();
				store.dispatch(appActions.setLoadingMainMobile(false));
				return;
			}
			const res = await inviteUser(code || '');
			if (res?.clan_id) {
				requestAnimationFrame(async () => {
					navigation.navigate(APP_SCREEN.HOME);
					await remove(STORAGE_CHANNEL_CURRENT_CACHE);
					await store.dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
					store.dispatch(clansActions.joinClan({ clanId: res?.clan_id }));
					store.dispatch(clansActions.changeCurrentClan({ clanId: res?.clan_id }));
					save(STORAGE_CLAN_ID, res?.clan_id);
					store.dispatch(appActions.setLoadingMainMobile(false));
					navigation.navigate(APP_SCREEN.BOTTOM_BAR);
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

	const onDismiss = async () => {
		navigation.navigate(APP_SCREEN.BOTTOM_BAR);
	};
	return (
		<View style={styles.container}>
			<View style={styles.inviteContainer}>
				<Text style={styles.inviteTitle}>{t('title')}</Text>

				{selectInvite && (
					<View style={styles.clanInfo}>
						{selectInvite?.clan_logo ? (
							<View style={styles.clanAvatar}>
								<ImageNative style={styles.clanAvatar} resizeMode={'contain'} url={selectInvite.clan_logo} />
							</View>
						) : (
							<View style={styles.defaultAvatar}>
								<Text style={styles.defaultAvatarText}>{selectInvite?.clan_name?.charAt(0)?.toUpperCase()}</Text>
							</View>
						)}

						<View style={styles.clanNameRow}>
							<Text style={styles.clanName} numberOfLines={1}>
								{selectInvite?.clan_name}
							</Text>
							{selectInvite?.clan_name && (
								<MezonIconCDN icon={IconCDN.verifyIcon} width={size.s_16} height={size.s_16} color={themeValue.textStrong} />
							)}
						</View>
						{selectInvite?.channel_label && (
							<Text style={styles.channelName} numberOfLines={1}>
								# {selectInvite?.channel_label}
							</Text>
						)}
					</View>
				)}

				<TouchableOpacity style={styles.joinButton} onPress={handleJoinClanInvite} activeOpacity={0.8}>
					<Text style={styles.joinButtonText}>{t('join')}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.joinButton, styles.disMissButton]} onPress={onDismiss} activeOpacity={0.8}>
					<Text style={styles.joinButtonText}>{t('noThanks')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default InviteClanScreen;
