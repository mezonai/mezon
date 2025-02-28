import { useRoles } from '@mezon/core';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllRolesClan } from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import RoleColorPicker from '../RoleColorPicker/RoleColorPicker';
import { style } from './styles';

function RoleCoLourComponent({ roleId }: { roleId: string }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const rolesClan = useSelector(selectAllRolesClan);
	const activeRole = useMemo(() => rolesClan?.find((role) => role?.id === roleId), [roleId, rolesClan]);
	const [roleColorSelected, setRoleColorSelected] = useState<string>(activeRole?.color || DEFAULT_ROLE_COLOR);
	const { updateRole } = useRoles();
	const { t } = useTranslation('clanRoles');

	const handleSaveRoleColor = useCallback(async (colorSelected: string) => {
		if (colorSelected && activeRole) {
			await updateRole(activeRole?.clan_id || '', activeRole?.id, activeRole?.title ?? '', colorSelected ?? '', [], [], [], []);
			setRoleColorSelected(colorSelected);
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
			<TouchableOpacity onPress={onPresentBS} style={styles.roleButton}>
				<Text style={styles.textBtn}>{t('roleColorPicker.textBtnRole')}</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
					<View style={{ width: size.s_40, height: size.s_40, backgroundColor: roleColorSelected, borderRadius: size.s_6 }}></View>
					<Text style={styles.colorText}>{activeRole?.color ?? ''}</Text>
					<Icons.ChevronSmallRightIcon color={themeValue.text} />
				</View>
			</TouchableOpacity>
		</View>
	);
}
export default React.memo(RoleCoLourComponent);
