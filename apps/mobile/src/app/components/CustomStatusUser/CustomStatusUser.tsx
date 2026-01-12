import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { accountActions, selectAccountCustomStatus, useAppDispatch } from '@mezon/store-mobile';
import { EUserStatus } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import type { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import type { IMezonOptionData } from '../../componentUI/MezonOption';
import MezonOption from '../../componentUI/MezonOption';
import { IconCDN } from '../../constants/icon_cdn';
import { AddStatusUserModal } from '../AddStatusUserModal';
import { styles } from './CustomStatusUser.styles';

interface ICustomStatusUserProps {
	userStatus: string;
	handleCustomUserStatus: (customStatus: string) => void;
	currentUserId: string;
}

export const CustomStatusUser = ({ userStatus, handleCustomUserStatus, currentUserId }: ICustomStatusUserProps) => {
	const { t } = useTranslation(['customUserStatus']);
	const dispatch = useAppDispatch();
	const { dismiss } = useBottomSheetModal();
	const { themeValue } = useTheme();
	const [userStatusOption, setUserStatusOption] = useState<string>(userStatus || EUserStatus.ONLINE);
	const userCustomStatus = useSelector(selectAccountCustomStatus);

	const handleStatusChange = useCallback(async (value: string) => {
		const response = await dispatch(
			accountActions.updateAccountStatus({
				status: value,
				minutes: 0,
				untilTurnOn: true
			})
		);

		if (response?.meta?.requestStatus === 'fulfilled') {
			setUserStatusOption(value);
		}
		dismiss();
	}, []);

	const handlePressSetCustomStatus = useCallback(() => {
		const data = {
			children: (
				<AddStatusUserModal
					userCustomStatus={userCustomStatus || ''}
					handleCustomUserStatus={handleCustomUserStatus}
					userId={currentUserId}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [currentUserId, handleCustomUserStatus, userCustomStatus]);

	const statusOptions = useMemo(
		() =>
			[
				{
					title: t('userStatus.online'),
					value: EUserStatus.ONLINE,
					icon: <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#16A34A" height={size.s_12} width={size.s_20} />
				},
				{
					title: t('userStatus.idle'),
					value: EUserStatus.IDLE,
					icon: <MezonIconCDN icon={IconCDN.idleStatusIcon} color="#F0B232" height={size.s_20} width={size.s_20} />
				},
				{
					title: t('userStatus.doNotDisturb'),
					value: EUserStatus.DO_NOT_DISTURB,
					icon: <MezonIconCDN icon={IconCDN.disturbStatusIcon} color="#F23F43" height={size.s_20} width={size.s_20} />
				},
				{
					title: t('userStatus.invisible'),
					value: EUserStatus.INVISIBLE,
					icon: <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#AEAEAE" height={size.s_12} width={size.s_20} />
				}
			] as IMezonOptionData,
		[t]
	);

	const statusMenu = useMemo(
		() =>
			[
				{
					items: [
						{
							title: userCustomStatus ? userCustomStatus : t('setCustomStatus'),
							icon: <MezonIconCDN icon={IconCDN.reactionIcon} height={size.s_20} width={size.s_20} color={themeValue.textDisabled} />,
							onPress: () => handlePressSetCustomStatus(),
							component: userCustomStatus && (
								<Pressable onPress={() => handleCustomUserStatus('')}>
									<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.textStrong} />
								</Pressable>
							)
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[handleCustomUserStatus, handlePressSetCustomStatus, t, themeValue.textDisabled, themeValue.textStrong, userCustomStatus]
	);

	return (
		<View style={styles.container}>
			<MezonOption title={t('onlineStatus')} data={statusOptions} value={userStatusOption} onChange={handleStatusChange} />
			<MezonMenu menu={statusMenu} />
		</View>
	);
};
