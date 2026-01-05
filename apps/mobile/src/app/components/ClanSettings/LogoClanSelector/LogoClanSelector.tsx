import { usePermissionChecker } from '@mezon/core';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { clansActions, selectCurrentClan } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { EPermission, MAX_FILE_SIZE_1MB } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './style';

const LogoClanSelector = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanSetting']);
	const [hasAdminPermission, clanOwnerPermission] = usePermissionChecker([EPermission.administrator, EPermission.clanOwner]);

	const isHavePermission = useMemo(() => hasAdminPermission || clanOwnerPermission, [clanOwnerPermission, hasAdminPermission]);

	const updateClanLogo = useCallback(
		(logo: string) =>
			dispatch(
				clansActions.updateClan({
					clanId: currentClan?.clanId ?? '',
					request: {
						banner: currentClan?.banner ?? '',
						clanName: currentClan?.clanName ?? '',
						creatorId: currentClan?.creatorId ?? '',
						isOnboarding: currentClan?.isOnboarding,
						logo,
						welcomeChannelId: currentClan?.welcomeChannelId ?? ''
					}
				})
			),
		[currentClan, dispatch]
	);

	const handleLoad = useCallback(
		async (url?: string) => {
			if (!isHavePermission) {
				Toast.show({
					type: 'error',
					text1: t('menu.settings.permissionDenied')
				});
				return;
			}
			if (url) {
				await updateClanLogo(url);
			}
		},
		[isHavePermission, t, updateClanLogo]
	);

	const handleRemoveClanAvatar = useCallback(async () => {
		if (!isHavePermission) {
			Toast.show({
				type: 'error',
				text1: t('menu.settings.permissionDenied')
			});
			return;
		}
		await updateClanLogo('');
	}, [isHavePermission, t, updateClanLogo]);

	return (
		<View style={styles.logoSection}>
			<View style={styles.logoContainer}>
				<MezonImagePicker
					defaultValue={currentClan?.logo}
					onLoad={handleLoad}
					autoUpload={true}
					alt={currentClan?.clanName}
					disabled={!isHavePermission}
					imageSizeLimit={MAX_FILE_SIZE_1MB}
				/>
				{isHavePermission && currentClan?.logo && (
					<TouchableOpacity disabled={!isHavePermission} style={styles.removeButton} onPress={handleRemoveClanAvatar}>
						<MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.redStrong} />
					</TouchableOpacity>
				)}
			</View>
			<Text style={styles.clanName}>{currentClan?.clanName}</Text>
		</View>
	);
};

export default memo(LogoClanSelector);
