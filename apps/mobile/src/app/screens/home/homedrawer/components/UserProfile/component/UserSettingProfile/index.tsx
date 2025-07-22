import { useAuth, useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import { Colors, baseColor, useTheme } from '@mezon/mobile-ui';
import { ChannelMembersEntity, selectCurrentClan, selectCurrentClanId } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
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
	Ban = 'Ban'
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
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('clanOverviewSetting');
	const [visibleKickUserModal, setVisibleKickUserModal] = useState<boolean>(showKickUserModal);
	const [visibleManageUserModal, setVisibleManageUserModal] = useState<boolean>(showManagementUserModal);
	const { userProfile } = useAuth();
	const { removeMemberClan } = useChannelMembersActions();
	const currentClan = useSelector(selectCurrentClan);
	const isItMe = useMemo(() => userProfile?.user?.id === user?.user?.id, [user?.user?.id, userProfile?.user?.id]);
	const isThatClanOwner = useMemo(() => currentClan?.creator_id === user?.user?.id, [user?.user?.id, currentClan?.creator_id]);
	const currentClanId = useSelector(selectCurrentClanId);
	const [hasClanOwnerPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.administrator,
		EPermission.manageClan
	]);

	useEffect(() => {
		setVisibleKickUserModal(showKickUserModal);
	}, [showKickUserModal]);

	useEffect(() => {
		setVisibleManageUserModal(showManagementUserModal);
	}, [showManagementUserModal]);

	const handleSettingUserProfile = useCallback((action?: EActionSettingUserProfile) => {
		switch (action) {
			// short profile
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
			default:
				break;
		}
	}, []);

	const profileSetting: IProfileSetting[] = useMemo(() => {
		const settingList = [
			{
				label: `${EActionSettingUserProfile.Manage}`,
				value: EActionSettingUserProfile.Manage,
				icon: <MezonIconCDN icon={IconCDN.settingIcon} color={themeValue.text} width={20} height={20} />,
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
				label: `${EActionSettingUserProfile.Kick}`,
				value: EActionSettingUserProfile.Kick,
				icon: <MezonIconCDN icon={IconCDN.userMinusIcon} width={20} height={20} color={baseColor.red} />,
				action: handleSettingUserProfile,
				isShow: !isItMe && (hasClanOwnerPermission || (hasAdminPermission && !isThatClanOwner))
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
	}, [themeValue.text, handleSettingUserProfile, hasAdminPermission, isItMe, isThatClanOwner]);

	const handleRemoveUserClans = useCallback(async () => {
		if (user) {
			try {
				setVisibleKickUserModal(false);
				const userIds = [user.user?.id ?? ''];
				const response = await removeMemberClan({ clanId: currentClanId as string, channelId: user.channelId as string, userIds });
				if (response) {
					Toast.show({
						type: 'success',
						props: {
							text2: t('permissions.toast.kickMemberSuccess'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={Colors.green} />
						}
					});
				}
			} catch (error) {
				Toast.show({
					type: 'error',
					props: {
						text2: t('permissions.toast.kickMemberFailed'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={Colors.red} />
					}
				});
			}
		}
	}, [currentClanId, removeMemberClan, user]);

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
						if (!item?.isShow) return <View />;
						return (
							<TouchableOpacity onPress={() => item.action(item.value)} key={`${item?.value}_${index}`}>
								<View style={styles.option}>
									{item?.icon}
									<Text style={styles.textOption}>{item?.label}</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			<MezonModal
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
