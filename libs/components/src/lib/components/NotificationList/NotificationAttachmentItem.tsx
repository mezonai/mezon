import { attachmentActions, useAppDispatch } from '@mezon/store';
import { Button, Icons } from '@mezon/ui';
import type { ApiMessageAttachment } from 'mezon-js';
import { Suspense, lazy, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePopup } from '../DraggablePopup';
import { PDFFooter, PDFHeader } from '../PDFViewer';
import { RenderAttachmentThumbnail } from '../ThumbnailAttachmentRender';

const PDFViewerModal = lazy(() => import('../PDFViewer').then((module) => ({ default: module.PDFViewerModal })));

function formatFileSize(bytes?: number) {
	if (!bytes || typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '';
	if (bytes >= 1000000) {
		return `${(bytes / 1000000).toFixed(1)} MB`;
	} else if (bytes >= 1000) {
		return `${(bytes / 1000).toFixed(1)} kB`;
	} else {
		return `${bytes} bytes`;
	}
}

const PDFLoadingFallback = () => {
	const { t } = useTranslation();
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="relative w-[90vw] h-[90vh] max-w-4xl bg-gray-50 dark:bg-[#2f3136] rounded-lg shadow-xl flex items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200 dark:border-[#202225]" />
					<p className="text-sm transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe]">
						{t('loadingPdfViewer', { defaultValue: 'Loading PDF Viewer...' })}
					</p>
				</div>
			</div>
		</div>
	);
};

export type NotificationAttachmentItemProps = {
	readonly attachment: ApiMessageAttachment;
	readonly index: number;
	readonly compact?: boolean;
};

export const NotificationAttachmentItem = ({ attachment, index, compact = false }: NotificationAttachmentItemProps) => {
	const { t } = useTranslation(['channelTopbar', 'common']);
	const dispatch = useAppDispatch();
	const isPDF = Boolean(attachment?.filetype === 'application/pdf' || attachment?.filename?.toLowerCase().endsWith('.pdf'));
	const isImageOrVideo = Boolean(
		attachment?.filetype?.startsWith('image/') ||
			attachment?.filetype?.startsWith('video/') ||
			attachment?.filename?.match(/\.(jpeg|jpg|png|gif|webp|svg|mp4|mov|webm)$/i)
	);

	const isMedia = isPDF || isImageOrVideo;

	const createPDFHeader = useCallback(
		(closePopup: () => void, maximizeToggle: () => void) => {
			return isPDF ? <PDFHeader filename={attachment?.filename || 'Document'} onClose={closePopup} onMaximize={maximizeToggle} /> : undefined;
		},
		[isPDF, attachment?.filename]
	);

	const createPDFFooter = useCallback(
		(_closePopup: () => void, _maximizeToggle: () => void) => {
			return isPDF ? <PDFFooter filename={attachment?.filename || 'Document'} /> : undefined;
		},
		[isPDF, attachment?.filename]
	);

	const [openPDFViewer] = usePopup(
		({ closePopup }: { closePopup: () => void }) => {
			if (isPDF && attachment?.url) {
				return (
					<Suspense fallback={<PDFLoadingFallback />}>
						<PDFViewerModal isOpen={true} onClose={closePopup} pdfUrl={attachment.url} filename={attachment.filename} />
					</Suspense>
				);
			}
			return null;
		},
		{
			customHeaderFactory: ({ closePopup, maximizeToggle }) => createPDFHeader(closePopup, maximizeToggle),
			customFooterFactory: ({ closePopup, maximizeToggle }) => createPDFFooter(closePopup, maximizeToggle),
			initialPosition: 'center',
			initialWidth: 800,
			initialHeight: 600,
			minWidth: 600,
			minHeight: 400,
			popupId: `pdf-viewer-${attachment?.filename || 'doc'}-${attachment?.url || index}`
		}
	);

	const handleDownload = async (event: React.MouseEvent) => {
		event.stopPropagation();
		const url = attachment?.url;
		if (!url) return;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				window.open(url, '_blank');
				return;
			}
			const blob = await response.blob();
			const dataUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = attachment?.filename || 'attachment';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(dataUrl);
		} catch {
			window.open(url, '_blank');
		}
	};

	const handleView = (event: React.MouseEvent) => {
		event.stopPropagation();
		if (isPDF) {
			openPDFViewer();
		} else if (isImageOrVideo && attachment?.url) {
			dispatch(
				attachmentActions.setCurrentAttachment({
					id: attachment.url,
					url: attachment.url,
					filetype: attachment.filetype || '',
					filename: attachment.filename || '',
					filesize: String(attachment.size || 0)
				})
			);
			dispatch(attachmentActions.setAttachment(attachment.url));
			dispatch(attachmentActions.setOpenModalAttachment(true));
		} else if (attachment?.url) {
			handleDownload(event);
		}
	};

	const sizeText = formatFileSize(attachment?.size);
	const thumbnail = RenderAttachmentThumbnail({
		attachment,
		size: compact ? 'w-8 h-8' : 'w-10 h-10',
		isFileList: true
	});

	return (
		<div
			className={`flex items-center justify-between ${
				compact ? 'gap-2 p-2' : 'gap-3 p-3'
			} rounded-lg bg-theme-secondary/40 hover:bg-item-theme-hover transition-colors group border-theme-primary`}
		>
			<div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} min-w-0 flex-1`}>
				<div className="shrink-0 flex items-center justify-center cursor-pointer" onClick={handleView}>
					{thumbnail}
				</div>
				<div className="min-w-0 flex-1">
					<p
						className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-theme-primary truncate hover:text-blue-400 cursor-pointer`}
						title={attachment?.filename || t('attachment', { ns: 'common', defaultValue: 'Attachment' })}
						onClick={handleView}
					>
						{attachment?.filename || `${t('file', { ns: 'common', defaultValue: 'File' })} ${index + 1}`}
					</p>
					{sizeText && <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-zinc-400`}>{sizeText}</span>}
				</div>
			</div>

			<div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'} shrink-0`}>
				{isMedia && (
					<Button
						onClick={handleView}
						className={`${
							compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
						} rounded transition-all duration-200 btn-primary btn-primary-hover text-white font-medium cursor-pointer`}
						title={t('view', { ns: 'common', defaultValue: 'View' })}
					>
						{t('view', { ns: 'common', defaultValue: 'View' })}
					</Button>
				)}
				<Button
					onClick={handleDownload}
					className={`rounded-md ${
						compact ? 'w-7 h-7' : 'w-8 h-8'
					} flex justify-center items-center cursor-pointer bg-theme-contexify bg-secondary-button-hover border-theme-primary text-theme-primary-hover text-theme-primary transition-colors`}
					title={t('download', { ns: 'common', defaultValue: 'Download' })}
				>
					<Icons.Download defaultSize={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
				</Button>
			</div>
		</div>
	);
};

export default NotificationAttachmentItem;
