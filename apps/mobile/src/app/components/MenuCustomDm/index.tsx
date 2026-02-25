import { ActionEmitEvent, load, save, STORAGE_USERS_QUICK_REACTION } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import {
	deleteChannel,
	directActions,
	fetchDirectMessage,
	removeMemberChannel,
	selectCurrentUserId,
	selectDmGroupById,
	selectRawDataUserGroup,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { ContainerMessageActionModal } from '../../screens/home/homedrawer/components/MessageItemBS/ContainerMessageActionModal';
import CustomGroupDm from './CustomGroupDm';
import style from './MenuCustomDm.styles';

const MenuCustomDm = ({ currentChannel, channelLabel }: { currentChannel: IChannel | DirectEntity; channelLabel: string }) => {
	const { t } = useTranslation(['menuCustomDM', 'dmMessage', 'common']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const currentUserId = useAppSelector(selectCurrentUserId);
	const currentDMGroup = useAppSelector((state) => selectDmGroupById(state, currentChannel?.id));
	const currentAvatar = currentDMGroup?.channel_avatar;
	const allUserGroupDM = useSelector((state) => selectRawDataUserGroup(state, currentChannel?.id || ''));

	const lastOne = useMemo(() => {
		const userIds = allUserGroupDM?.user_ids || [];
		return userIds?.length === 1;
	}, [allUserGroupDM?.user_ids]);

	const channelId = useMemo(() => {
		return currentChannel?.channel_id || currentChannel?.id || '';
	}, [currentChannel?.channel_id, currentChannel?.id]);

	const handleEmojiSelected = useCallback(
		(emojiId: string, shortname: string) => {
			if (!currentUserId || !channelId) return;

			try {
				const currentData = load(STORAGE_USERS_QUICK_REACTION) || {};

				if (!currentData[currentUserId]) {
					currentData[currentUserId] = {};
				}

				currentData[currentUserId][channelId] = { emojiId, shortname };
				save(STORAGE_USERS_QUICK_REACTION, currentData);

				Toast.show({
					type: 'success',
					text1: t('common:quickReaction.toast.success')
				});
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			} catch (error) {
				console.error('Error setting quick reaction:', error);
				Toast.show({
					type: 'error',
					text1: t('common:quickReaction.toast.failed')
				});
			}
		},
		[channelId, currentUserId, t]
	);

	const handleOpenQuickReactionModal = useCallback(async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			snapPoints: ['90%'],
			children: (
				<ContainerMessageActionModal
					message={undefined}
					mode={
						currentChannel?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP
					}
					isOnlyEmojiPicker
					channelId={channelId}
					onEmojiSelected={handleEmojiSelected}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, [channelId, currentChannel?.type, handleEmojiSelected]);

	const hasQuickReaction = useMemo(() => {
		if (!currentUserId || !channelId) return false;

		const data = load(STORAGE_USERS_QUICK_REACTION) || {};
		return !!data?.[currentUserId]?.[channelId];
	}, [currentUserId, channelId]);

	const handleRemoveQuickReaction = useCallback(() => {
		if (!currentUserId || !channelId) return;

		try {
			const currentData = load(STORAGE_USERS_QUICK_REACTION) || {};

			if (currentData?.[currentUserId]?.[channelId]) {
				delete currentData[currentUserId][channelId];
				save(STORAGE_USERS_QUICK_REACTION, currentData);

				Toast.show({
					type: 'success',
					text1: t('common:quickReaction.toast.removeSuccess')
				});
			}
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		} catch (error) {
			console.error('Error removing quick reaction:', error);
			Toast.show({
				type: 'error',
				text1: t('common:quickReaction.toast.removeFailed')
			});
		}
	}, [channelId, currentUserId, t]);

	const menuSetting: IMezonMenuItemProps[] = [
		{
			title: t('common:quickReaction.title'),
			expandable: false,
			icon: <MezonIconCDN icon={IconCDN.reactionIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
			textStyle: styles.label,
			onPress: handleOpenQuickReactionModal
		},
		{
			title: t('common:quickReaction.removeTitle'),
			expandable: false,
			icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
			textStyle: styles.label,
			onPress: handleRemoveQuickReaction,
			isShow: hasQuickReaction
		},
		{
			title: t('customiseGroup'),
			expandable: false,
			icon: <MezonIconCDN icon={IconCDN.pencilIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
			textStyle: styles.label,
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					snapPoints: ['90%'],
					children: <CustomGroupDm dmGroupId={currentChannel?.id} channelLabel={channelLabel} currentAvatar={currentAvatar} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}
		},
		{
			title: lastOne ? t('dmMessage:menu.deleteGroup') : t('dmMessage:menu.leaveGroup'),
			expandable: false,
			icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_22} height={size.s_22} color={baseColor.redStrong} />,
			textStyle: [styles.label, styles.redText],
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: (
						<MezonConfirm
							onConfirm={handleLeaveGroupConfirm}
							title={t('confirm.title', {
								groupName: currentChannel?.channel_label,
								ns: 'dmMessage'
							})}
							content={t('confirm.content', {
								groupName: currentChannel?.channel_label,
								ns: 'dmMessage'
							})}
							confirmText={t('confirm.confirmText', { ns: 'dmMessage' })}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			}
		}
	];
	const generalMenu: IMezonMenuSectionProps[] = [
		{
			items: menuSetting
		}
	];

	const closeDm: IMezonMenuSectionProps[] = [
		{
			items: [
				{
					title: t('common:quickReaction.title'),
					expandable: false,
					icon: <MezonIconCDN icon={IconCDN.reactionIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
					textStyle: styles.label,
					onPress: handleOpenQuickReactionModal
				},
				{
					title: t('common:quickReaction.removeTitle'),
					expandable: false,
					icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
					textStyle: styles.label,
					onPress: handleRemoveQuickReaction,
					isShow: hasQuickReaction
				},
				{
					title: t('closeDM'),
					expandable: false,
					icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_18} height={size.s_18} color={baseColor.red} />,
					textStyle: [styles.label, styles.redText],
					onPress: async () => {
						await dispatch(directActions.closeDirectMessage({ channel_id: currentChannel?.channel_id }));
						navigation.navigate(APP_SCREEN.MESSAGES.HOME);
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					}
				}
			]
		}
	];

	const handleLeaveGroupConfirm = useCallback(async () => {
		try {
			dispatch(directActions.setDmGroupCurrentId(''));

			const resultLeaveOrDeleteGroup = lastOne
				? await dispatch(deleteChannel({ clanId: '0', channelId: currentChannel?.channel_id ?? '', isDmGroup: true }))
				: await dispatch(removeMemberChannel({ channelId: currentChannel?.channel_id || '0', userIds: [currentUserId], kickMember: false }));

			if (resultLeaveOrDeleteGroup?.meta?.requestStatus === 'rejected') {
				throw new Error(resultLeaveOrDeleteGroup?.meta?.requestStatus);
			} else {
				navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('toast.leaveGroupError', { error })
			});
			dispatch(directActions.setDmGroupCurrentId(currentChannel?.id || ''));
		} finally {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		}
	}, [currentChannel?.channel_id, currentChannel?.id, currentUserId, dispatch, lastOne, navigation, t]);

	return (
		<View style={{ paddingVertical: size.s_10, paddingHorizontal: size.s_20 }}>
			{[ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel.type) ? <MezonMenu menu={generalMenu} /> : <MezonMenu menu={closeDm} />}
		</View>
	);
};
export default MenuCustomDm;
