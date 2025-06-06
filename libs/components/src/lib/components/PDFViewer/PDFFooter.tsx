import React from 'react';

interface PDFFooterProps {
	filename?: string;
	currentPage?: number;
	totalPages?: number;
}

export const PDFFooter: React.FC<PDFFooterProps> = ({ filename = 'Document.pdf', currentPage = 1, totalPages = 1 }) => {
	return (
		<div className="px-4 py-2 border-t border-gray-200 dark:border-[#202225] bg-gray-50 dark:bg-[#2f3136] text-xs text-gray-500 dark:text-[#b9bbbe]">
			<div className="flex justify-between items-center">
				<span>Use keyboard shortcuts: ← → for navigation</span>
			</div>
		</div>
	);
};
