import type { RootState } from '@mezon/store';
import { getStore, selectBanMeInChannel, selectCurrentUserId, selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageWithUser } from '@mezon/utils';
import { DOWNLOAD_FILE, EFailAttachment, EMimeTypes, electronBridge } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import { Suspense, lazy, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalDeleteMess, RenderAttachmentThumbnail } from '../../components';
import { usePopup } from '../DraggablePopup';
import { PDFFooter, PDFHeader } from '../PDFViewer';
const PDFViewerModal = lazy(() => import('../PDFViewer').then((module) => ({ default: module.PDFViewerModal })));

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	readonly mode?: ChannelStreamMode;
	message?: IMessageWithUser;
};
function formatFileSize(bytes: number) {
	if (bytes >= 1000000) {
		return `${(bytes / 1000000).toFixed(1)} MB`;
	} else if (bytes >= 1000) {
		return `${(bytes / 1000).toFixed(1)} kB`;
	} else {
		return `${bytes} bytes`;
	}
}

export const AttachmentLoader = ({
	appearanceTheme
}: {
	appearanceTheme: 'light' | 'dark' | 'sunrise' | 'purple_haze' | 'redDark' | 'abyss_dark';
}) => {
	return (
		<div className="w-[30px] h-[30px] flex justify-center items-center">
			<div className={appearanceTheme === 'light' ? 'light-attachment-loader' : 'dark-attachment-loader'} />
		</div>
	);
};

const PDFLoadingFallback = () => {
	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
			<div
				className={`relative w-[90vw] h-[90vh] max-w-4xl bg-gray-50 dark:bg-[#2f3136] rounded-lg shadow-xl flex items-center justify-center`}
			>
				<div className="flex flex-col items-center space-y-4">
					<div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200 dark:border-[#202225]}`} />
					<p
						className={`text-sm transition-colors duration-200 text-gray-600 dark:text-[#b9bbbe] hover:bg-gray-200 dark:hover:bg-[#40444b]`}
					>
						Loading PDF Viewer...
					</p>
				</div>
			</div>
		</div>
	);
};

function MessageLinkFile({ attachmentData, mode, message }: MessageImage) {
	const handleDownload = async () => {
		// window.open(attachmentData.);
		const store = getStore();
		const appState = store.getState() as RootState;
		const isBanned = selectBanMeInChannel(appState, message?.channel_id || '');

		if (isBanned) {
			return;
		}
		const response = await fetch(attachmentData.url as string);
		if (!response.ok) {
			return;
		}
		if (isElectron()) {
			try {
				await electronBridge.invoke(DOWNLOAD_FILE, {
					url: attachmentData.url as string,
					defaultFileName: attachmentData.filename as string
				});
			} catch (error) {
				console.error('Error during download:', error);
			}
		} else {
			const blob = await response.blob();
			const dataUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = attachmentData.filename as string;
			a.click();
		}
	};
	const thumbnailAttachment = RenderAttachmentThumbnail({ attachment: attachmentData, size: 'w-8 h-10' });

	const hideTheInformationFile =
		attachmentData.filetype !== EMimeTypes.gif &&
		attachmentData.filetype !== EMimeTypes.png &&
		attachmentData.filetype !== EMimeTypes.jpeg &&
		attachmentData.filetype !== EMimeTypes.mp4;

	const isPDF = attachmentData.filetype === 'application/pdf' || attachmentData.filename?.toLowerCase().endsWith('.pdf');

	const [hoverShowOptButtonStatus, setHoverShowOptButtonStatus] = useState(false);
	const hoverOptButton = () => {
		setHoverShowOptButtonStatus(true);
	};

	const appearanceTheme = useSelector(selectTheme);
	const currentUserId = useSelector(selectCurrentUserId);
	const isOwner = message?.sender_id === currentUserId;

	const createPDFHeader = (closePopup: () => void, maximizeToggle: () => void) => {
		return isPDF ? <PDFHeader filename={attachmentData.filename || 'Document'} onClose={closePopup} onMaximize={maximizeToggle} /> : undefined;
	};

	const createPDFFooter = (closePopup: () => void, maximizeToggle: () => void) => {
		return isPDF ? <PDFFooter filename={attachmentData.filename || 'Document'} /> : undefined;
	};

	const [openPDFViewer, closePDFViewer] = usePopup(
		({ closePopup }: { closePopup: () => void }) => {
			if (isPDF && attachmentData.url) {
				return (
					<Suspense fallback={<PDFLoadingFallback />}>
						<PDFViewerModal isOpen={true} onClose={closePopup} pdfUrl={attachmentData.url as string} filename={attachmentData.filename} />
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
			popupId: `pdf-viewer-${attachmentData.filename}-${attachmentData.url}`
		}
	);

	const [showModal, closeModal] = useModal(() => {
		if (message && mode) {
			return (
				<ModalDeleteMess
					mess={message || undefined}
					closeModal={closeModal}
					mode={mode}
					isRemoveAttachmentNoContent={message?.content?.t !== '' || message?.attachments?.length !== 1}
					isRemoveAttachmentAction={true}
					attachmentData={attachmentData}
				/>
			);
		}
	}, [message?.id, mode, message?.content?.t]);

	const handleOpenRemoveAttachementModal = () => {
		showModal();
	};

	return (
		<div
			onMouseEnter={hoverOptButton}
			onMouseLeave={() => setHoverShowOptButtonStatus(false)}
			className={`break-all w-full relative cursor-default gap-3 flex items-center mt-[10px] py-3 pl-3 pr-3 rounded-lg max-w-full ${hideTheInformationFile ? 'bg-item-theme border-theme-primary ' : ''}  relative`}
			role="button"
		>
			{message?.isSending ? (
				<AttachmentLoader appearanceTheme={appearanceTheme} />
			) : (
				<div className="flex items-center">{thumbnailAttachment}</div>
			)}
			{attachmentData.filename === EFailAttachment.FAIL_ATTACHMENT ? (
				<div className="text-red-500">Attachment failed to load.</div>
			) : (
				hideTheInformationFile && (
					<>
						<div className="cursor-pointer flex-1" onClick={handleDownload} onKeyDown={handleDownload}>
							<p className="text-blue-500 hover:underline">{attachmentData.filename}</p>
							<p className="text-theme-primary">size: {formatFileSize(attachmentData.size || 0)}</p>
						</div>
						{hoverShowOptButtonStatus && (
							<div className="flex space-x-2 absolute right-4">
								<button
									onClick={handleDownload}
									className="rounded-md w-8 h-8 flex justify-center  bg-theme-contexify bg-secondary-button-hover border-theme-primary text-theme-primary-hover text-theme-primary items-center cursor-pointer "
									title="Download"
								>
									<Icons.Download defaultSize="w-4 h-4" />
								</button>
								{isOwner && (
									<button
										onClick={handleOpenRemoveAttachementModal}
										className="rounded-md w-8 h-8 flex justify-center items-center cursor-pointer bg-theme-contexify bg-secondary-button-hover border-theme-primary text-theme-primary-hover text-theme-primary"
										title="Remove"
									>
										<Icons.TrashIcon className="w-4 h-4 " />
									</button>
								)}
								{isPDF && (
									<button
										onClick={openPDFViewer}
										className="px-3 py-1 text-sm rounded transition-all duration-200  btn-primary btn-primary-hover"
										title="View PDF"
									>
										View
									</button>
								)}
							</div>
						)}
					</>
				)
			)}
		</div>
	);
}

export default MessageLinkFile;
