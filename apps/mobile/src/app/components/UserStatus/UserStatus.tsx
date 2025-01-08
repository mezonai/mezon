import { DisturbStatusIcon, Icons, IdleStatusIcon, IUserStatusProps, OfflineStatus, OnlineStatus } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { EUserStatus } from '@mezon/utils';
import React, { useMemo } from 'react';

export const UserStatus = React.memo(({ status, customStyles, iconSize = size.s_12, customStatus }: IUserStatusProps) => {
	const { themeValue } = useTheme();
	const mobileIconSize = iconSize + size.s_4;

	const onlineStatus = useMemo(() => {
		switch (customStatus) {
			case EUserStatus.IDLE:
				return <IdleStatusIcon width={mobileIconSize} height={mobileIconSize} />;

			case EUserStatus.DO_NOT_DISTURB:
				return <DisturbStatusIcon width={mobileIconSize} height={mobileIconSize} />;

			case EUserStatus.INVISIBLE:
				return <OfflineStatus width={iconSize} height={iconSize} />;

			default:
				if (!status?.status) return <OfflineStatus width={iconSize} height={iconSize} />;
				if (status?.isMobile) {
					return <Icons.IconMobileDevice width={mobileIconSize} height={mobileIconSize} />;
				}
				return <OnlineStatus width={iconSize} height={iconSize} />;
		}
	}, []);

	return (
		<Block
			position="absolute"
			bottom={-size.s_2}
			right={-size.s_4}
			backgroundColor={themeValue.tertiary}
			padding={size.s_2}
			borderRadius={size.s_20}
			{...(customStyles && customStyles)}
		>
			{onlineStatus}
		</Block>
	);
});
