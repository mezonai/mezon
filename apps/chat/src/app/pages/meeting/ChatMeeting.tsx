import type { ChatProps, ReceivedChatMessage } from '@livekit/components-react';
import { useChat } from '@livekit/components-react';
import { selectOpenExternalChatBox } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

const ChatStreamExternal = () => {
	const chatOptions: ChatProps = React.useMemo(() => {
		return { messageDecoder: undefined, messageEncoder: undefined, channelTopic: undefined };
	}, []);

	const { send, chatMessages } = useChat(chatOptions);
	const openChatBox = useSelector(selectOpenExternalChatBox);
	const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (!event.shiftKey && event.key === 'Enter') {
			const value = (event.target as HTMLInputElement).value.trim();
			if (!value) return;
			send(value);
			(event.target as HTMLInputElement).value = '';
		}
	};
	return (
		<>
			{openChatBox && (
				<div className="max-w-[480px] bg-[#111] min-w-[300px] w-1/4 h-full flex-col flex p-2 py-4 gap-2 select-text">
					<div className="flex-1 bg-bgPrimary rounded-md flex flex-col gap-2 overflow-y-auto thread-scroll">
						{chatMessages.map((message) => (
							<MessageItem message={message} />
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
};

const MessageItem = ({ message }: { message: ReceivedChatMessage }) => {
	const parsed = safeJSONParse(message.from?.metadata || `{ "extName": "Guest" }`);
	const nameSender = parsed.extName || message.from?.name || 'Guest';
	const avatarUrl = parsed.extAvatar || '';
	const time = useMemo(() => {
		const timestamp = message?.timestamp;
		const date = new Date(timestamp);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}, []);
	return (
		<div className="flex flex-row gap-2 p-2">
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
				<p className="text-sm break-words">{message.message}</p>
			</div>
		</div>
	);
};

export default ChatStreamExternal;
