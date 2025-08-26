import { useRoles } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllRolesClan } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

function RoleImagePicker({ roleId, disable = false }: { roleId: string; disable?: boolean }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const rolesClan = useSelector(selectAllRolesClan);
	const activeRole = useMemo(() => rolesClan?.find((role) => role?.id === roleId), [roleId, rolesClan]);
	const { updateRole } = useRoles();
	const { t } = useTranslation('clanRoles');

	const handleOnLoad = async (url) => {
		if (url) {
			const response = await updateRole(activeRole?.clan_id, activeRole?.id, activeRole?.title, activeRole?.color || '', [], [], [], [], url);
			if (response) {
				return;
			} else {
				Toast.show({
					type: 'success',
					props: {
						text2: t('failed'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
					}
				});
			}
		}
	};

	const handleRemoveIcon = async () => {
		const response = await updateRole(activeRole?.clan_id, activeRole?.id, activeRole?.title, activeRole?.color || '', [], [], [], [], '');
		if (response) {
			return;
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	};

	return (
		<View>
			<View style={styles.roleButton}>
				<Text style={styles.textBtn}>{t('roleImagePicker')}</Text>
				<View style={styles.tailButton}>
					{!!activeRole?.role_icon && !disable && (
						<TouchableOpacity style={styles.deleteButton} onPress={handleRemoveIcon}>
							<Text style={styles.deleteText}>{t('removeImage')}</Text>
						</TouchableOpacity>
					)}
					<MezonImagePicker
						defaultValue={activeRole?.role_icon}
						height={size.s_50}
						width={size.s_50}
						onLoad={handleOnLoad}
						autoUpload
						disabled={disable}
					/>
				</View>
			</View>
		</View>
	);
}
export default React.memo(RoleImagePicker);
