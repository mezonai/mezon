import { useAuth } from '@mezon/core';
import { selectAppDetail } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import flowService from '../../../services/flowService';

interface IMessage {
	message: {
		message: string;
		urlImage?: string[];
	};
	type: 'input' | 'output';
}

const VideoFileExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];

const FlowChatPopup = () => {
	const { flowId, applicationId } = useParams();
	const appDetail = useSelector(selectAppDetail);
	const [input, setInput] = useState('');
	const { userProfile } = useAuth();
	const [messages, setMessages] = useState<IMessage[]>([]);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!input) {
			toast.error('Please enter your message');
			return;
		}
		setMessages([...messages, { message: { message: input, urlImage: undefined }, type: 'input' }]);
		setInput('');
		try {
			const response: { message: string; urlImage: string } = await flowService.executionFlow(
				applicationId ?? '',
				appDetail.token ?? '',
				input,
				userProfile?.user?.username ?? ''
			);
			let urlImage: string[] | undefined = [];
			try {
				urlImage = JSON.parse(response.urlImage);
			} catch {
				urlImage = undefined;
			}
			if (!response.message && !urlImage) {
				response.message = 'Sorry, I dont know';
			}
			setMessages((prev) => [...prev, { message: { message: response.message, urlImage }, type: 'output' }]);
		} catch (error) {
			setMessages((prev) => [...prev, { message: { message: "Sory, I dont't know", urlImage: undefined }, type: 'output' }]);
		}
	};
	const scrollToBottom = () => {
		// scroll to bottom of chat
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const checkIsVideo = useCallback((url: string) => {
		const ext = url.split('.').pop();
		if (ext && VideoFileExtensions.includes(`.${ext}`)) {
			return true;
		}
		return false;
	}, []);

	useEffect(() => {
		// scroll to bottom of chat when new message is added
		if (messages.length > 0) {
			setTimeout(() => {
				scrollToBottom();
			}, 0);
		}
	}, [messages]);
	return (
		<div className="text-sm text-gray-500 dark:text-gray-200 max-w-[350px] w-[95vw]">
			<div className="flex items-center gap-2 p-2  bg-gray-200 dark:bg-gray-600">
				<div className="w-[40px] h-[40px]">
					<img alt="avt" src="../../../../assets/robot.png" className="w-[40px] h-[40px] rounded-full" />
				</div>
				<div>
					<span>Hi there! How can I help?</span>
				</div>
			</div>
			<div className="h-[55vh] overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:[width:3px] [&::-webkit-scrollbar-thumb]:bg-red-500 transition-all">
				{messages.map((message, index) => (
					<div
						key={index}
						className={`p-2 shadow-inner flex ${message.type === 'input' ? 'bg-gray-50 dark:bg-gray-600 justify-end text-end' : 'bg-gray-100 dark:bg-gray-700 justify-start'}`}
					>
						<div className="w-[75%]">
							<div
								style={message.type === 'output' ? { fontFamily: 'monospace', whiteSpace: 'pre' } : {}}
								className="overflow-x-auto [&::-webkit-scrollbar]:[height:3px] [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-200"
							>
								{typeof message.message.message === 'string' ? message.message.message : JSON.stringify(message.message.message)}
							</div>
							{message.message?.urlImage && message.message.urlImage?.length > 0 && (
								<div className="mt-2">
									{message.message.urlImage?.map((img, index) => (
										<div key={index} className="p-2 shadow-inner bg-[#ebeaead4] dark:bg-[#83818169] rounded-lg mb-1">
											{checkIsVideo(img) ? (
												<video controls autoPlay className="w-full rounded-md">
													<source src={img} type="video/mp4" />
												</video>
											) : (
												<img src={img} alt="img" className="max-w-[100%] object-cover rounded-md" />
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
			<form onSubmit={handleSubmit}>
				<div className="footer p-2 border-t-[1px] border-t-gray-400 relative">
					<input
						value={input}
						disabled={flowId === undefined}
						onChange={(e) => setInput(e.target.value)}
						className="my-1 block w-full px-3 py-3 border-[1px] ring-0 focus:border-[1px] focus:border-gray-500 focus-visible:border-[1px] focus:ring-0 focus-visible:border-gray-400 focus-within:ring-0 focus:ring-transparent rounded-lg dark:bg-gray-700"
					/>
					<button
						disabled={flowId === undefined}
						className=" w-[30px] h-[30px] flex items-center justify-center absolute right-[15px] top-[50%] rotate- translate-y-[-50%] bg-blue-500 hover:bg-blue-600 text-white rounded-md active:bg-blue-500 transition-all"
					>
						<Icons.ReplyRightClick />
					</button>
				</div>
			</form>
		</div>
	);
};
export default FlowChatPopup;
