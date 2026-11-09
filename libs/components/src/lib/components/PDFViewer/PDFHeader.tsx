import { MezonIcon, MzIcons16 } from '@mezon/ui';
import React from 'react';
import type { PDFHeaderProps } from './types';

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
						<MezonIcon icon={MzIcons16.mzFullscreen} />
					</button>
				)}
				<button
					onClick={handleClose}
					className="p-2 rounded-full transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-200 dark:hover:bg-[#40444b]"
					title="Close (Esc)"
				>
					<MezonIcon icon={MzIcons16.mzClose} />
				</button>
			</div>
		</div>
	);
};
