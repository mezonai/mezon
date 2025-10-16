import type { ApiSdTopic } from 'mezon-js/dist/api.gen';
import TopicNotificationItem from './TopicNotificationItem';

type TopicNotificationProps = {
	topic?: ApiSdTopic;
	onCloseTooltip?: () => void;
};

export const TopicNotification = ({ topic, onCloseTooltip }: TopicNotificationProps) => {
	return (
		topic && (
			<div key={topic.id} className="flex flex-col gap-2 py-3 px-3 w-full">
				<TopicNotificationItem topic={topic} onCloseTooltip={onCloseTooltip} />
			</div>
		)
	);
};

export default TopicNotification;
