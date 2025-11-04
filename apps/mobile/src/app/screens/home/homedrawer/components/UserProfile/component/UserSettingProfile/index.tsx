import { useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import {
	ChannelMembersEntity,
	channelUsersActions,
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClanCreatorId,
	selectCurrentClanId,
	selectMemberIdsByChannelId,
	useAppDispatch
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../../navigation/ScreenTypes';
import { EActionSettingUserProfile, IProfileSetting } from '../../../../../../ManageUserScreen/types';
import KickUserClanModal from '../KickUserClanModal';
import { style } from './UserSettingProfile.style';

interface IUserSettingProfileProps {
	user: ChannelMembersEntity;
	showActionOutside?: boolean;
}

const UserSettingProfile = ({ user, showActionOutside = true }: IUserSettingProfileProps) => {
	const dispatch = useAppDispatch();
	const navigation = useNavigation<AppStackScreenProps<typeof APP_SCREEN.HOME>['navigation']>();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('clanOverviewSetting');
	const userProfile = useSelector(selectAllAccount);
	const { removeMemberClan } = useChannelMembersActions();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = currentChannel?.channel_id;
	const isItMe = useMemo(() => userProfile?.user?.id === user?.user?.id, [user?.user?.id, userProfile?.user?.id]);
	const isThatClanOwner = useMemo(() => currentClanCreatorId === user?.user?.id, [user?.user?.id, currentClanCreatorId]);
	const [hasClanOwnerPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.administrator,
		EPermission.manageClan
	]);
	const isThread = currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD;

	const memberIds = useSelector((state) => (currentChannelId ? selectMemberIdsByChannelId(state, currentChannelId) : []));

	const isUserInThread = useMemo(() => {
		if (!isThread || !memberIds?.length || !user?.user?.id) return false;

		return memberIds.includes(user.user.id);
	}, [isThread, memberIds, user?.user?.id]);

	const dangerActions = [EActionSettingUserProfile.Kick, EActionSettingUserProfile.ThreadRemove, EActionSettingUserProfile.TransferOwnership];

	const handleSettingUserProfile = useCallback((action?: EActionSettingUserProfile) => {
		switch (action) {
			case EActionSettingUserProfile.Manage:
				navigateToManageUser();
				break;
			case EActionSettingUserProfile.TimeOut:
				break;
			case EActionSettingUserProfile.Kick:
				confirmKickUserClan();
				break;
			case EActionSettingUserProfile.Ban:
				break;
			case EActionSettingUserProfile.ThreadRemove:
				confirmRemoveFromThread();
				break;
			case EActionSettingUserProfile.TransferOwnership:
				navigateToTransferOwnership();
				break;
			default:
				break;
		}
	}, []);

	const profileSetting: IProfileSetting[] = useMemo(() => {
		const settingList = [
			{
				label: t('action.manage'),
				value: EActionSettingUserProfile.Manage,
				icon: (
					<MezonIconCDN
						icon={IconCDN.settingIcon}
						color={themeValue.text}
						width={size.s_22}
						height={size.s_22}
						customStyle={{ marginTop: size.s_2 }}
					/>
				),
				action: handleSettingUserProfile,
				isShow: hasAdminPermission
			},
			// {
			// 	label: `${EActionSettingUserProfile.TimeOut}`,
			// 	value: EActionSettingUserProfile.TimeOut,
			// 	icon: <MezonIconCDN icon={IconCDN.clockWarningIcon} color={themeValue.text} width={20} height={20} />,
			// 	action: handleSettingUserProfile,
			// 	isShow: hasAdminPermission && !isItMe
			// },
			{
				label: t('action.transferOwnership'),
				value: EActionSettingUserProfile.TransferOwnership,
				icon: <MezonIconCDN icon={IconCDN.transferOwnershipIcon} width={size.s_22} height={size.s_22} color={baseColor.red} />,
				action: handleSettingUserProfile,
				isShow: !isItMe && hasClanOwnerPermission
			},
			{
				label: t('action.kick'),
				value: EActionSettingUserProfile.Kick,
				icon: <MezonIconCDN icon={IconCDN.leaveGroupIcon} width={size.s_22} height={size.s_22} color={baseColor.red} />,
				action: handleSettingUserProfile,
				isShow: !isItMe && (hasClanOwnerPermission || (hasAdminPermission && !isThatClanOwner))
			},
			{
				label: t('action.removeFromThread'),
				value: EActionSettingUserProfile.ThreadRemove,
				icon: <MezonIconCDN icon={IconCDN.removeFriend} width={20} height={20} color={baseColor.red} />,
				action: handleSettingUserProfile,
				isShow:
					!isItMe && isThread && isUserInThread && (isThatClanOwner || hasClanOwnerPermission || (hasAdminPermission && !isThatClanOwner))
			}
			// {
			// 	label: `${EActionSettingUserProfile.Ban}`,
			// 	value: EActionSettingUserProfile.Ban,
			// 	icon: <MezonIconCDN icon={IconCDN.hammerIcon} width={20} height={20} color={baseColor.red} />,
			// 	action: handleSettingUserProfile,
			// 	isShow: hasAdminPermission && !isItMe
			// }
		];
		return settingList;
	}, [themeValue.text, handleSettingUserProfile, hasAdminPermission, isItMe, isThatClanOwner, hasClanOwnerPermission, isThread, isUserInThread, t]);

	const confirmKickUserClan = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		const data = {
			children: <KickUserClanModal onRemoveUserClan={handleRemoveUserClans} user={user} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [user]);

	const navigateToManageUser = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
			screen: APP_SCREEN.MENU_CLAN.MANAGE_USER,
			params: { user }
		});
	}, [navigation, user]);

	const navigateToTransferOwnership = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
			screen: APP_SCREEN.MENU_CLAN.TRANSFER_OWNERSHIP,
			params: { user }
		});
	}, [navigation, user]);

	const handleRemoveUserClans = useCallback(async () => {
		if (user) {
			try {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				const userIds = [user.user?.id ?? ''];
				const response = await removeMemberClan({ clanId: currentClanId as string, channelId: currentChannelId as string, userIds });
				if (response) {
					Toast.show({
						type: 'success',
						props: {
							text2: t('permissions.toast.kickMemberSuccess'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
						}
					});
				} else {
					throw new Error();
				}
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				Toast.show({
					type: 'error',
					props: {
						text2: t('permissions.toast.kickMemberFailed'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} />
					}
				});
			}
		}
	}, [user, removeMemberClan, currentClanId, currentChannelId, t]);

	const handleRemoveMemberFromThread = useCallback(
		async (userId?: string) => {
			if (!userId || !currentChannelId) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: currentChannelId,
						userId,
						channelType: ChannelType.CHANNEL_TYPE_THREAD,
						clanId: currentClanId
					})
				);
				Toast.show({
					type: 'success',
					props: {
						text2: t('permissions.toast.removeMemberThreadSuccess'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
					}
				});
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			} catch (error) {
				Toast.show({
					type: 'error',
					props: {
						text2: t('permissions.toast.removeMemberThreadFailed'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} />
					}
				});
			}
		},
		[currentChannelId, dispatch, currentClanId, t]
	);

	const handleCloseRemoveFromThread = () => DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

	const confirmRemoveFromThread = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		const data = {
			children: (
				<MezonConfirm
					title={t('threadRemoveModal.title')}
					content={t('threadRemoveModal.description', { username: user?.user?.username || user?.['username'] })}
					confirmText={t('threadRemoveModal.remove')}
					isDanger
					onConfirm={() => handleRemoveMemberFromThread(user?.user?.id)}
					onCancel={handleCloseRemoveFromThread}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<View>
			{/* short profile */}
			{showActionOutside && profileSetting.some((action) => action.isShow) && (
				<View style={styles.wrapper}>
					{profileSetting?.map((item, index) => {
						if (!item?.isShow) return <View key={`empty-${index}`} />;
						return (
							<TouchableOpacity onPress={() => item.action(item.value)} key={`${item?.value}_${index}`}>
								<View style={styles.option}>
									{item?.icon}
									<Text
										style={[
											styles.textOption,
											dangerActions.includes(item.value) && {
												color: baseColor.red
											}
										]}
									>
										{item?.label}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			)}
		</View>
	);
};

export default UserSettingProfile;
