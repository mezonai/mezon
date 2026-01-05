import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, clansActions, selectAllAccount, selectLogoCustom, useAppDispatch } from '@mezon/store-mobile';
import { MAX_FILE_SIZE_1MB } from '@mezon/utils';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../../../../componentUI/MezonImagePicker';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from './styles';

export const DirectMessageLogo = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const logoCustom = useSelector(selectLogoCustom);
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const { t } = useTranslation(['profileSetting']);

	const handleOnLoad = async (url) => {
		if (url) {
			dispatch(appActions.setLoadingMainMobile(true));
			await dispatch(
				clansActions.updateUser({
					avatarUrl: userProfile.user.avatarUrl,
					displayName: userProfile.user.displayName,
					about_me: userProfile.user.about_me,
					dob: userProfile.user.dob,
					logo: url
				})
			);
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleShowConfirmModal = () => {
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleRemoveDirectLogo}
					title={t('directMessageIconAction.removeTitle')}
					confirmText={t('directMessageIconAction.remove')}
					children={<Text style={styles.confirmText}>{t('directMessageIconAction.removeDescription')}</Text>}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handleRemoveDirectLogo = async () => {
		dispatch(appActions.setLoadingMainMobile(true));
		await dispatch(
			clansActions.updateUser({
				avatarUrl: userProfile.user.avatarUrl,
				displayName: userProfile.user.displayName,
				about_me: userProfile.user.about_me,
				dob: userProfile.user.dob,
				logo: ''
			})
		);
		dispatch(appActions.setLoadingMainMobile(false));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('directMessageIcon')}</Text>
			<MezonImagePicker
				defaultValue={logoCustom}
				height={size.s_50}
				width={size.s_50}
				localValue={!logoCustom && <MezonIconCDN icon={IconCDN.logoMezon} width={size.s_50} height={size.s_50} useOriginalColor={true} />}
				onLoad={handleOnLoad}
				autoUpload
				imageSizeLimit={MAX_FILE_SIZE_1MB}
			/>
			{!!logoCustom && (
				<TouchableOpacity style={styles.removeButton} onPress={handleShowConfirmModal}>
					<MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.redStrong} width={size.s_20} height={size.s_20} />
				</TouchableOpacity>
			)}
		</View>
	);
});
