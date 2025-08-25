import { useAuth, useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelMembersEntity,
	channelUsersActions,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentClanId,
	selectMemberIdsByChannelId,
	useAppDispatch
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import MezonConfirm from 'apps/mobile/src/app/componentUI/MezonConfirm';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { MezonModal } from '../../../../../../../componentUI/MezonModal';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import KickUserClanModal from '../KickUserClanModal';
import { ManageUserModal } from '../ManageUserModal';
import { style } from './UserSettingProfile.style';

export enum EActionSettingUserProfile {
	Manage = 'Manage',
	TimeOut = 'Timeout',
	Kick = 'Kick',
	Ban = 'Ban',
	ThreadRemove = 'ThreadRemove'
}

interface IUserSettingProfileProps {
	user: ChannelMembersEntity;
	showManagementUserModal?: boolean;
	onShowManagementUserModalChange?: (isVisible: boolean) => void;
	showKickUserModal?: boolean;
	showActionOutside?: boolean;
}

export interface IProfileSetting {
	label: string;
	value: EActionSettingUserProfile;
	icon: React.JSX.Element;
	action: (action?: EActionSettingUserProfile) => void;
	isShow: boolean;
}

const UserSettingProfile = ({
	user,
	showManagementUserModal = false,
	onShowManagementUserModalChange,
	showKickUserModal = false,
	showActionOutside = true
}: IUserSettingProfileProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('clanOverviewSetting');
	const [visibleKickUserModal, setVisibleKickUserModal] = useState<boolean>(showKickUserModal);
	const [visibleManageUserModal, setVisibleManageUserModal] = useState<boolean>(showManagementUserModal);
	const { userProfile } = useAuth();
	const { removeMemberClan } = useChannelMembersActions();
	const currentClan = useSelector(selectCurrentClan);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = currentChannel?.channel_id;
	const isItMe = useMemo(() => userProfile?.user?.id === user?.user?.id, [user?.user?.id, userProfile?.user?.id]);
	const isThatClanOwner = useMemo(() => currentClan?.creator_id === user?.user?.id, [user?.user?.id, currentClan?.creator_id]);
	const currentClanId = useSelector(selectCurrentClanId);
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

	const dangerActions = [EActionSettingUserProfile.Kick, EActionSettingUserProfile.ThreadRemove];

	useEffect(() => {
		setVisibleKickUserModal(showKickUserModal);
	}, [showKickUserModal]);

	useEffect(() => {
		setVisibleManageUserModal(showManagementUserModal);
	}, [showManagementUserModal]);

	const handleSettingUserProfile = useCallback((action?: EActionSettingUserProfile) => {
		switch (action) {
			case EActionSettingUserProfile.Manage:
				setVisibleManageUserModal(true);
				onShowManagementUserModalChange?.(true);
				break;
			case EActionSettingUserProfile.TimeOut:
				break;
			case EActionSettingUserProfile.Kick:
				setVisibleKickUserModal(true);
				break;
			case EActionSettingUserProfile.Ban:
				break;
			case EActionSettingUserProfile.ThreadRemove:
				confirmRemoveFromThread();
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

	const handleRemoveUserClans = useCallback(async () => {
		if (user) {
			try {
				setVisibleKickUserModal(false);
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
	}, [currentClanId, removeMemberClan, user, currentChannelId]);

	const handleRemoveMemberFromThread = useCallback(
		async (userId?: string) => {
			if (!userId || !currentChannelId) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: currentChannelId,
						userId,
						channelType: ChannelType.CHANNEL_TYPE_THREAD,
						clanId: currentClan?.clan_id
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
		[dispatch, currentClan?.clan_id, currentChannelId, isThread]
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

	function handleUserModalClose() {
		setVisibleManageUserModal(false);
		onShowManagementUserModalChange?.(false);
	}

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

			<MezonModal
				title={t('modal.kickUserClan.title')}
				visible={visibleKickUserModal}
				visibleChange={(visible) => {
					setVisibleKickUserModal(visible);
				}}
			>
				<KickUserClanModal onRemoveUserClan={handleRemoveUserClans} user={user} />
			</MezonModal>

			{/* from setting */}
			{visibleManageUserModal && (
				<ManageUserModal visible={visibleManageUserModal} user={user} onclose={handleUserModalClose} profileSetting={profileSetting} />
			)}
		</View>
	);
};

export default UserSettingProfile;
