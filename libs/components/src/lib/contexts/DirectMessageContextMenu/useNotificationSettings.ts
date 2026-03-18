import type { MuteChannelPayload } from '@mezon/store';
import { notificationSettingActions, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { EMuteState, type INotificationUserChannel } from '@mezon/utils';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface UseNotificationSettingsParams {
	channelId?: string;
	notificationSettings?: INotificationUserChannel | null;
	getChannelId?: string;
}

export function useNotificationSettings({ channelId, notificationSettings, getChannelId }: UseNotificationSettingsParams) {
	const { t } = useTranslation('directMessage');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const [mutedUntilText, setMutedUntilText] = useState<string>('');
	const [nameChildren, setNameChildren] = useState<string>('');

	const muteOrUnMuteChannel = useCallback(
		(channelId: string, active: number) => {
			if (!channelId) return;
			dispatch(notificationSettingActions.updateNotiState({ channelId, active }));
			const body = {
				channel_id: channelId,
				mute_time: 0,
				active
			};

			dispatch(notificationSettingActions.setMuteChannel(body));
		},
		[dispatch]
	);

	const handleScheduleMute = useCallback(
		(channelId: string, duration: number) => {
			if (!channelId) return;
			const body: MuteChannelPayload = {
				channel_id: channelId,
				mute_time: duration,
				clan_id: currentClanId || ''
			};
			dispatch(notificationSettingActions.setMuteChannel(body));
		},
		[dispatch, currentClanId]
	);

	const getNotificationSetting = useCallback(
		async (channelId?: string) => {
			if (channelId) {
				await dispatch(
					notificationSettingActions.getNotificationSetting({
						channelId
					})
				);
			}
		},
		[dispatch]
	);

	useEffect(() => {
		const timeMute = notificationSettings?.time_mute_seconds;

		setNameChildren(timeMute ? t('contextMenu.unmute') : t('contextMenu.mute'));

		const mutedText =
			timeMute && timeMute !== EMuteState.MUTED_INFINITY
				? t('contextMenu.mutedUntil', {
						time: format(new Date(timeMute), 'dd/MM, HH:mm')
					})
				: '';

		setMutedUntilText(mutedText);
	}, [notificationSettings, t]);

	return {
		mutedUntilText,
		nameChildren,
		muteOrUnMuteChannel,
		handleScheduleMute,
		getNotificationSetting
	};
}
