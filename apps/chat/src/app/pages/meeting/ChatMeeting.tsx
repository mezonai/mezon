import { ChatProps, ReceivedChatMessage, useChat } from '@livekit/components-react';
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
			send((event.target as HTMLInputElement).value);
			(event.target as HTMLInputElement).value = '';
			// console.log('event: ', (event.target as HTMLInputElement).value);
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
	const nameSender = safeJSONParse(message.from?.identity || `{ extName: 'Guest' }`).extName || '';
	const time = useMemo(() => {
		const timestamp = message.timestamp; // Example timestamp in milliseconds
		const date = new Date(timestamp);

		// Extract hours and minutes
		const hours = date.getHours().toString().padStart(2, '0'); // Ensures two-digit format
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}, []);
	return (
		<div className={`flex flex-col p-2`}>
			<p className="text-base font-semibold leading-4">
				{nameSender}
				<span className="font-normal text-xs leading-4 ml-4">{time}</span>
			</p>
			<p className="text-sm">{message.message}</p>
		</div>
	);
};

export default ChatStreamExternal;
