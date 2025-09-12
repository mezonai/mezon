import { useDragAndDrop } from '@mezon/core';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch, useAppSelector } from '@mezon/store';
import { IMAGE_MAX_FILE_SIZE, MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason, processFile } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { DragEvent } from 'react';
import DragAndDropUI from './DragAndDropUI';

type FileUploadByDnDOpt = {
	currentId: string;
};

function FileUploadByDnD({ currentId }: FileUploadByDnDOpt) {
	const dispatch = useAppDispatch();
	const uploadedAttachmentsInChannel = useAppSelector((state) => selectAttachmentByChannelId(state, currentId))?.files || [];

	const { setDraggingState, setOverUploadingState } = useDragAndDrop();

	const handleDragEnter = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDraggingState(true);
	};

	const handleDragOver = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragLeave = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDraggingState(false);
	};

	const handleDrop = async (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDraggingState(false);
		const files = e.dataTransfer.files;
		const filesArray = Array.from(files);
		if (filesArray.length + uploadedAttachmentsInChannel.length > MAX_FILE_ATTACHMENTS) {
			setOverUploadingState(true, UploadLimitReason.COUNT);
			return;
		}

		const getLimit = (file: File) => (file.type?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE);
		const oversizedFile = filesArray.find((file) => file.size > getLimit(file));

		if (oversizedFile) {
			const limit = getLimit(oversizedFile as File);
			setOverUploadingState(true, UploadLimitReason.SIZE, limit);
			return;
		}

		const updatedFiles = await Promise.all(filesArray.map(processFile<ApiMessageAttachment>));
		dispatch(
			referencesActions.setAtachmentAfterUpload({
				channelId: currentId,
				files: updatedFiles
			})
		);
	};
	return <DragAndDropUI onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} />;
}

export default FileUploadByDnD;
