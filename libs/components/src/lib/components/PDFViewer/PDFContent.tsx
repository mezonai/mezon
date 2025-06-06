import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ExclamationIcon } from './icons';
import type { PDFContentProps } from './types';

const pdfOptions = {
	cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
	cMapPacked: true,
	standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
};

const maxWidth = 800;

export const PDFContent: React.FC<PDFContentProps> = ({
	pdfUrl,
	pageNumber,
	scale,
	loading,
	error,
	containerWidth,
	onDocumentLoadSuccess,
	onDocumentLoadError,
	onContainerRef
}) => {
	const getPageWidth = (): number => {
		if (!containerWidth) return maxWidth * scale;
		const availableWidth = containerWidth - 40;
		const baseWidth = Math.min(availableWidth, maxWidth);
		return baseWidth * scale;
	};

	return (
		<div className="thread-scroll flex-1 overflow-auto p-4 flex justify-center bg-white dark:bg-[#36393f]" ref={onContainerRef}>
			{loading && (
				<div className="flex items-center justify-center h-full">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2]" />
				</div>
			)}

			{error && (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<ExclamationIcon className="w-12 h-12 mx-auto mb-2 text-[#ed4245]" />
						<p className="text-[#ed4245] dark:text-[#ed4245]">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-2 px-4 py-2 text-sm text-white rounded transition-all duration-200 bg-[#5865f2] hover:opacity-90"
						>
							Retry
						</button>
					</div>
				</div>
			)}

			{!loading && !error && (
				<div className="flex flex-col items-center">
					<Document
						file={pdfUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						onLoadError={onDocumentLoadError}
						loading={<div></div>}
						options={pdfOptions}
						className="react-pdf__Document"
					>
						<Page pageNumber={pageNumber} width={getPageWidth()} loading={<div></div>} className="react-pdf__Page" />
					</Document>
				</div>
			)}
		</div>
	);
};
