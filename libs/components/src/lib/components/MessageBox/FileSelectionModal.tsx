import { useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { useRef } from 'react';

export type FileSelectionModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onUploadFile: () => void;
	onCreatePoll?: () => void;
	buttonRef?: React.RefObject<HTMLDivElement>;
};

function FileSelectionModal({ isOpen, onClose, onUploadFile, onCreatePoll, buttonRef: _buttonRef }: FileSelectionModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
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
							className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bgLightModeButton dark:hover:bg-bgTertiary transition-colors text-left text-textLightTheme dark:text-textDarkTheme hover:text-textLightTheme dark:hover:text-white rounded-md"
						>
							<span className="text-textSecondary dark:text-textDarkTheme">{item.icon}</span>
							<span className="font-medium text-[15px]">{item.label}</span>
						</button>
					))}
				</div>
			</div>
		</>
	);
}

export default FileSelectionModal;
