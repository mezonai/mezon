import { useInvite } from '@mezon/core';
import { remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { appActions, clansActions, getStoreAsync, inviteActions, selectInviteById, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import useCheckClanLimit from '../../../../../../hooks/useCheckClanLimit';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from '../RenderMessageInvite.styles';

function LinkInvite({ inviteID }: { inviteID: string }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('linkMessageInvite');
	const selectInvite = useAppSelector(selectInviteById(inviteID || ''));
	const { checkClanLimit } = useCheckClanLimit();

	const fetchInviteData = useCallback(() => {
		if (inviteID && !selectInvite) {
			dispatch(inviteActions.getLinkInvite({ inviteId: inviteID }));
		}
	}, [inviteID]);

	useEffect(() => {
		fetchInviteData();
	}, [fetchInviteData]);

	const handleJoinClanInvite = async () => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(true));
			const isClanLimit = checkClanLimit();
			if (isClanLimit) {
				store.dispatch(appActions.setLoadingMainMobile(false));
				return;
			}
			const res = await inviteUser(inviteID || '');
			if (res?.clan_id) {
				requestAnimationFrame(async () => {
					navigation.navigate(APP_SCREEN.HOME);
					await remove(STORAGE_CHANNEL_CURRENT_CACHE);
					await store.dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
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
		<View style={styles.inviteContainer}>
			<Text style={styles.inviteTitle}>{t('title')}</Text>

			{selectInvite && (
				<View style={styles.clanInfoRow}>
					{selectInvite?.clan_logo ? (
						<FastImage
							source={{
								uri: selectInvite.clan_logo
							}}
							style={styles.clanAvatar}
							resizeMode={FastImage.resizeMode.contain}
						/>
					) : (
						<View style={styles.defaultAvatar}>
							<Text style={styles.defaultAvatarText}>{selectInvite?.clan_name?.charAt(0)?.toUpperCase()}</Text>
						</View>
					)}

					<View style={styles.clanTextInfo}>
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
				</View>
			)}

			<TouchableOpacity style={styles.joinButton} onPress={handleJoinClanInvite} activeOpacity={0.8}>
				<Text style={styles.joinButtonText}>{t('join')}</Text>
			</TouchableOpacity>
		</View>
	);
}

export default memo(LinkInvite);
