import { useRoles } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';

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

	const isDisable = useMemo(() => {
		return disabled || !isSelectMode;
	}, [disabled, isSelectMode]);

	const memberName = useMemo(() => {
		return member?.clan_nick || member?.user?.display_name;
	}, [member?.user?.display_name, member?.clan_nick]);

	const onPressMemberItem = useCallback(() => {
		if (isDisable) return;
		if (isSelectMode) {
			onSelectChange && onSelectChange(!isSelected, member?.id);
		}
	}, [isDisable, isSelectMode, isSelected, member?.id, onSelectChange]);

	const onDeleteMember = useCallback(async () => {
		const response = await updateRole(role?.clan_id, role?.id, role?.title, role?.color || '', [], [], [member?.id], []);

		if (response) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('setupMember.deletedMember', { memberName }),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	}, [role, member?.id, updateRole, memberName, t]);

	return (
		<TouchableOpacity onPress={onPressMemberItem}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					backgroundColor: themeValue.secondary,
					padding: size.s_12,
					gap: size.s_10
				}}
			>
				<View style={{ flex: 1, flexDirection: 'row', gap: size.s_10, alignItems: 'center' }}>
					<MezonAvatar avatarUrl={member?.user?.avatar_url} username={member?.user?.username} />
					<View style={{ width: '80%' }}>
						{memberName ? (
							<Text
								style={{
									color: themeValue.white
								}}
							>
								{memberName}
							</Text>
						) : null}
						<Text
							style={{
								color: themeValue.text
							}}
						>
							{member?.user?.username}
						</Text>
					</View>
				</View>

				<View style={{ height: size.s_20, width: size.s_20 }}>
					{isSelectMode ? (
						<BouncyCheckbox
							size={20}
							isChecked={isSelected}
							onPress={(value) => onSelectChange(value, member?.id)}
							fillColor={'#5865f2'}
							iconStyle={{ borderRadius: 5 }}
							innerIconStyle={{
								borderWidth: 1.5,
								borderColor: isSelected ? '#5865f2' : '#ccc',
								borderRadius: 5,
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
