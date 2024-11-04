import { Icons, IUserStatusProps, OfflineStatus, OnlineStatus } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import useTabletLandscape from '../../hooks/useTabletLandscape';

export const UserStatus = React.memo(({ status, customStyles }: IUserStatusProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const iconSize = isTabletLandscape ? size.s_18 : size.s_12;
	const mobileIconSize = isTabletLandscape ? size.s_24 : size.s_16;

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
			{status?.isMobile ? (
				<Icons.IconMobileDevice width={mobileIconSize} height={mobileIconSize} />
			) : status?.status ? (
				<OnlineStatus width={iconSize} height={iconSize} />
			) : (
				<OfflineStatus width={iconSize} height={iconSize} />
			)}
		</Block>
	);
});
