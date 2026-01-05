import type { MuteChannelPayload } from '@mezon/store';
import { notificationSettingActions, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { EMuteState } from '@mezon/utils';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface UseNotificationSettingsParams {
	channelId?: string;
	notificationSettings?: any;
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
				channelId: channelId,
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
				channelId: channelId,
				mute_time: duration,
				active: EMuteState.MUTED,
				clanId: currentClanId || ''
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
		const hasActiveMuteTime = notificationSettings?.active === EMuteState.MUTED;
		setNameChildren(hasActiveMuteTime ? t('contextMenu.unmute') : t('contextMenu.mute'));

		const timeMute = notificationSettings?.time_mute;
		const isValidTimeMute = timeMute && timeMute !== null && timeMute !== undefined;

		setMutedUntilText(
			hasActiveMuteTime && isValidTimeMute
				? (() => {
						try {
							const muteDate = new Date(timeMute);
							if (isNaN(muteDate.getTime()) || muteDate.getFullYear() === 1) {
								return '';
							}
							return t('contextMenu.mutedUntil', { time: format(muteDate, 'dd/MM, HH:mm') });
						} catch (error) {
							console.error('Error formatting mute time:', error);
							return '';
						}
					})()
				: ''
		);
	}, [notificationSettings, t]);

	return {
		mutedUntilText,
		nameChildren,
		muteOrUnMuteChannel,
		handleScheduleMute,
		getNotificationSetting
	};
}
