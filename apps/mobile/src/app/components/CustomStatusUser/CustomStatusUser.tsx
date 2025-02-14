import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { DisturbStatusIcon, Icons, IdleStatusIcon, OfflineStatus, OnlineStatus } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectUserStatus, useAppDispatch, userStatusActions } from '@mezon/store-mobile';
import { Ref, forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import { IMezonMenuSectionProps, IMezonOptionData, MezonBottomSheet, MezonMenu, MezonOption } from '../../componentUI';
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
export const CustomStatusUser = forwardRef(function CustomStatusUser(props: ICustomStatusUserProps, ref: Ref<BottomSheetModalMethods>) {
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
					icon: <OnlineStatus />
				},
				{
					title: t('userStatus.idle'),
					value: EUserStatus.IDLE,
					icon: <IdleStatusIcon />
				},
				{
					title: t('userStatus.doNotDisturb'),
					value: EUserStatus.DO_NOT_DISTURB,
					icon: <DisturbStatusIcon />
				},
				{
					title: t('userStatus.invisible'),
					value: EUserStatus.INVISIBLE,
					icon: <OfflineStatus />
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
							icon: <Icons.ReactionIcon height={20} width={20} color={themeValue.textDisabled} />,
							onPress: () => onPressSetCustomStatus(),
							component: userCustomStatus ? (
								<Pressable onPress={() => handleCustomUserStatus('', ETypeCustomUserStatus.Close)}>
									<Icons.CloseIcon color={themeValue.textStrong} />
								</Pressable>
							) : null
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[userCustomStatus]
	);

	return (
		<MezonBottomSheet ref={ref} title={t('changeOnlineStatus')} heightFitContent>
			<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10 }}>
				<MezonOption title={t('onlineStatus')} data={statusOptions} value={userStatusOption} onChange={handleStatusChange} />

				<MezonMenu menu={statusMenu} />
			</View>
		</MezonBottomSheet>
	);
});
