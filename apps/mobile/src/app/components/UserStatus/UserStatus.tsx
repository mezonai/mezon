import type { IUserStatusProps } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { EUserStatus } from '@mezon/utils';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';

export const UserStatus = React.memo(({ status, customStyles, iconSize = size.s_12, customStatus }: IUserStatusProps) => {
	const { themeValue } = useTheme();
	const mobileIconSize = iconSize + size.s_4;

	const onlineStatus = useMemo(() => {
		switch (customStatus) {
			case EUserStatus.IDLE:
				return <MezonIconCDN icon={IconCDN.idleStatusIcon} color="#F0B232" width={mobileIconSize} height={mobileIconSize} />;

			case EUserStatus.DO_NOT_DISTURB:
				return <MezonIconCDN icon={IconCDN.disturbStatusIcon} color="#F23F43" width={mobileIconSize} height={mobileIconSize} />;

			case EUserStatus.INVISIBLE:
				return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#AEAEAE" width={iconSize} height={iconSize} />;

			default:
				if (status?.isMobile) {
					return <MezonIconCDN icon={IconCDN.mobileDeviceIcon} color="#16A34A" width={mobileIconSize} height={mobileIconSize} />;
				}
				if (status?.status || status?.online)
					return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#16A34A" width={iconSize} height={iconSize} />;

				return <MezonIconCDN icon={IconCDN.onlineStatusIcon} color="#AEAEAE" width={iconSize} height={iconSize} />;
		}
	}, [customStatus, iconSize, mobileIconSize, status]);

	return (
		<View
			style={{
				position: 'absolute',
				bottom: -size.s_2,
				right: -size.s_4,
				backgroundColor: themeValue.tertiary,
				padding: size.s_2,
				borderRadius: size.s_20,
				...(customStyles && customStyles)
			}}
		>
			{onlineStatus}
		</View>
	);
});
