import { Icons } from '@mezon/mobile-components';
import { Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { channelUsersActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { EOverridePermissionType, ERequestStatus } from '../../types/channelPermission.enum';
import { IRoleItemProps } from '../../types/channelPermission.type';

export const RoleItem = memo(
	({ role, channel, isCheckbox = false, isChecked = false, onSelectRoleChange, isAdvancedSetting = false, onPress }: IRoleItemProps) => {
		const { themeValue } = useTheme();
		const currentClanId = useSelector(selectCurrentClanId);
		const dispatch = useAppDispatch();
		const { t } = useTranslation('channelSetting');

		const isEveryoneRole = useMemo(() => {
			return role?.slug === 'everyone';
		}, [role?.slug]);

		const deleteRole = async () => {
			const body = {
				channelId: channel?.channel_id || '',
				clanId: currentClanId || '',
				roleId: role?.id || '',
				channelType: channel?.type
			};
			const response = await dispatch(channelUsersActions.removeChannelRole(body));
			const isError = response?.meta?.requestStatus === ERequestStatus.Rejected;
			Toast.show({
				type: 'success',
				props: {
					text2: isError ? t('channelPermission.toast.failed') : t('channelPermission.toast.success'),
					leadingIcon: isError ? <Icons.CloseIcon color={Colors.red} /> : <Icons.CheckmarkLargeIcon color={Colors.green} />
				}
			});
		};

		const onPressRoleItem = () => {
			if (isAdvancedSetting) {
				onPress && onPress(role?.id, EOverridePermissionType.Role);
				return;
			}
			onSelectRoleChange(!isChecked, role?.id);
		};

		return (
			<TouchableOpacity onPress={onPressRoleItem} disabled={!isCheckbox && !isAdvancedSetting}>
				<View style={{ gap: size.s_10, flexDirection: 'row', padding: size.s_10, alignItems: 'center' }}>
					{!isAdvancedSetting && <Icons.BravePermission color={themeValue.text} width={size.s_24} height={size.s_24} />}
					<View style={{ flex: 1 }}>
						<View style={{ flexDirection: 'row', gap: size.s_4, alignItems: 'center' }}>
							<Text h4 color={themeValue.white}>
								{role?.title}
							</Text>
						</View>
						{!isCheckbox && !isAdvancedSetting && <Text color={themeValue.textDisabled}>{'Role'}</Text>}
					</View>
					{isAdvancedSetting ? (
						<Icons.ChevronSmallRightIcon color={themeValue.white} />
					) : (
						<View>
							{isCheckbox ? (
								<View style={{ height: size.s_20, width: size.s_20 }}>
									<BouncyCheckbox
										size={20}
										isChecked={isChecked}
										onPress={(value) => onSelectRoleChange(value, role?.id)}
										fillColor={Colors.bgButton}
										iconStyle={{ borderRadius: 5 }}
										innerIconStyle={{
											borderWidth: 1.5,
											borderColor: isChecked ? Colors.bgButton : Colors.tertiary,
											borderRadius: 5
										}}
									/>
								</View>
							) : (
								<TouchableOpacity onPress={deleteRole} disabled={isEveryoneRole}>
									<Icons.CircleXIcon color={isEveryoneRole ? themeValue.textDisabled : themeValue.white} />
								</TouchableOpacity>
							)}
						</View>
					)}
				</View>
			</TouchableOpacity>
		);
	}
);
