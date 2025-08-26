import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { channelUsersActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
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
					leadingIcon: isError ? (
						<MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} />
					) : (
						<MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
					)
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
					{!isAdvancedSetting && (
						<MezonIconCDN icon={IconCDN.bravePermission} color={role?.color || themeValue.text} width={size.s_24} height={size.s_24} />
					)}
					<View style={{ flex: 1 }}>
						<View style={{ flexDirection: 'row', gap: size.s_4, alignItems: 'center' }}>
							<Text
								style={{
									fontSize: verticalScale(18),
									marginLeft: 0,
									marginRight: 0,
									color: themeValue.white
								}}
							>
								{role?.title}
							</Text>
						</View>
						{!isCheckbox && !isAdvancedSetting && (
							<Text
								style={{
									marginLeft: 0,
									marginRight: 0,
									color: themeValue.textDisabled
								}}
							>
								{'Role'}
							</Text>
						)}
					</View>
					{isAdvancedSetting ? (
						<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.white} />
					) : (
						<View>
							{isCheckbox ? (
								<View style={{ height: size.s_20, width: size.s_20 }}>
									<BouncyCheckbox
										size={20}
										isChecked={isChecked}
										onPress={(value) => onSelectRoleChange(value, role?.id)}
										fillColor={'#5865f2'}
										iconStyle={{ borderRadius: 5 }}
										innerIconStyle={{
											borderWidth: 1.5,
											borderColor: isChecked ? '#5865f2' : '#ccc',
											borderRadius: 5
										}}
									/>
								</View>
							) : (
								<TouchableOpacity onPress={deleteRole} disabled={isEveryoneRole}>
									<MezonIconCDN icon={IconCDN.circleXIcon} color={isEveryoneRole ? themeValue.textDisabled : themeValue.white} />
								</TouchableOpacity>
							)}
						</View>
					)}
				</View>
			</TouchableOpacity>
		);
	}
);
