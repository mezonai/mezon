import { useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import {
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClanCreatorId,
	selectCurrentClanId,
	selectMemberIdsByChannelId
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import KickUserClanModal from '../home/homedrawer/components/UserProfile/component/KickUserClanModal';
import { ManageUser } from './ManageUser';
import { EActionSettingUserProfile, IProfileSetting } from './types';

type ManageUserScreenProps = MenuClanScreenProps<typeof APP_SCREEN.MENU_CLAN.MANAGE_USER>;

const ManageUserScreen = ({ route }: ManageUserScreenProps) => {
	const { user } = route.params;
	const { themeValue } = useTheme();
	const navigation = useNavigation();
	const { t } = useTranslation('clanOverviewSetting');
	const userProfile = useSelector(selectAllAccount);
	const { removeMemberClan } = useChannelMembersActions();
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = currentChannel?.channel_id;
	const isItMe = useMemo(() => userProfile?.user?.id === user?.user?.id, [user?.user?.id, userProfile?.user?.id]);
	const isThatClanOwner = useMemo(() => currentClanCreatorId === user?.user?.id, [user?.user?.id, currentClanCreatorId]);
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

	const handleActionSettings = useCallback(
		(action?: EActionSettingUserProfile) => {
			switch (action) {
				case EActionSettingUserProfile.Kick:
					confirmKickUserClan();
					break;
				case EActionSettingUserProfile.TransferOwnership:
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					(navigation as any).navigate(APP_SCREEN.MENU_CLAN.STACK, {
						screen: APP_SCREEN.MENU_CLAN.TRANSFER_OWNERSHIP,
						params: { user }
					});
					break;
				default:
					break;
			}
		},
		[navigation, user]
	);

	const memberSettings: IProfileSetting[] = useMemo(() => {
		const settingList = [
			{
				label: t('action.transferOwnership'),
				value: EActionSettingUserProfile.TransferOwnership,
				icon: <MezonIconCDN icon={IconCDN.transferOwnershipIcon} width={size.s_22} height={size.s_22} color={baseColor.red} />,
				action: handleActionSettings,
				isShow: !isItMe && hasClanOwnerPermission
			},
			{
				label: t('action.kick'),
				value: EActionSettingUserProfile.Kick,
				icon: <MezonIconCDN icon={IconCDN.leaveGroupIcon} width={size.s_22} height={size.s_22} color={baseColor.red} />,
				action: handleActionSettings,
				isShow: !isItMe && (hasClanOwnerPermission || (hasAdminPermission && !isThatClanOwner))
			}
		];
		return settingList;
	}, [themeValue.text, handleActionSettings, hasAdminPermission, isItMe, isThatClanOwner, hasClanOwnerPermission, isThread, isUserInThread, t]);

	const confirmKickUserClan = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		const data = {
			children: <KickUserClanModal onRemoveUserClan={handleRemoveUserClans} user={user} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [user]);

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
				navigation.goBack();
			} catch (error) {
				Toast.show({
					type: 'error',
					props: {
						text2: t('permissions.toast.kickMemberFailed')
					}
				});
			}
		}
	}, [currentClanId, removeMemberClan, user, currentChannelId, t, navigation]);

	const exitSetting = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	return <ManageUser user={user} onClose={exitSetting} memberSettings={memberSettings} />;
};

export default ManageUserScreen;
