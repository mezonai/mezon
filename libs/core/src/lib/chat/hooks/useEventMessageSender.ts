import {
	eventManagementActions,
	EventManagementEntity,
	selectChannelById,
	selectTriggerSendMessStateByEventId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	EEventStatus,
	getHashtagVoice,
	getMentionPosition,
	IHashtagOnMessage,
	IMentionOnMessage,
	IMessageSendPayload,
	TypeMessage
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useChatSending } from './useChatSending';

interface UseEventMessageSenderParams {
	event: EventManagementEntity;
	channelId: string;
}

export const useEventMessageSender = ({ event, channelId }: UseEventMessageSenderParams) => {
	const dispatch = useAppDispatch();
	const eventMatchChannel = event?.channel_id === channelId;
	const { userId } = useAuth();
	const matchUserId = event?.creator_id === userId;
	const channelEvent = useAppSelector((state) => selectChannelById(state, event?.channel_id ?? '')) || {};
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_voice_id ?? '')) || {};
	const triggerSendMessageState = useAppSelector((state) => selectTriggerSendMessStateByEventId(state, event?.id ?? ''));

	const isChannel = channelEvent?.parrent_id === '' || channelEvent?.parrent_id === '0';

	const eventIsUpcoming = event?.event_status === EEventStatus.UPCOMING;
	const eventIsOngoing = event?.event_status === EEventStatus.ONGOING;
	const availableEvent = eventIsUpcoming || eventIsOngoing;

	const { sendMessage } = useChatSending({
		channelOrDirect: channelEvent || undefined,
		mode: isChannel ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD,
		isEventMessage: true
	});

	const contentTextUpcoming = `Hi @here, the event ${event?.title} will start soon on ${channelVoice.channel_label}!`;
	const contentTextOngoing = `Hi @here, the event ${event?.title} has started on ${channelVoice.channel_label}! Join us to enjoy.`;
	const hashtagVoiceUpcoming = getHashtagVoice(contentTextUpcoming, channelVoice);
	const hashtagVoiceOngoing = getHashtagVoice(contentTextOngoing, channelVoice);
	const mentionHereUpcoming = getMentionPosition(contentTextUpcoming);
	const mentionHereOngoing = getMentionPosition(contentTextOngoing);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const payloadNoticeMess: IMessageSendPayload = {
		t: eventIsUpcoming ? contentTextUpcoming : eventIsOngoing ? contentTextOngoing : undefined,
		hg: eventIsUpcoming
			? ([hashtagVoiceUpcoming] as IHashtagOnMessage[])
			: eventIsOngoing
				? ([hashtagVoiceOngoing] as IHashtagOnMessage[])
				: undefined
	};

	const mentionPayload = eventIsUpcoming ? mentionHereUpcoming : eventIsOngoing ? mentionHereOngoing : {};

	useEffect(() => {
		const sendMessageAsync = async () => {
			sendMessage(payloadNoticeMess, [mentionPayload as IMentionOnMessage], [], [], false, true, false, TypeMessage.Welcome);
			dispatch(eventManagementActions.resetTriggerMessageStatus({ eventId: event.id }));
		};

		if (triggerSendMessageState && eventMatchChannel && matchUserId && availableEvent) {
			sendMessageAsync();
		}
	}, [eventIsUpcoming, eventIsOngoing, triggerSendMessageState]);
};
