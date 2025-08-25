import { useRoles } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllRolesClan } from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import RoleColorPicker from '../RoleColorPicker/RoleColorPicker';
import { style } from './styles';

function RoleCoLourComponent({ roleId, disable = false }: { roleId: string; disable?: boolean }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const rolesClan = useSelector(selectAllRolesClan);
	const activeRole = useMemo(() => rolesClan?.find((role) => role?.id === roleId), [roleId, rolesClan]);
	const [roleColorSelected, setRoleColorSelected] = useState<string>(activeRole?.color || DEFAULT_ROLE_COLOR);
	const { updateRole } = useRoles();
	const { t } = useTranslation('clanRoles');

	const handleSaveRoleColor = useCallback(async (colorSelected: string) => {
		if (colorSelected && activeRole) {
			const response = await updateRole(
				activeRole?.clan_id || '',
				activeRole?.id,
				activeRole?.title ?? '',
				colorSelected ?? '',
				[],
				[],
				[],
				[]
			);
			if (response) {
				setRoleColorSelected(colorSelected);
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
	}, []);

	const onPresentBS = () => {
		const data = {
			snapPoints: ['50%'],
			children: <RoleColorPicker onPickColor={handleSaveRoleColor} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View>
			<TouchableOpacity onPress={onPresentBS} style={styles.roleButton} disabled={disable}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_6 }}>
					<Text style={styles.textBtn}>{t('roleColorPicker.textBtnRole')}</Text>
					{disable && <MezonIconCDN icon={IconCDN.lockIcon} color={themeValue.textDisabled} height={size.s_16} width={size.s_16} />}
				</View>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
					<View style={{ width: size.s_40, height: size.s_40, backgroundColor: roleColorSelected, borderRadius: size.s_6 }}></View>
					<Text style={styles.colorText}>{activeRole?.color ?? ''}</Text>
					{!disable && <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />}
				</View>
			</TouchableOpacity>
		</View>
	);
}
export default React.memo(RoleCoLourComponent);
