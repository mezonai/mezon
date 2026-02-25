import type { ChannelTimeline } from '@mezon/store';
import { channelMediaActions, selectChannelMediaByChannelId, selectChannelMediaLoadingStatus, useAppDispatch, useAppSelector } from '@mezon/store';
import { useCallback, useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { CreateMilestoneModal } from './CreateMilestoneModal';
import { EventDetailView } from './EventDetailView';
import { EventsView } from './EventsView';
import { TimelineView } from './TimelineView';

type MediaChannelView = 'timeline' | 'events' | 'eventDetail';

interface EventDetailParams {
	eventId: string;
	startTimeSeconds: number;
}

interface MediaChannelProps {
	channelId: string;
	clanId: string;
}

export function MediaChannel({ channelId, clanId }: MediaChannelProps) {
	const dispatch = useAppDispatch();
	const [currentView, setCurrentView] = useState<MediaChannelView>('timeline');
	const [eventDetailParams, setEventDetailParams] = useState<EventDetailParams | null>(null);

	const events = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const loadingStatus = useAppSelector(selectChannelMediaLoadingStatus);

	const [showCreateModal, hideCreateModal] = useModal(() => {
		return <CreateMilestoneModal channelId={channelId} clanId={clanId} onClose={hideCreateModal} />;
	}, [channelId, clanId]);

	useEffect(() => {
		if (clanId && channelId) {
			dispatch(
				channelMediaActions.fetchChannelMedia({
					clan_id: clanId,
					channel_id: channelId,
					year: new Date().getFullYear(),
					limit: 50
				})
			);
		}
	}, [dispatch, clanId, channelId]);

	const handleNavigateToEvents = useCallback(() => {
		setCurrentView('events');
	}, []);

	const handleNavigateToEventDetail = useCallback((event: ChannelTimeline) => {
		setEventDetailParams({
			eventId: event.id,
			startTimeSeconds: event.start_time_seconds
		});
		setCurrentView('eventDetail');
	}, []);

	const handleBack = useCallback(() => {
		setCurrentView('timeline');
		setEventDetailParams(null);
	}, []);

	const handleOpenCreate = useCallback(() => {
		showCreateModal();
	}, [showCreateModal]);

	return (
		<div className="flex flex-col h-full w-full bg-theme-chat overflow-hidden">
			{currentView === 'timeline' && (
				<TimelineView
					channelId={channelId}
					clanId={clanId}
					events={events}
					loadingStatus={loadingStatus}
					onNavigateToEvents={handleNavigateToEvents}
					onNavigateToEventDetail={handleNavigateToEventDetail}
					onOpenCreate={handleOpenCreate}
				/>
			)}
			{currentView === 'events' && (
				<EventsView
					channelId={channelId}
					clanId={clanId}
					onBack={handleBack}
					onNavigateToEventDetail={handleNavigateToEventDetail}
					onOpenCreate={handleOpenCreate}
				/>
			)}
			{currentView === 'eventDetail' && eventDetailParams && (
				<EventDetailView
					channelId={channelId}
					clanId={clanId}
					eventId={eventDetailParams.eventId}
					startTimeSeconds={eventDetailParams.startTimeSeconds}
					onBack={handleBack}
				/>
			)}
		</div>
	);
}
