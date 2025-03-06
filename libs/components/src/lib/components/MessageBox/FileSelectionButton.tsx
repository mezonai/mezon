import { useDragAndDrop } from '@mezon/core';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason, processFile } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useSelector } from 'react-redux';

export type FileSelectionButtonProps = {
	currentClanId: string;
	currentChannelId: string;
	hasPermissionEdit: boolean;
};

function FileSelectionButton({ currentClanId, currentChannelId, hasPermissionEdit }: FileSelectionButtonProps) {
	const dispatch = useAppDispatch();
	const uploadedAttachmentsInChannel = useSelector(selectAttachmentByChannelId(currentChannelId))?.files || [];
	const { setOverUploadingState } = useDragAndDrop();
	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const fileArr = Array.from(e.target.files);
			if (fileArr.length + uploadedAttachmentsInChannel.length > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			const oversizedFile = fileArr.find((file) => file.size > MAX_FILE_SIZE);

			if (oversizedFile) {
				setOverUploadingState(true, UploadLimitReason.SIZE);
				return;
			}
			const updatedFiles = await Promise.all(fileArr.map(processFile<ApiMessageAttachment>));
			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentChannelId,
					files: updatedFiles
				})
			);
			e.target.value = '';
		}
	};
	return (
		<label className="pl-2 flex items-center h-11">
			<input id="preview_img" type="file" onChange={handleChange} className="w-full hidden" multiple />
			<div className="flex flex-row h-6 w-6 items-center justify-center ml-2 mb cursor-pointer">
				<Icons.AddCircle
					className={`w-6 h-6 dark:text-textThreadPrimary text-buttonProfile dark:hover:text-textPrimary hover:text-bgPrimary`}
				/>
			</div>
		</label>
	);
}

export default FileSelectionButton;
