import { useRoles } from '@mezon/core';
import { CheckIcon, CloseIcon, Icons } from '@mezon/mobile-components';
import { Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';

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
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
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
					<View>
						{memberName ? <Text color={themeValue.white}>{memberName}</Text> : null}
						<Text color={themeValue.text}>{member?.user?.username}</Text>
					</View>
				</View>

				<View style={{ height: size.s_20, width: size.s_20 }}>
					{isSelectMode ? (
						<BouncyCheckbox
							size={20}
							isChecked={isSelected}
							onPress={(value) => onSelectChange(value, member?.id)}
							fillColor={Colors.bgButton}
							iconStyle={{ borderRadius: 5 }}
							innerIconStyle={{
								borderWidth: 1.5,
								borderColor: isSelected ? Colors.bgButton : Colors.tertiary,
								borderRadius: 5,
								opacity: disabled ? 0.4 : 1
							}}
							disabled={disabled}
							textStyle={{ fontFamily: 'JosefinSans-Regular' }}
						/>
					) : (
						<TouchableOpacity onPress={onDeleteMember} disabled={disabled}>
							<Icons.CloseIcon color={disabled ? themeValue.textDisabled : themeValue.white} />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
});
