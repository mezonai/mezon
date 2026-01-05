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
			clanId: string,
			channel_voice_id: string,
			address: string,
			title: string,
			start_time: string,
			end_time: string,
			description: string,
			logo: string,
			channelId: string,
			repeat_type: ERepeatType,
			is_private: boolean
		) => {
			await dispatch(
				eventManagementActions.fetchCreateEventManagement({
					clanId,
					channel_voice_id,
					address,
					title,
					start_time,
					end_time,
					description,
					logo,
					channelId,
					repeat_type,
					is_private
				})
			);
		},
		[dispatch]
	);

	const deleteEventManagement = useCallback(
		async (clanId: string, event_id: string, creatorId: string, label: string) => {
			await dispatch(
				eventManagementActions.fetchDeleteEventManagement({ clanId: clanId, eventID: event_id, creatorId: creatorId, eventLabel: label })
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
