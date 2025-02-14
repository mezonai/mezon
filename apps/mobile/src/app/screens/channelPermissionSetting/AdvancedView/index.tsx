import { size, Text, useTheme } from '@mezon/mobile-ui';
import { selectAllUserChannel } from '@mezon/store';
import { selectRolesByChannelId } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { MemberItem } from '../components/MemberItem';
import { RoleItem } from '../components/RoleItem';
import { EOverridePermissionType } from '../types/channelPermission.enum';
import { IAdvancedViewProps } from '../types/channelPermission.type';

export const AdvancedView = memo(({ isAdvancedEditMode, channel }: IAdvancedViewProps) => {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('channelSetting');
	const listOfChannelRole = useSelector(selectRolesByChannelId(channel?.channel_id));
	const allUserInChannel = useSelector(selectAllUserChannel(channel.channel_id));

	const listOfRoleAndMemberInChannel = useMemo(() => {
		if ((!listOfChannelRole?.length && !allUserInChannel?.length) || !!channel?.channel_private) {
			return [];
		}
		return [
			{ headerTitle: t('channelPermission.roles'), isShowHeader: listOfChannelRole?.length },
			...listOfChannelRole.map((role) => ({
				id: role.id,
				role,
				type: EOverridePermissionType.Role
			})),
			{ headerTitle: t('channelPermission.members'), isShowHeader: allUserInChannel?.length },
			...allUserInChannel.map((member) => ({
				id: member.id,
				member,
				type: EOverridePermissionType.Member
			}))
		];
	}, [listOfChannelRole, allUserInChannel, t]);

	const navigateToPermissionOverridesDetail = useCallback(
		(id: string, type: EOverridePermissionType) => {
			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES,
				params: {
					channelId: channel?.id,
					id,
					type
				}
			});
		},
		[navigation, channel?.id]
	);

	const renderItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeader, role, member } = item;
			if (!type && headerTitle && isShowHeader) {
				return (
					<View style={{ paddingTop: size.s_12, paddingLeft: size.s_12 }}>
						<Text color={themeValue.white} h4>
							{headerTitle}:
						</Text>
					</View>
				);
			}
			switch (type) {
				case EOverridePermissionType.Member:
					return <MemberItem member={member} channel={channel} isAdvancedSetting={true} onPress={navigateToPermissionOverridesDetail} />;
				case EOverridePermissionType.Role:
					return <RoleItem role={role} channel={channel} isAdvancedSetting={true} onPress={navigateToPermissionOverridesDetail} />;
				default:
					return <View />;
			}
		},
		[channel, themeValue, navigateToPermissionOverridesDetail]
	);

	return (
		<View style={{ flex: 1 }}>
			{listOfRoleAndMemberInChannel.length ? (
				<FlashList
					data={listOfRoleAndMemberInChannel}
					keyboardShouldPersistTaps={'handled'}
					renderItem={renderItem}
					keyExtractor={(item) => `${item?.id}_${item?.headerTitle}`}
					removeClippedSubviews={true}
				/>
			) : (
				<View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
					<Text color={themeValue.textDisabled}>{t('channelPermission.roleAndMemberEmpty')}</Text>
				</View>
			)}

			{/* <AdvancedSettingBS bottomSheetRef={bottomSheetRef} channel={channel} currentAdvancedPermissionType={currentAdvancedPermissionType} /> */}
		</View>
	);
});
