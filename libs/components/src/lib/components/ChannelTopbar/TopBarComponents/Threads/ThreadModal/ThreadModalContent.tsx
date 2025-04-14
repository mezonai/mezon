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
		<div className="w-full overflow-x-hidden">
			<p className="text-base font-normal dark:text-textThreadPrimary text-bgPrimary whitespace-nowrap overflow-x-hidden">
				{(message?.content?.t as string) ??
					(thread.last_sent_message && checkType
						? safeJSONParse(thread.last_sent_message.content || '{}')?.t || ''
						: (thread.last_sent_message?.content as unknown as ContentProps)?.t || '')}
			</p>
		</div>
	);
};

export default ThreadModalContent;
