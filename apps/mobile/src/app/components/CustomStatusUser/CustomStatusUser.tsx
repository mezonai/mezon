import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectUserStatus, useAppDispatch, userStatusActions } from '@mezon/store-mobile';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonOption, { IMezonOptionData } from '../../componentUI/MezonOption';
import { IconCDN } from '../../constants/icon_cdn';
import { ETypeCustomUserStatus } from '../../screens/profile/ProfileScreen';

interface ICustomStatusUserProps {
	onPressSetCustomStatus?: () => void;
	userCustomStatus?: string;
	handleCustomUserStatus?: (customStatus: string, type: ETypeCustomUserStatus) => void;
}

export enum EUserStatus {
	ONLINE = 'active',
	IDLE = 'Idle',
	DO_NOT_DISTURB = 'Do Not Disturb',
	INVISIBLE = 'Invisible'
}
export const CustomStatusUser = forwardRef(function CustomStatusUser(props: ICustomStatusUserProps) {
	const { onPressSetCustomStatus, userCustomStatus, handleCustomUserStatus } = props;
	const { t } = useTranslation(['customUserStatus']);
	const userStatus = useSelector(selectUserStatus);
	const dispatch = useAppDispatch();
	const { dismiss } = useBottomSheetModal();

	const { themeValue } = useTheme();
	const [userStatusOption, setUserStatusOption] = useState<string>(EUserStatus.ONLINE);

	useEffect(() => {
		switch (userStatus?.status) {
			case EUserStatus.ONLINE:
				setUserStatusOption(EUserStatus.ONLINE);
				break;
			case EUserStatus.DO_NOT_DISTURB:
				setUserStatusOption(EUserStatus.DO_NOT_DISTURB);
				break;
			case EUserStatus.IDLE:
				setUserStatusOption(EUserStatus.IDLE);
				break;
			case EUserStatus.INVISIBLE:
				setUserStatusOption(EUserStatus.INVISIBLE);
				break;
			default:
				setUserStatusOption(EUserStatus.ONLINE);
				break;
		}
	}, [userStatus]);

	function handleStatusChange(value: string) {
		if (!value) return;
		dismiss();
		dispatch(
			userStatusActions.updateUserStatus({
				status: value,
				minutes: 0,
				until_turn_on: true
			})
		);
		setUserStatusOption(value);
	}

	const statusOptions = useMemo(
		() =>
			[
				{
					title: t('userStatus.online'),
					value: EUserStatus.ONLINE,
					icon: <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#16A34A" />
				},
				{
					title: t('userStatus.idle'),
					value: EUserStatus.IDLE,
					icon: <MezonIconCDN icon={IconCDN.disturbStatusIcon} color="#16A34A" />
				},
				{
					title: t('userStatus.doNotDisturb'),
					value: EUserStatus.DO_NOT_DISTURB,
					icon: <MezonIconCDN icon={IconCDN.disturbStatusIcon} color="#F23F43" />
				},
				{
					title: t('userStatus.invisible'),
					value: EUserStatus.INVISIBLE,
					icon: <MezonIconCDN icon={IconCDN.offlineStatusIcon} color="#AEAEAE" />
				}
			] as IMezonOptionData,
		[]
	);

	const statusMenu = useMemo(
		() =>
			[
				{
					items: [
						{
							title: userCustomStatus ? userCustomStatus : t('setCustomStatus'),
							icon: <MezonIconCDN icon={IconCDN.reactionIcon} height={20} width={20} color={themeValue.textDisabled} />,
							onPress: () => onPressSetCustomStatus(),
							component: userCustomStatus ? (
								<Pressable onPress={() => handleCustomUserStatus('', ETypeCustomUserStatus.Close)}>
									<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.textStrong} />
								</Pressable>
							) : null
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[userCustomStatus]
	);

	return (
		<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10 }}>
			<MezonOption title={t('onlineStatus')} data={statusOptions} value={userStatusOption} onChange={handleStatusChange} />

			<MezonMenu menu={statusMenu} />
		</View>
	);
});
