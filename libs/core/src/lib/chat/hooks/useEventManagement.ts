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
			channelVoiceId: string,
			address: string,
			title: string,
			startTime: string,
			endTime: string,
			description: string,
			logo: string,
			channelId: string,
			repeatType: ERepeatType,
			isPrivate: boolean
		) => {
			await dispatch(
				eventManagementActions.fetchCreateEventManagement({
					clanId,
					channelVoiceId,
					address,
					title,
					startTime,
					endTime,
					description,
					logo,
					channelId,
					repeatType,
					isPrivate
				})
			);
		},
		[dispatch]
	);

	const deleteEventManagement = useCallback(
		async (clanId: string, eventId: string, creatorId: string, label: string) => {
			await dispatch(
				eventManagementActions.fetchDeleteEventManagement({ clanId: clanId, eventID: eventId, creatorId: creatorId, eventLabel: label })
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
