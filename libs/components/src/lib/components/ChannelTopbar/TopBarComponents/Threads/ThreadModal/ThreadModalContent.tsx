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
	const checkType = useMemo(() => typeof thread.lastSentMessage?.content === 'string', [thread.lastSentMessage?.content]);

	return (
		<div className="w-full overflow-x-hidden">
			<p className="text-base font-normal text-theme-primary opacity-60 whitespace-nowrap overflow-x-hidden">
				{(message?.content?.t as string) ??
					(thread.lastSentMessage && checkType
						? safeJSONParse(thread.lastSentMessage.content || '{}')?.t || ''
						: (thread.lastSentMessage?.content as unknown as ContentProps)?.t || '')}
			</p>
		</div>
	);
};

export default ThreadModalContent;
