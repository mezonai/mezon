import type { MessagesEntity } from '@mezon/store';

type TimelineContentProps = {
	message: MessagesEntity;
};

const TimelineContent = ({ message }: TimelineContentProps) => {
	const contentText = typeof message?.content === 'object' ? (message?.content as { t?: string })?.t : message?.content?.toString() || '';

	return (
		<div className="timeline-content">
			{contentText && <p className="text-base font-normal text-textPrimary dark:text-white leading-relaxed">{contentText}</p>}
		</div>
	);
};

export { TimelineContent };
export default TimelineContent;
