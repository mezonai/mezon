import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { baseColor, size } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';

export const SendTokenUser = forwardRef(() => {
	const { t } = useTranslation(['screenStack']);
	const { dismiss } = useBottomSheetModal();
	const navigation = useNavigation<any>();
	const sendTokenOptions: IMezonMenuItemProps[] = useMemo(
		() => [
			{
				onPress: () => {
					navigation.push(APP_SCREEN.WALLET, {
						activeScreen: 'transfer'
					});
					dismiss();
				},
				title: t('settingStack.sendToken'),
				isShow: true,
				icon: <MezonIconCDN icon={IconCDN.sendMoneyIcon} height={size.s_22} width={size.s_22} color={baseColor.bgSuccess} />
			},
			{
				onPress: () => {
					navigation.push(APP_SCREEN.WALLET, {
						activeScreen: 'manage'
					});
					dismiss();
				},
				title: t('settingStack.walletManagement'),
				isShow: true,
				icon: (
					<MezonIconCDN
						icon={IconCDN.sendMoneyIcon}
						height={size.s_22}
						width={size.s_22}
						color={baseColor.bgSuccess}
						customStyle={{ transform: [{ rotate: '180deg' }] }}
					/>
				)
			},
			{
				onPress: () => {
					navigation.push(APP_SCREEN.WALLET, {
						activeScreen: 'history'
					});
					dismiss();
				},
				title: t('settingStack.historyTransaction'),
				isShow: true,
				icon: <MezonIconCDN icon={IconCDN.historyIcon} height={size.s_24} width={size.s_24} color={baseColor.bgSuccess} />
			}
		],
		[]
	);

	const menu: IMezonMenuSectionProps[] = [
		{
			items: sendTokenOptions
		}
	];

	return (
		<View style={{ paddingHorizontal: size.s_20 }}>
			<MezonMenu menu={menu} />
		</View>
	);
});
