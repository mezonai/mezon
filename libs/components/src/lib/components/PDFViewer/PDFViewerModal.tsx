import type { FC } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { PDFContent } from './PDFContent';
import { PDFControls } from './PDFControls';
import type { PDFDocumentProxy, PDFViewerModalProps } from './types';

async function validateWorkerPath(path: string): Promise<boolean> {
	try {
		const response = await fetch(path, { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
}

async function setupPDFWorker(): Promise<void> {
	const possiblePaths = [`https://cdn.komu.vn/js/libs/4.8.69/pdf.worker.min.mjs`];

	for (const path of possiblePaths) {
		try {
			const isValid = await validateWorkerPath(path);

			if (isValid) {
				pdfjs.GlobalWorkerOptions.workerSrc = path;
				return;
			}
		} catch (error) {
			console.warn('Failed to validate PDF worker path:', path, error);
		}
	}

	const fallbackUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
	pdfjs.GlobalWorkerOptions.workerSrc = fallbackUrl;
}

const pageScrollOffset = 16;

const isTypingTarget = (target: EventTarget | null) =>
	target instanceof HTMLElement && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

export const PDFViewerModal: FC<PDFViewerModalProps> = ({ isOpen, onClose, pdfUrl, filename = 'Document.pdf' }) => {
	const [numPages, setNumPages] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [scale, setScale] = useState<number>(1.0);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>();
	const [workerReady, setWorkerReady] = useState<boolean>(false);
	const [pageRatios, setPageRatios] = useState<number[]>([]);
	const [visibleRange, setVisibleRange] = useState({ start: 1, end: 1 });
	const scrollRatioRef = useRef(0);

	const updateVisiblePages = useCallback(() => {
		if (!containerRef) return;
		const { top, bottom } = containerRef.getBoundingClientRect();
		const pages = containerRef.querySelectorAll<HTMLElement>('[data-pdf-page]');
		let start = 0;
		let end = 0;
		let current = 0;
		let maxVisibleRatio = 0;
		for (let index = 0; index < pages.length; index++) {
			const rect = pages[index].getBoundingClientRect();
			if (rect.bottom <= top) continue;
			if (rect.top >= bottom) break;
			const visibleRatio = (Math.min(rect.bottom, bottom) - Math.max(rect.top, top)) / rect.height;
			if (!start) start = index + 1;
			end = index + 1;
			if (visibleRatio > maxVisibleRatio) {
				maxVisibleRatio = visibleRatio;
				current = index + 1;
			}
		}
		scrollRatioRef.current = containerRef.scrollHeight ? containerRef.scrollTop / containerRef.scrollHeight : 0;
		if (!current) return;
		setPageNumber(current);
		setVisibleRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
	}, [containerRef]);

	const scrollToPage = useCallback(
		(page: number) => {
			if (!containerRef) return;
			const target = Math.min(Math.max(page, 1), numPages || 1);
			const element = containerRef.querySelector<HTMLElement>(`[data-pdf-page="${target}"]`);
			if (!element) return;
			setPageNumber(target);
			containerRef.scrollTop += element.getBoundingClientRect().top - containerRef.getBoundingClientRect().top - pageScrollOffset;
		},
		[containerRef, numPages]
	);

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
			updateVisiblePages();
		});

		resizeObserver.observe(containerRef);

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef, updateVisiblePages]);

	useEffect(() => {
		containerRef?.focus({ preventScroll: true });
	}, [containerRef]);

	useEffect(() => {
		if (!containerRef) return;
		const handleWheel = (event: WheelEvent) => {
			if (!event.ctrlKey) return;
			event.preventDefault();
			setScale((prev) => Math.min(Math.max(prev * Math.exp(-event.deltaY * 0.002), 0.5), 3.0));
		};
		containerRef.addEventListener('wheel', handleWheel, { passive: false });
		return () => containerRef.removeEventListener('wheel', handleWheel);
	}, [containerRef]);

	useLayoutEffect(() => {
		if (!containerRef) return;
		containerRef.scrollTop = scrollRatioRef.current * containerRef.scrollHeight;
	}, [containerRef, scale]);

	useEffect(() => {
		updateVisiblePages();
	}, [updateVisiblePages, numPages, pageRatios, scale]);

	const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
		setNumPages(pdf.numPages);
		setLoading(false);
		setError(null);
		Promise.all(Array.from({ length: pdf.numPages }, (_, index) => pdf.getPage(index + 1)))
			.then((pages) =>
				setPageRatios(
					pages.map((page) => {
						const { width, height } = page.getViewport({ scale: 1 });
						return height / width;
					})
				)
			)
			.catch((error) => console.error('PDF page size error:', error));
	}, []);

	const onItemClick = useCallback(({ pageNumber: page }: { pageNumber: number }) => scrollToPage(page), [scrollToPage]);

	const onDocumentLoadError = useCallback((error: Error) => {
		setError('Failed to load PDF document');
		setLoading(false);
		console.error('PDF Load Error:', error);
	}, []);

	const goToPrevPage = (): void => {
		scrollToPage(pageNumber - 1);
	};

	const goToNextPage = (): void => {
		scrollToPage(pageNumber + 1);
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
				case 'ArrowRight':
					if (isTypingTarget(event.target)) break;
					event.preventDefault();
					scrollToPage(pageNumber + (event.key === 'ArrowLeft' ? -1 : 1));
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
		[isOpen, pageNumber, scrollToPage]
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
				numPages={numPages}
				pageRatios={pageRatios}
				visibleRange={visibleRange}
				scale={scale}
				loading={loading}
				error={error}
				containerWidth={containerWidth}
				onDocumentLoadSuccess={onDocumentLoadSuccess}
				onDocumentLoadError={onDocumentLoadError}
				onContainerRef={setContainerRef}
				onScroll={updateVisiblePages}
				onItemClick={onItemClick}
			/>
		</div>
	);
};
