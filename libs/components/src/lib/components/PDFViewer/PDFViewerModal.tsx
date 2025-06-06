import isElectron from 'is-electron';
import { FC, useCallback, useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { PDFContent } from './PDFContent';
import { PDFControls } from './PDFControls';
import type { PDFDocumentProxy, PDFViewerModalProps } from './types';

function getPDFWorkerPath(): string {
	if (isElectron()) {
		const pathParts = window.location.pathname.split('/');
		const chatIndex = pathParts.findIndex((part) => part === 'chat');
		if (chatIndex !== -1) {
			const appPath = pathParts.slice(0, chatIndex + 1).join('/');
			return `file://${appPath}/pdf.worker.min.mjs`;
		} else {
			return 'file://' + window.location.pathname.replace(/\/index\.html.*$/, '/pdf.worker.min.mjs');
		}
	} else {
		const baseUrl = window.location.origin;
		const possiblePaths = [`${baseUrl}/pdf.worker.min.mjs`, `${baseUrl}/assets/pdf.worker.min.mjs`];
		return possiblePaths[0];
	}
}

async function validateWorkerPath(path: string): Promise<boolean> {
	try {
		const response = await fetch(path, { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
}

async function setupPDFWorker(): Promise<void> {
	if (isElectron()) {
		pdfjs.GlobalWorkerOptions.workerSrc = getPDFWorkerPath();
		return;
	}

	const baseUrl = window.location.origin;

	const possiblePaths = [
		`${baseUrl}/pdf.worker.min.mjs`,
		`${baseUrl}/assets/pdf.worker.min.mjs`,
		`${baseUrl}/pdf.worker.min.js`,
		`${baseUrl}/assets/pdf.worker.min.js`,
		`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
	];

	for (const path of possiblePaths) {
		const isValid = await validateWorkerPath(path);
		if (isValid) {
			pdfjs.GlobalWorkerOptions.workerSrc = path;
			return;
		}
	}

	pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export const PDFViewerModal: FC<PDFViewerModalProps> = ({ isOpen, onClose, pdfUrl, filename = 'Document.pdf' }) => {
	const [numPages, setNumPages] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [scale, setScale] = useState<number>(1.0);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>();
	const [workerReady, setWorkerReady] = useState<boolean>(false);

	useEffect(() => {
		let mounted = true;

		setupPDFWorker()
			.then(() => {
				if (mounted) {
					setWorkerReady(true);
				}
			})
			.catch((error) => {
				console.error('Failed to setup PDF worker:', error);
				if (mounted) {
					setError('Failed to initialize PDF viewer');
				}
			});

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (!containerRef) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const [entry] = entries;
			if (entry) {
				// setContainerWidth(entry.contentRect.width);
			}
		});

		resizeObserver.observe(containerRef);

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef]);

	const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: PDFDocumentProxy) => {
		setNumPages(nextNumPages);
		setLoading(false);
		setError(null);
	}, []);

	const onDocumentLoadError = useCallback((error: Error) => {
		setError('Failed to load PDF document');
		setLoading(false);
		console.error('PDF Load Error:', error);
	}, []);

	const goToPrevPage = (): void => {
		setPageNumber((prev) => Math.max(prev - 1, 1));
	};

	const goToNextPage = (): void => {
		setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
	};

	const zoomIn = (): void => {
		setScale((prev) => Math.min(prev + 0.2, 3.0));
	};

	const zoomOut = (): void => {
		setScale((prev) => Math.max(prev - 0.2, 0.5));
	};

	const resetZoom = (): void => {
		setScale(1.0);
	};

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!isOpen) return;

			switch (event.key) {
				case 'ArrowLeft':
					setPageNumber((prev) => Math.max(prev - 1, 1));
					break;
				case 'ArrowRight':
					setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
					break;
				case '=':
				case '+':
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						setScale((prev) => Math.min(prev + 0.2, 3.0));
					}
					break;
				case '-':
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						setScale((prev) => Math.max(prev - 0.2, 0.5));
					}
					break;
				case '0':
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						setScale(1.0);
					}
					break;
			}
		},
		[isOpen, numPages]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		if (isOpen) {
			setPageNumber(1);
			setScale(1.0);
			setError(null);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	if (!workerReady) {
		return (
			<div className="flex items-center justify-center bg-black bg-opacity-50">
				<div className="relative w-[95vw] h-[95vh] max-w-6xl bg-white dark:bg-[#36393f] rounded-lg shadow-xl flex items-center justify-center">
					<div className="flex flex-col items-center space-y-4">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
						<p className="text-sm text-gray-600 dark:text-gray-300">Initializing PDF viewer...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full bg-white dark:bg-[#36393f] flex flex-col">
			<PDFControls
				pageNumber={pageNumber}
				numPages={numPages}
				scale={scale}
				onPrevPage={goToPrevPage}
				onNextPage={goToNextPage}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onResetZoom={resetZoom}
			/>

			<PDFContent
				pdfUrl={pdfUrl}
				pageNumber={pageNumber}
				scale={scale}
				loading={loading}
				error={error}
				containerWidth={containerWidth}
				onDocumentLoadSuccess={onDocumentLoadSuccess}
				onDocumentLoadError={onDocumentLoadError}
				onContainerRef={setContainerRef}
			/>
		</div>
	);
};
