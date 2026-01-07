import { useTheme } from '@mezon/mobile-ui';
import {
	fetchUserChannels,
	rolesClanActions,
	selectAllUserClans,
	selectRolesByChannelId,
	selectUserChannelIds,
	useAppDispatch
} from '@mezon/store-mobile';
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
import type { IAdvancedViewProps } from '../types/channelPermission.type';
import { styles as stylesFn } from './AdvancedView.styles';

export const AdvancedView = memo(({ isAdvancedEditMode, channel }: IAdvancedViewProps) => {
	const { themeValue } = useTheme();
	const styles = stylesFn(themeValue);
	const navigation = useNavigation<any>();
	const { t } = useTranslation('channelSetting');
	const allClanMembers = useSelector(selectAllUserClans);
	const listOfChannelRole = useSelector(selectRolesByChannelId(channel?.channelId));
	const dispatch = useAppDispatch();
	const listChannelMemberIds = useSelector((state) => selectUserChannelIds(state, channel.channelId));
	const allUserInChannel = useMemo(() => {
		return allClanMembers?.filter((member) => listChannelMemberIds?.includes(member?.user?.id));
	}, [allClanMembers, listChannelMemberIds]);

	useEffect(() => {
		dispatch(rolesClanActions.fetchRolesClan({ clanId: channel?.clanId }));
		dispatch(fetchUserChannels({ channelId: channel?.channelId }));
	}, [channel?.channelId, channel?.clanId, dispatch]);

	const listOfRoleAndMemberInChannel = useMemo(() => {
		if ((!listOfChannelRole?.length && !allUserInChannel?.length) || !channel?.channelPrivate) {
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
	}, [listOfChannelRole, allUserInChannel, channel?.channelPrivate, t]);

	const navigateToPermissionOverridesDetail = useCallback(
		(id: string, type: EOverridePermissionType) => {
			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES,
				params: {
					channelId: channel?.id,
					clanId: channel?.clanId,
					id,
					type
				}
			});
		},
		[channel?.id, channel?.clanId]
	);

	const renderItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeader, role, member } = item;
			if (!type && headerTitle && isShowHeader) {
				return (
					<View style={styles.headerContainer}>
						<Text style={styles.headerText}>{headerTitle}:</Text>
					</View>
				);
			}
			return (
				<View style={styles.itemWrapper}>
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
		[channel, styles, navigateToPermissionOverridesDetail]
	);

	return (
		<View style={styles.container}>
			{listOfRoleAndMemberInChannel.length ? (
				<FlashList
					data={listOfRoleAndMemberInChannel}
					keyboardShouldPersistTaps={'handled'}
					renderItem={renderItem}
					keyExtractor={(item) => `${item?.id}_${item?.headerTitle}`}
					removeClippedSubviews={true}
				/>
			) : (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>{t('channelPermission.roleAndMemberEmpty')}</Text>
				</View>
			)}

			{/* <AdvancedSettingBS bottomSheetRef={bottomSheetRef} channel={channel} currentAdvancedPermissionType={currentAdvancedPermissionType} /> */}
		</View>
	);
});
