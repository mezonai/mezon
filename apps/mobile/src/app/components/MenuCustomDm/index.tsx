import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	deleteChannel,
	directActions,
	fetchDirectMessage,
	removeMemberChannel,
	selectCurrentUserId,
	selectDmGroupCurrent,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IChannel, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, View } from 'react-native';
import MezonConfirm from '../../componentUI/MezonConfirm';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import CustomGroupDm from './CustomGroupDm';
import style from './MenuCustomDm.styles';

const MenuCustomDm = ({ currentChannel, channelLabel }: { currentChannel: IChannel | DirectEntity; channelLabel: string }) => {
	const { t } = useTranslation(['menuCustomDM', 'dmMessage']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const lastOne = useMemo(() => {
		return !currentChannel?.user_id?.length;
	}, [currentChannel?.user_id]);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const currentDMGroup = useAppSelector(selectDmGroupCurrent(currentChannel?.id));
	const currentAvatar = currentDMGroup?.topic;

	const menuSetting: IMezonMenuItemProps[] = [
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
			title: t('leaveGroup'),
			expandable: false,
			icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_22} height={size.s_22} color={themeValue.text} />,
			textStyle: styles.label,
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
					title: t('closeDM'),
					expandable: false,
					icon: <MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />,
					textStyle: styles.label,
					onPress: async () => {
						await dispatch(directActions.closeDirectMessage({ channel_id: currentChannel?.channel_id }));
						navigation.navigate(APP_SCREEN.MESSAGES.HOME);
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					}
				}
			]
		}
	];

	const handleLeaveGroupConfirm = async () => {
		const isLeaveOrDeleteGroup = lastOne
			? await dispatch(deleteChannel({ clanId: '', channelId: currentChannel?.channel_id ?? '', isDmGroup: true }))
			: await dispatch(removeMemberChannel({ channelId: currentChannel?.channel_id || '', userIds: [currentUserId], kickMember: false }));
		if (!isLeaveOrDeleteGroup) {
			return;
		}
		await dispatch(fetchDirectMessage({ noCache: true }));
		navigation.navigate(APP_SCREEN.MESSAGES.HOME);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={{ paddingVertical: size.s_10, paddingHorizontal: size.s_20 }}>
			{[ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel.type) ? <MezonMenu menu={generalMenu} /> : <MezonMenu menu={closeDm} />}
		</View>
	);
};
export default MenuCustomDm;
