import { selectAllAccount, selectOpenExternalChatBox } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

interface MessageExternal {
	id: string;
	timestamp?: number;
	name?: string;
	content?: string;
	avatar?: string;
}

export type ExternalChatRef = {
	setMessages: React.Dispatch<React.SetStateAction<string[]>>;
};

interface ChatStreamExternalProps {
	handleWriteChatExternal: (message: string) => void;
	userId: string;
	name?: string;
	avatar?: string;
}

const ChatStreamExternal = forwardRef<ExternalChatRef, ChatStreamExternalProps>(({ name, avatar, handleWriteChatExternal, userId }, ref) => {
	const openChatBox = useSelector(selectOpenExternalChatBox);
	const profile = useSelector(selectAllAccount);
	const [messages, setMessages] = useState<string[]>([]);

	useImperativeHandle(ref, () => ({
		setMessages
	}));

	const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (!event.shiftKey && event.key === 'Enter') {
			const value = event.currentTarget.value.trim();

			if (!value) return;

			const message: MessageExternal = {
				id: userId,
				content: value,
				timestamp: Date.now(),
				name: profile?.user?.display_name || profile?.user?.username || name || '',
				avatar: profile?.user?.avatar_url || avatar || ''
			};

			handleWriteChatExternal(JSON.stringify(message));

			event.currentTarget.value = '';
			setMessages((pre) => [...pre, JSON.stringify(message)]);
		}
	};

	return (
		<>
			{openChatBox && (
				<div className="max-w-[480px] bg-[#111] min-w-[300px] w-1/4 h-full flex-col flex p-2 py-4 gap-2 select-text">
					<div className="flex-1 bg-bgPrimary rounded-md flex flex-col gap-2 overflow-y-auto thread-scroll">
						{messages.map((message) => (
							<MessageItem key={message} message={message} />
						))}
					</div>

					<div id="external_chat" className="w-full h-10">
						<input
							placeholder="Write your thought..."
							className="text-white bg-channelTextarea w-full h-full rounded-full outline-none px-4"
							onKeyDown={handleSendMessage}
						/>
					</div>
				</div>
			)}
		</>
	);
});

ChatStreamExternal.displayName = 'ChatStreamExternal';

const MessageItem = ({ message }: { message: string }) => {
	const parsed = safeJSONParse(message) as MessageExternal;

	const nameSender = parsed.name || 'Guest';
	const avatarUrl = parsed.avatar || '';

	const time = useMemo(() => {
		const timestamp = parsed?.timestamp || Date.now();
		const date = new Date(timestamp);

		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');

		return `${hours}:${minutes}`;
	}, []);

	return (
		<div className="flex flex-row gap-2 p-2 text-contentPrimary">
			<div className="flex-shrink-0 pt-1">
				{avatarUrl ? (
					<img src={avatarUrl} alt={nameSender} className="w-8 h-8 rounded-full object-cover" />
				) : (
					<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
						{nameSender.charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			<div className="flex flex-col min-w-0">
				<p className="text-base font-semibold leading-5">
					{nameSender}
					<span className="font-normal text-xs text-gray-400 ml-2">{time}</span>
				</p>

				<p className="text-sm break-words">{parsed.content}</p>
			</div>
		</div>
	);
};

export default ChatStreamExternal;
