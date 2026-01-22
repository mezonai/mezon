import type { EventManagementEntity } from '@mezon/store';
import { eventManagementActions, useAppDispatch } from '@mezon/store';
import type { ERepeatType } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useEventManagement() {
	const dispatch = useAppDispatch();

	const setChooseEvent = useCallback(
		async (event: EventManagementEntity) => {
			await dispatch(eventManagementActions.setChooseEvent(event));
		},
		[dispatch]
	);

	const createEventManagement = useCallback(
		async (
			clan_id: string,
			channel_voice_id: string,
			address: string,
			title: string,
			start_time_seconds: number,
			end_time_seconds: number,
			description: string,
			logo: string,
			channel_id: string,
			repeat_type: ERepeatType,
			is_private: boolean
		) => {
			const action = await dispatch(
				eventManagementActions.fetchCreateEventManagement({
					clan_id,
					channel_voice_id,
					address,
					title,
					start_time_seconds,
					end_time_seconds,
					description,
					logo,
					channel_id,
					repeat_type,
					is_private
				})
			);
			return (action as any)?.payload;
		},
		[dispatch]
	);

	const deleteEventManagement = useCallback(
		async (clan_id: string, event_id: string, creator_id: string, label: string) => {
			await dispatch(
				eventManagementActions.fetchDeleteEventManagement({ clanId: clan_id, eventID: event_id, creatorId: creator_id, eventLabel: label })
			);
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			createEventManagement,
			deleteEventManagement,
			setChooseEvent
		}),
		[createEventManagement, deleteEventManagement, setChooseEvent]
	);
}
