import { useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { useRef, useState } from 'react';

export type FileSelectionModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onUploadFile: () => void;
	onCreatePoll?: () => void;
	buttonRef?: React.RefObject<HTMLDivElement>;
};

function FileSelectionModal({ isOpen, onClose, onUploadFile, onCreatePoll, buttonRef: _buttonRef }: FileSelectionModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	useEscapeKeyClose(modalRef, onClose);

	if (!isOpen) return null;

	const menuItems = [
		{
			icon: <Icons.SelectFileIcon className="w-5 h-5" />,
			label: 'Upload a File',
			onClick: () => {
				onUploadFile();
				onClose();
			}
		},
		{
			icon: <Icons.CheckListIcon className="w-5 h-5" />,
			label: 'Create Poll',
			onClick: () => {
				onCreatePoll?.();
				onClose();
			}
		}
	];

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} />

			<div
				ref={modalRef}
				tabIndex={-1}
				className="absolute bottom-full mb-2 left-0 z-50 bg-theme-setting-primary rounded-lg shadow-xl min-w-[200px]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-2">
					{menuItems.map((item, index) => (
						<button
							key={index}
							onClick={item.onClick}
							onMouseEnter={() => setHoveredIndex(index)}
							onMouseLeave={() => setHoveredIndex(null)}
							className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left rounded-md ${
								hoveredIndex === index ? 'bg-theme-input text-theme-primary-active' : 'text-theme-primary'
							}`}
						>
							<span className={hoveredIndex === index ? 'text-theme-primary-active' : 'text-theme-primary'}>{item.icon}</span>
							<span className="font-medium text-[15px]">{item.label}</span>
						</button>
					))}
				</div>
			</div>
		</>
	);
}

export default FileSelectionModal;
