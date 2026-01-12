import { EventManagementEntity, selectChannelById, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EEventStatus, openVoiceChannel } from '@mezon/utils';
import React from 'react';
import { timeFomat } from '../ChannelList/EventChannelModal/timeFomatEvent';

type EventScheduleProps = {
	event: EventManagementEntity;
	className?: string;
};

const EventSchedule: React.FC<EventScheduleProps> = ({ event, className }) => {
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channelVoiceId ?? '')) || {};
	const eventIsUpcoming = event?.eventStatus === EEventStatus.UPCOMING;
	const eventIsOngoing = event?.eventStatus === EEventStatus.ONGOING;
	const nearestEventAvaiable = eventIsUpcoming || eventIsOngoing;
	if (!nearestEventAvaiable) return null;
	const eventStatusNotice = eventIsUpcoming
		? 'The event will begin shortly. Get ready!'
		: eventIsOngoing
			? 'The event is happening now!'
			: 'Event has ended.';

	const cssEventStatus = eventIsUpcoming ? 'text-purple-500' : eventIsOngoing ? 'text-green-500' : '';

	const handleOpenVoiceChannel = () => {
		if (channelVoice?.meetingCode) {
			openVoiceChannel(channelVoice.meetingCode);
		}
	};

	return (
		<div
			className={className}
			onClick={handleOpenVoiceChannel}
			title={`Event: ${event.title}\n${eventStatusNotice}\n${timeFomat(event.startTime ?? '')}`}
		>
			<Icons.IconEvents defaultSize={`w-4 h-4 ${cssEventStatus}`} />
		</div>
	);
};

export default EventSchedule;
