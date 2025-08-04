import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { fetchUserChannels, rolesClanActions, selectAllUserChannel, selectRolesByChannelId, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
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
	const allUserInChannel = useSelector(selectAllUserChannel(channel?.channel_id));
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(rolesClanActions.fetchRolesClan({ clanId: channel?.clan_id }));
		dispatch(fetchUserChannels({ channelId: channel?.channel_id }));
	}, [channel?.channel_id, channel?.clan_id]);

	const listOfRoleAndMemberInChannel = useMemo(() => {
		if ((!listOfChannelRole?.length && !allUserInChannel?.length) || !channel?.channel_private) {
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
	}, [listOfChannelRole, allUserInChannel, channel?.channel_private, t]);

	const navigateToPermissionOverridesDetail = useCallback(
		(id: string, type: EOverridePermissionType) => {
			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES,
				params: {
					channelId: channel?.id,
					clanId: channel?.clan_id,
					id,
					type
				}
			});
		},
		[channel?.id, channel?.clan_id]
	);

	const renderItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeader, role, member } = item;
			if (!type && headerTitle && isShowHeader) {
				return (
					<View style={{ paddingTop: size.s_12, paddingLeft: size.s_8, marginBottom: size.s_10 }}>
						<Text
							style={{
								fontSize: verticalScale(18),
								color: themeValue.white
							}}
						>
							{headerTitle}:
						</Text>
					</View>
				);
			}
			return (
				<View style={{ backgroundColor: themeValue.primary, borderRadius: size.s_8, marginBottom: size.s_8 }}>
					{type === EOverridePermissionType.Member ? (
						!member?.user?.id || !member?.user?.username ? (
							<View />
						) : (
							<MemberItem member={member} channel={channel} isAdvancedSetting={true} onPress={navigateToPermissionOverridesDetail} />
						)
					) : type === EOverridePermissionType.Role ? (
						<RoleItem role={role} channel={channel} isAdvancedSetting={true} onPress={navigateToPermissionOverridesDetail} />
					) : (
						<View />
					)}
				</View>
			);
		},
		[channel, themeValue, navigateToPermissionOverridesDetail]
	);

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.primary }}>
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
					<Text
						style={{
							color: themeValue.textDisabled
						}}
					>
						{t('channelPermission.roleAndMemberEmpty')}
					</Text>
				</View>
			)}

			{/* <AdvancedSettingBS bottomSheetRef={bottomSheetRef} channel={channel} currentAdvancedPermissionType={currentAdvancedPermissionType} /> */}
		</View>
	);
});
