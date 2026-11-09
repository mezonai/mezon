import { useEscapeKeyClose } from '@mezon/core';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type FileSelectionModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onUploadFile: () => void;
	onCreatePoll?: () => void;
	buttonRef?: React.RefObject<HTMLDivElement>;
};

function FileSelectionModal({ isOpen, onClose, onUploadFile, onCreatePoll, buttonRef: _buttonRef }: FileSelectionModalProps) {
	const { t } = useTranslation('message');
	const modalRef = useRef<HTMLDivElement>(null);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	useEscapeKeyClose(modalRef, onClose);

	if (!isOpen) return null;

	const menuItems = [
		{
			icon: <MezonIcon icon={MzIcons20.mzImageAdd} />,
			label: t('fileSelection.uploadFile'),
			onClick: () => {
				onUploadFile();
				onClose();
			}
		},
		...(onCreatePoll
			? [
					{
						icon: <MezonIcon icon={MzIcons20.mzListCheck} className="text-[rgba(7,151,7,1)]" />,
						label: t('fileSelection.createPoll'),
						onClick: () => {
							onCreatePoll();
							onClose();
						}
					}
				]
			: [])
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
				<div className="p-2 bg-theme-primary rounded-lg">
					{menuItems.map((item, index) => (
						<button
							key={index}
							onClick={item.onClick}
							onMouseEnter={() => setHoveredIndex(index)}
							onMouseLeave={() => setHoveredIndex(null)}
							className={`mz-hover w-full px-4 py-3 flex items-center gap-3 transition-colors text-left rounded-md ${
								hoveredIndex === index ? 'bg-theme-input text-theme-primary-active' : 'text-theme-primary'
							}`}
							data-e2e={generateE2eId('poll.button.option')}
						>
							<span className={hoveredIndex === index ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}>{item.icon}</span>
							<span className="font-medium text-[15px]">{item.label}</span>
						</button>
					))}
				</div>
			</div>
		</>
	);
}

export default FileSelectionModal;
