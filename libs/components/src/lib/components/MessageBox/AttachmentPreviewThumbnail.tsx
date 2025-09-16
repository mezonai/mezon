import { Icons } from '@mezon/ui';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useState } from 'react';
import { RenderAttachmentThumbnail } from '../ThumbnailAttachmentRender';

interface AttachmentPreviewThumbnailProps {
	attachment: ApiMessageAttachment;
	onRemove?: (channelId: string, index: number) => void;
	indexOfItem: number;
	channelId: string;
}

const AttachmentPreviewThumbnail: React.FC<AttachmentPreviewThumbnailProps> = ({ attachment, onRemove, indexOfItem, channelId }) => {
	const [isHideAttachment, setIsHideAttachment] = useState(false);

	const handleRemove = () => {
		if (onRemove) {
			onRemove(channelId, indexOfItem);
		}
	};

	const filename = attachment.filename;
	const displayedFilename = filename && filename.length > 25 ? filename.substring(0, 25) + '...' : filename;
	const thumbnailAttachment = RenderAttachmentThumbnail({ attachment: attachment });

	const handleShowAttachment = () => {
		setIsHideAttachment(!isHideAttachment);
	};

	return (
		<div
			title={attachment.filename}
			className="flex justify-center items-center p-2 mb-3 rounded bg-item-theme w-[216px] h-[216px] flex-shrink-0 border-theme-primary   relative"
		>
			<div className="cursor-pointer rounded-md flex flex-row justify-center items-center mb-2">
				<div>{thumbnailAttachment}</div>
				<div className=" flex flex-row w-21 top-[-1px] right-[-16px] bg-theme-contexify h-8 absolute  shadow-shadowInbox rounded-lg">
					<button
						onClick={handleRemove}
						className="w-8 h-8 flex flex-row justify-center text-theme-primary items-center bg-item-hover text-theme-primary-hover"
					>
						<Icons.TrashIcon className="w-5 h-5 text-colorDanger hover:text-colorDangerHover" />
					</button>
				</div>
				<div className=" absolute bottom-0 mt-2 left-1 text-sm text-theme-primary ">
					<p className="">{displayedFilename}</p>
				</div>
			</div>
		</div>
	);
};

export default AttachmentPreviewThumbnail;
