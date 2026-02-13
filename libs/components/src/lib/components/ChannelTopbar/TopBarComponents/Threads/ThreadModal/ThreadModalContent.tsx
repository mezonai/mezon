import { ChannelsEntity, MessagesEntity } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';

type ThreadModalContentProps = {
	message: MessagesEntity;
	thread: ChannelsEntity;
};

type ContentProps = {
	t: string;
};

const ThreadModalContent = ({ message, thread }: ThreadModalContentProps) => {
	const checkType = useMemo(() => typeof thread.last_sent_message?.content === 'string', [thread.last_sent_message?.content]);

	return (
		<div className="w-full min-w-0 overflow-hidden">
			<p className="text-base font-normal text-theme-primary opacity-60 truncate">
				{(message?.content?.t as string) ??
					(thread.last_sent_message && checkType
						? safeJSONParse(thread.last_sent_message.content || '{}')?.t || ''
						: (thread.last_sent_message?.content as unknown as ContentProps)?.t || '')}
			</p>
		</div>
	);
};

export default ThreadModalContent;
