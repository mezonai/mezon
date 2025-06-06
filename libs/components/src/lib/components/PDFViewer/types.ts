import type { PDFDocumentProxy } from 'pdfjs-dist';

export type { PDFDocumentProxy };

export interface PDFViewerModalProps {
	isOpen: boolean;
	onClose: () => void;
	pdfUrl: string;
	filename?: string;
}

export interface PDFControlsProps {
	pageNumber: number;
	numPages?: number;
	scale: number;
	onPrevPage: () => void;
	onNextPage: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onResetZoom: () => void;
}

export interface PDFHeaderProps {
	filename: string;
	onClose: () => void;
}

export interface PDFContentProps {
	pdfUrl: string;
	pageNumber: number;
	scale: number;
	loading: boolean;
	error: string | null;
	containerWidth?: number;
	onDocumentLoadSuccess: (pdf: PDFDocumentProxy) => void;
	onDocumentLoadError: (error: Error) => void;
	onContainerRef: (ref: HTMLElement | null) => void;
}

export interface IconProps {
	className?: string;
}
