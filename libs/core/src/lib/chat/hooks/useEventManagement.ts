import { EventManagementEntity, eventManagementActions, useAppDispatch } from '@mezon/store';
import { ERepeatType } from '@mezon/utils';
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
			start_time: string,
			end_time: string,
			description: string,
			logo: string,
			channel_id: string,
			repeat_type: ERepeatType,
			is_private: boolean
		) => {
			await dispatch(
				eventManagementActions.fetchCreateEventManagement({
					clan_id,
					channel_voice_id,
					address,
					title,
					start_time,
					end_time,
					description,
					logo,
					channel_id,
					repeat_type,
					is_private
				})
			);
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
