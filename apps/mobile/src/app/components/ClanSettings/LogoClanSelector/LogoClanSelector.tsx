import { usePermissionChecker } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { clansActions, selectCurrentClan } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { EPermission, MAX_FILE_SIZE_1MB } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import { style } from './style';

const LogoClanSelector = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanSetting']);
	const [hasAdminPermission, hasManageClanPermission, clanOwnerPermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const isHavePermission = useMemo(() => {
		return hasAdminPermission || hasManageClanPermission || clanOwnerPermission;
	}, [clanOwnerPermission, hasAdminPermission, hasManageClanPermission]);

	const handleLoad = useCallback(
		async (url?: string) => {
			if (!hasAdminPermission && !clanOwnerPermission) {
				Toast.show({
					type: 'error',
					text1: t('menu.settings.permissionDenied')
				});
				return;
			}
			if (url) {
				await dispatch(
					clansActions.updateClan({
						clan_id: currentClan?.clan_id ?? '',
						request: {
							banner: currentClan?.banner ?? '',
							clan_name: currentClan?.clan_name ?? '',
							creator_id: currentClan?.creator_id ?? '',
							is_onboarding: currentClan?.is_onboarding,
							logo: url || (currentClan?.logo ?? ''),
							welcome_channel_id: currentClan?.welcome_channel_id ?? ''
						}
					})
				);
			}
		},
		[
			clanOwnerPermission,
			currentClan?.banner,
			currentClan?.clan_id,
			currentClan?.clan_name,
			currentClan?.creator_id,
			currentClan?.is_onboarding,
			currentClan?.logo,
			currentClan?.welcome_channel_id,
			dispatch,
			hasAdminPermission,
			t
		]
	);

	return (
		<View style={styles.logoSection}>
			<View style={styles.logoContainer}>
				<MezonImagePicker
					defaultValue={currentClan?.logo}
					onLoad={handleLoad}
					autoUpload={true}
					alt={currentClan?.clan_name}
					disabled={!isHavePermission}
					imageSizeLimit={MAX_FILE_SIZE_1MB}
				/>
			</View>

			<Text style={styles.clanName}>{currentClan?.clan_name}</Text>
		</View>
	);
};

export default memo(LogoClanSelector);
