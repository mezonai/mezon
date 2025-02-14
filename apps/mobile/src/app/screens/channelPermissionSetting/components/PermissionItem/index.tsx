import { Icons } from '@mezon/mobile-components';
import { Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { EPermission } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { EPermissionStatus } from '../../types/channelPermission.enum';
import { IPermissionItemProps } from '../../types/channelPermission.type';

export const PermissionItem = memo(({ permission, status, onPermissionStatusChange }: IPermissionItemProps) => {
	const { slug, title } = permission;
	const { themeValue } = useTheme();
	const { t } = useTranslation('channelSetting');

	const permissionOptionList = [
		{
			icon: (color: string) => <Icons.CloseIcon color={color} />,
			activeBackground: Colors.persianRed,
			color: Colors.persianRed,
			type: EPermissionStatus.Deny
		},
		{
			icon: (color: string) => <Icons.SlashIcon height={size.s_16} width={size.s_16} color={color} />,
			activeBackground: Colors.outerSpace,
			color: Colors.outerSpace,
			type: EPermissionStatus.None
		},
		{
			icon: (color: string) => <Icons.CheckmarkSmallIcon color={color} />,
			activeBackground: Colors.jungleGreen,
			color: Colors.jungleGreen,
			type: EPermissionStatus.Allow
		}
	];

	const getPermissionDescription = useCallback(() => {
		switch (slug) {
			case EPermission.viewChannel:
				return t('channelPermission.description.viewChannel');
			case EPermission.manageChannel:
				return t('channelPermission.description.manageChannel');
			case EPermission.manageThread:
				return t('channelPermission.description.manageThread');
			case EPermission.sendMessage:
				return t('channelPermission.description.sendMessage');
			case EPermission.deleteMessage:
				return t('channelPermission.description.deleteMessage');
			default:
				return '';
		}
	}, [t, slug]);

	return (
		<View style={{ gap: size.s_6 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
				<Text color={themeValue.textStrong} h4>
					{title}
				</Text>
				<View style={{ flexDirection: 'row', borderRadius: size.s_4, overflow: 'hidden' }}>
					{permissionOptionList?.map((option) => {
						const { activeBackground, icon, type, color } = option;
						const isActive = status === type;
						return (
							<TouchableOpacity key={type.toString()} onPress={() => onPermissionStatusChange(permission?.id, type)}>
								<View
									style={{
										backgroundColor: isActive ? activeBackground : themeValue.primary,
										alignItems: 'center',
										justifyContent: 'center',
										width: size.s_34,
										height: size.s_30
									}}
								>
									{icon(isActive ? Colors.white : color)}
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
			<Text color={themeValue.textDisabled} h6>
				{getPermissionDescription()}
			</Text>
		</View>
	);
});
