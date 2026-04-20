import { Icons } from '@mezon/ui';
import type { ApiMessageAttachment } from 'mezon-js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RenderAttachmentThumbnail } from '../ThumbnailAttachmentRender';

interface AttachmentPreviewThumbnailProps {
	attachment: ApiMessageAttachment;
	onRemove?: (channelId: string, index: number) => void;
	indexOfItem: number;
	channelId: string;
}

const AttachmentPreviewThumbnail: React.FC<AttachmentPreviewThumbnailProps> = ({ attachment, onRemove, indexOfItem, channelId }) => {
	const { t } = useTranslation('message');
	const handleRemove = () => {
		if (onRemove) {
			onRemove(channelId, indexOfItem);
		}
	};

	const filename = attachment.filename;
	const displayedFilename = filename && filename.length > 25 ? `${filename.substring(0, 25)}...` : filename;
	const thumbnailAttachment = RenderAttachmentThumbnail({ attachment });

	return (
		<div className="relative w-[216px] flex-shrink-0 mb-3">
			<div className="absolute top-[-1px] -right-1 z-10 bg-theme-contexify h-8 w-8 rounded-lg shadow-shadowInbox flex items-center justify-center">
				<button
					onClick={handleRemove}
					title={t('deleteMessageModal.removeAttachmentTitle')}
					className="w-full h-full flex items-center justify-center text-theme-primary hover:bg-item-hover text-theme-primary-hover rounded-lg"
				>
					<Icons.TrashIcon className="w-5 h-5 text-colorDanger hover:text-colorDangerHover" />
				</button>
			</div>

			<div title={attachment.filename} className="flex flex-col p-2 rounded bg-item-theme w-[216px] h-[216px] border-theme-primary">
				<div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-md">
					<div className="min-w-0 min-h-0 w-full h-full flex items-center justify-center overflow-hidden">{thumbnailAttachment}</div>
				</div>

				<div className="flex-shrink-0 pt-1.5 pl-0.5 text-left">
					<p className="text-sm text-theme-primary truncate">{displayedFilename}</p>
				</div>
			</div>
		</div>
	);
};

export default AttachmentPreviewThumbnail;
