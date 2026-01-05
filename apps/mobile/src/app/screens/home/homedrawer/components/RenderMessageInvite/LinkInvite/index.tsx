import { useInvite } from '@mezon/core';
import { remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	clansActions,
	emojiSuggestionActions,
	getStoreAsync,
	inviteActions,
	selectInviteById,
	selectInviteLoadingById,
	settingClanStickerActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import useCheckClanLimit from '../../../../../../hooks/useCheckClanLimit';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from '../RenderMessageInvite.styles';

function LinkInvite({ inviteID }: { inviteID: string }) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue, themeBasic);
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('linkMessageInvite');
	const selectInvite = useAppSelector(selectInviteById(inviteID || ''));
	const loadingStatus = useAppSelector(selectInviteLoadingById(inviteID || ''));
	const { checkClanLimit } = useCheckClanLimit();

	const fetchInviteData = useCallback(() => {
		if (inviteID && !selectInvite) {
			dispatch(inviteActions.getLinkInvite({ inviteId: inviteID }));
		}
	}, [inviteID]);

	useEffect(() => {
		fetchInviteData();
	}, [fetchInviteData]);

	const isLoading = useMemo(() => {
		return loadingStatus === 'loading';
	}, [loadingStatus]);

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
			if (res?.clanId) {
				requestAnimationFrame(async () => {
					navigation.navigate(APP_SCREEN.HOME);
					await remove(STORAGE_CHANNEL_CURRENT_CACHE);
					await store.dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
					store.dispatch(clansActions.joinClan({ clanId: res?.clanId }));
					store.dispatch(clansActions.changeCurrentClan({ clanId: res?.clanId }));
					store.dispatch(emojiSuggestionActions.fetchEmoji({ clanId: res?.clanId, noCache: true }));
					store.dispatch(settingClanStickerActions.fetchStickerByUserId({ noCache: true, clanId: res?.clanId }));
					save(STORAGE_CLAN_ID, res?.clanId);
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

	const renderInvalidInvite = () => {
		return (
			<View style={styles.clanInfoRow}>
				<View style={styles.invalidInviteAvatar} />

				<View style={styles.clanTextInfo}>
					<Text style={styles.invalidInviteTitle}>{t('invalidInvite.title')}</Text>
					<Text style={styles.channelName}>{t('invalidInvite.message')}</Text>
				</View>
			</View>
		);
	};

	const renderValidCLanInfo = () => {
		return (
			<>
				<View style={styles.clanInfoRow}>
					{selectInvite?.clanLogo ? (
						<FastImage
							source={{
								uri: selectInvite.clanLogo
							}}
							style={styles.clanAvatar}
							resizeMode={FastImage.resizeMode.contain}
						/>
					) : (
						<View style={styles.defaultAvatar}>
							<Text style={styles.defaultAvatarText}>{selectInvite?.clanName?.charAt(0)?.toUpperCase() || ''}</Text>
						</View>
					)}

					<View style={styles.clanTextInfo}>
						<Text style={styles.clanName} numberOfLines={1}>
							{selectInvite?.clanName || ''}
						</Text>

						{selectInvite?.channelLabel && (
							<Text style={styles.channelName} numberOfLines={1}>
								# {selectInvite.channelLabel}
							</Text>
						)}
					</View>
				</View>

				<TouchableOpacity style={styles.joinButton} onPress={handleJoinClanInvite} activeOpacity={0.8}>
					<Text style={styles.joinButtonText}>{t('join')}</Text>
				</TouchableOpacity>
			</>
		);
	};

	return (
		<View style={styles.inviteContainer}>
			<Text style={styles.inviteTitle}>{t('title')}</Text>
			{isLoading ? <ActivityIndicator size="small" color={themeValue.text} /> : selectInvite ? renderValidCLanInfo() : renderInvalidInvite()}
		</View>
	);
}

export default memo(LinkInvite);
