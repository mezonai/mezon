import React from 'react';
import { CloseIcon } from './icons';
import type { PDFHeaderProps } from './types';

const MaximizeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
		/>
	</svg>
);

interface EnhancedPDFHeaderProps extends PDFHeaderProps {
	onMaximize?: () => void;
}

export const PDFHeader: React.FC<EnhancedPDFHeaderProps> = ({ filename, onClose, onMaximize }) => {
	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		onClose();
	};

	const handleMaximize = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		if (onMaximize) {
			onMaximize();
		}
	};

	return (
		<div className="flex items-center justify-between px-4 pt-1 border-b border-gray-200 dark:border-[#202225] bg-gray-50 dark:bg-[#2f3136] rounded-t-lg">
			<h4 className="text-sm font-semibold truncate text-gray-900 dark:text-[#dcddde] overflow-hidden whitespace-nowrap text-ellipsis">
				{filename}
			</h4>
			<div className="flex items-center space-x-2">
				{onMaximize && (
					<button
						onClick={handleMaximize}
						className="p-2 rounded-full transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-200 dark:hover:bg-[#40444b]"
						title="Maximize (F11)"
					>
						<MaximizeIcon className="w-4 h-4" />
					</button>
				)}
				<button
					onClick={handleClose}
					className="p-2 rounded-full transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-200 dark:hover:bg-[#40444b]"
					title="Close (Esc)"
				>
					<CloseIcon className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
