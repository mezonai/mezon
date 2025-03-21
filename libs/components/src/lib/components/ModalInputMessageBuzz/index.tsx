import { useOnClickOutside } from '@mezon/core';
import { MAX_LENGTH_MESSAGE_BUZZ } from '@mezon/utils';
import { useEffect, useRef } from 'react';

type ModalInputMessageBuzzProps = {
	messageText: string;
	setMessageText: (text: string) => void;
	onClose: () => void;
	onSend: () => void;
};

const ModalInputMessageBuzz: React.FC<ModalInputMessageBuzzProps> = ({ messageText, setMessageText, onClose, onSend }) => {
	const panelRef = useRef(null);
	const inputRef = useRef<HTMLInputElement>(null);
	useOnClickOutside(panelRef, onClose);
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			onSend();
		}
	};
	return (
		<div className="w-[100vw] h-[100vh] fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex justify-center items-center">
			<div ref={panelRef} className="bg-white dark:bg-gray-800 p-4 rounded-lg w-[400px]">
				<div className="flex justify-between mb-4">
					<h3 className="text-lg font-bold text-black dark:text-white">Enter your message buzz</h3>
					<button onClick={onClose} className="text-gray-500 hover:text-red-500">
						✕
					</button>
				</div>
				<div className="flex items-center gap-2">
					<input
						ref={inputRef}
						type="text"
						value={messageText}
						maxLength={MAX_LENGTH_MESSAGE_BUZZ}
						onChange={(e) => setMessageText(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white"
					/>
					<button onClick={onSend} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalInputMessageBuzz;
