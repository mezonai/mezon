import { notificationService } from '@mezon/utils';
import { useEffect } from 'react';

export const useNotificationDisconnect = (isLogin: boolean) => {
	useEffect(() => {
		if (!isLogin && notificationService.isActive) {
			notificationService.disconnectAll();
		}
	}, [isLogin]);
};
