import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount } from '@mezon/store-mobile';
import { EUserStatus } from '@mezon/utils';
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { style } from './styles';

const StatusProfile = () => {
	const isTabletLandscape = useTabletLandscape();
	const userProfile = useSelector(selectAllAccount);
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);

	const userStatus = useMemo(() => {
		return userProfile?.user?.status;
	}, [userProfile?.user?.status]);

	const userStatusIcon = useMemo(() => {
		switch (userStatus) {
			case EUserStatus.ONLINE:
				return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#16A34A" width={size.s_20} height={size.s_20} />;

			case EUserStatus.IDLE:
				return <MezonIconCDN icon={IconCDN.idleStatusIcon} color="#F0B232" width={size.s_20} height={size.s_20} />;

			case EUserStatus.DO_NOT_DISTURB:
				return <MezonIconCDN icon={IconCDN.disturbStatusIcon} color="#F23F43" />;

			case EUserStatus.INVISIBLE:
				return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#AEAEAE" width={size.s_16} height={size.s_16} />;

			default:
				return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#16A34A" width={size.s_20} height={size.s_20} />;
		}
	}, [userStatus]);

	return (
		<View
			style={[
				{
					backgroundColor: themeValue.tertiary,
					borderRadius: size.s_20,
					position: 'absolute',
					bottom: -size.s_2,
					right: -size.s_4
				},
				styles.dotStatusUser
			]}
		>
			{userStatusIcon}
		</View>
	);
};

export default memo(StatusProfile);
