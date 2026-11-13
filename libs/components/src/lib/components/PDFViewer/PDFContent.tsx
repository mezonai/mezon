import { MezonIcon, MzIcons48 } from '@mezon/ui';
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFContentProps } from './types';

const pdfOptions = {
	cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
	cMapPacked: true,
	standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
};

const maxWidth = 800;
const defaultPageRatio = Math.SQRT2;

export const PDFContent: React.FC<PDFContentProps> = ({
	pdfUrl,
	numPages,
	pageRatios,
	visibleRange,
	scale,
	loading,
	error,
	containerWidth,
	onDocumentLoadSuccess,
	onDocumentLoadError,
	onContainerRef,
	onScroll,
	onItemClick
}) => {
	const getPageWidth = (): number => {
		if (!containerWidth) return maxWidth * scale;
		const availableWidth = containerWidth - 40;
		const baseWidth = Math.min(availableWidth, maxWidth);
		return baseWidth * scale;
	};

	const pageWidth = getPageWidth();

	return (
		<div
			className="thread-scroll flex-1 overflow-auto p-4 flex justify-center bg-white dark:bg-[#36393f] outline-none"
			ref={onContainerRef}
			onScroll={onScroll}
			tabIndex={-1}
		>
			{loading && (
				<div className="flex items-center justify-center h-full">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2]" />
				</div>
			)}

			{error && (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<MezonIcon icon={MzIcons48.mzWarning} className="mx-auto mb-2 text-[#ed4245]" />
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
						onItemClick={onItemClick}
						loading={<div></div>}
						options={pdfOptions}
						className="react-pdf__Document flex flex-col gap-4"
						externalLinkTarget="_blank"
					>
						{Array.from({ length: numPages || 0 }, (_, index) => {
							const page = index + 1;
							const shouldRender = page >= visibleRange.start - 1 && page <= visibleRange.end + 1;
							return (
								<div
									key={page}
									data-pdf-page={page}
									className="bg-white shadow-md"
									style={{ width: pageWidth, minHeight: pageWidth * (pageRatios[index] ?? pageRatios[0] ?? defaultPageRatio) }}
								>
									{shouldRender && <Page pageNumber={page} width={pageWidth} loading={<div></div>} className="react-pdf__Page" />}
								</div>
							);
						})}
					</Document>
				</div>
			)}
		</div>
	);
};
