import { SetMuteNotificationPayload, SetNotificationPayload, notificationSettingActions, useAppDispatch } from '@mezon/store';
import { EMuteState } from '@mezon/utils';
import { format } from 'date-fns';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useState } from 'react';

interface UseNotificationSettingsParams {
	channelId?: string;
	notificationSettings?: any;
	getChannelId?: string;
}

export function useNotificationSettings({ channelId, notificationSettings, getChannelId }: UseNotificationSettingsParams) {
	const dispatch = useAppDispatch();
	const [mutedUntilText, setMutedUntilText] = useState<string>('');
	const [nameChildren, setNameChildren] = useState<string>('');

	const muteOrUnMuteChannel = useCallback(
		(channelId: string, active: number) => {
			if (!channelId) return;

			const body = {
				channel_id: channelId,
				notification_type: 0,
				clan_id: '',
				active: active,
				is_current_channel: true
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		},
		[dispatch]
	);

	const handleScheduleMute = useCallback(
		(channelId: string, channelType: number, duration: number) => {
			if (!channelId) return;

			if (duration !== Infinity) {
				const now = new Date();
				const unmuteTime = new Date(now.getTime() + 5000);
				const unmuteTimeISO = unmuteTime.toISOString();

				const body: SetNotificationPayload = {
					channel_id: channelId,
					notification_type: 0,
					clan_id: '',
					time_mute: unmuteTimeISO,
					is_current_channel: true,
					is_direct: channelType === ChannelType.CHANNEL_TYPE_DM || channelType === ChannelType.CHANNEL_TYPE_GROUP
				};
				dispatch(notificationSettingActions.setNotificationSetting(body));
			} else {
				const body: SetMuteNotificationPayload = {
					channel_id: channelId,
					notification_type: 0,
					clan_id: '',
					active: EMuteState.MUTED,
					is_current_channel: true
				};
				dispatch(notificationSettingActions.setMuteNotificationSetting(body));
			}
		},
		[dispatch]
	);

	const getNotificationSetting = useCallback(
		async (channelId?: string) => {
			if (channelId) {
				await dispatch(
					notificationSettingActions.getNotificationSetting({
						channelId: channelId
					})
				);
			}
		},
		[dispatch]
	);

	useEffect(() => {
		const checkUnMute = notificationSettings?.active !== EMuteState.MUTED || notificationSettings?.id === '0';
		const checkMuteTime = notificationSettings?.time_mute ? new Date(notificationSettings?.time_mute) > new Date() : false;

		if (checkUnMute && !checkMuteTime) {
			setNameChildren(`Mute`);
			setMutedUntilText('');
		} else {
			setNameChildren(`UnMute`);
		}

		if (notificationSettings?.time_mute && checkUnMute) {
			const timeMute = new Date(notificationSettings.time_mute);
			const currentTime = new Date();
			if (timeMute > currentTime) {
				const formattedDate = format(timeMute, 'dd/MM, HH:mm');
				setMutedUntilText(`Muted until ${formattedDate}`);
			}
		}
	}, [notificationSettings, dispatch, getChannelId]);

	return {
		mutedUntilText,
		nameChildren,
		muteOrUnMuteChannel,
		handleScheduleMute,
		getNotificationSetting
	};
}
