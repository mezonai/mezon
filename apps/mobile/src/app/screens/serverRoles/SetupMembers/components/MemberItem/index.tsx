import { useRoles } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import type { RolesClanEntity } from '@mezon/store-mobile';
import type { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './index.styles';

interface IMemberItemProps {
	member: UsersClanEntity;
	disabled?: boolean;
	onSelectChange?: (value: boolean, memberId: string) => void;
	isSelectMode?: boolean;
	isSelected?: boolean;
	role?: RolesClanEntity;
}

export const MemberItem = memo((props: IMemberItemProps) => {
	const { disabled, member, isSelectMode = false, isSelected, onSelectChange, role } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation('clanRoles');
	const { updateRole } = useRoles();
	const styles = style(themeValue);

	const isDisable = useMemo(() => {
		return disabled || !isSelectMode;
	}, [disabled, isSelectMode]);

	const memberAvatarUrl = useMemo(() => {
		return member?.clanAvatar || member?.user?.avatarUrl || '';
	}, [member?.clanAvatar, member?.user?.avatarUrl]);

	const memberName = useMemo(() => {
		return member?.clanNick || member?.user?.displayName || member?.user?.username || '';
	}, [member?.clanNick, member?.user?.displayName, member?.user?.username]);

	const onPressMemberItem = useCallback(() => {
		if (isDisable) return;
		if (isSelectMode) {
			onSelectChange && onSelectChange(!isSelected, member?.id);
		}
	}, [isDisable, isSelectMode, isSelected, member?.id, onSelectChange]);

	const onDeleteMember = useCallback(async () => {
		const response = await updateRole(role?.clanId, role?.id, role?.title, role?.color || '', [], [], [member?.id], []);

		if (response) {
			Toast.show({
				type: 'success',
				text1: t('setupMember.deletedMember', { memberName })
			});
		} else {
			Toast.show({
				type: 'error',
				text1: t('failed')
			});
		}
	}, [role, member?.id, updateRole, memberName, t]);

	return (
		<TouchableOpacity onPress={onPressMemberItem}>
			<View style={styles.container}>
				<View style={styles.memberInfoContainer}>
					<View style={styles.imgWrapper}>
						<MezonClanAvatar alt={member?.user?.username || ''} image={memberAvatarUrl} />
					</View>
					<View style={styles.memberTextContainer}>
						<Text style={styles.memberName}>{memberName}</Text>
						<Text style={styles.memberUsername}>{member?.user?.username || ''}</Text>
					</View>
				</View>

				<View style={styles.actionContainer}>
					{isSelectMode ? (
						<BouncyCheckbox
							size={20}
							isChecked={isSelected}
							onPress={(value) => onSelectChange(value, member?.id)}
							fillColor={'#5865f2'}
							iconStyle={styles.checkboxIcon}
							innerIconStyle={{
								...styles.checkboxInnerIcon,
								borderColor: isSelected ? '#5865f2' : '#ccc',
								opacity: disabled ? 0.4 : 1
							}}
							disabled={disabled}
							textStyle={{ fontFamily: 'JosefinSans-Regular' }}
						/>
					) : (
						<TouchableOpacity onPress={onDeleteMember} disabled={disabled}>
							<MezonIconCDN icon={IconCDN.closeIcon} color={disabled ? themeValue.textDisabled : themeValue.white} />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
});
