import { notificationActions, selectMessageNotified, useAppDispatch } from '@mezon/store';
import { NotificationCategory } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useNotification() {
	const dispatch = useAppDispatch();
	const idMessageNotified = useSelector(selectMessageNotified);

	const deleteNotify = useCallback(
		(id: string, category: NotificationCategory) => {
			const ids = [id];
			dispatch(notificationActions.deleteNotify({ ids, category }));
		},
		[dispatch]
	);

	const setMessageNotifiedId = useCallback(
		(idMessageNotified: string) => {
			dispatch(notificationActions.setMessageNotifiedId(idMessageNotified));
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			deleteNotify,
			setMessageNotifiedId,
			idMessageNotified
		}),
		[deleteNotify, setMessageNotifiedId, idMessageNotified]
	);
}
