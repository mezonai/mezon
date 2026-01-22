import { useDragAndDrop } from '@mezon/core';
import { referencesActions, selectAttachmentByChannelId, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMAGE_MAX_FILE_SIZE, MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason, generateE2eId, processFile } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';

export type FileSelectionButtonProps = {
	currentChannelId: string;
};

function FileSelectionButton({ currentChannelId }: FileSelectionButtonProps) {
	const dispatch = useAppDispatch();
	const uploadedAttachmentsInChannel = useAppSelector((state) => selectAttachmentByChannelId(state, currentChannelId))?.files || [];
	const { setOverUploadingState } = useDragAndDrop();
	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const fileArr = Array.from(e.target.files);
			if (fileArr.length + uploadedAttachmentsInChannel.length > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			const getLimit = (file: File) => (file.type?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE);
			const oversizedFile = fileArr.find((file) => file.size > getLimit(file));

			if (oversizedFile) {
				const limit = getLimit(oversizedFile);
				setOverUploadingState(true, UploadLimitReason.SIZE, limit);
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
		<label className="pl-3 flex items-center h-11" data-e2e={generateE2eId('mention.selected_file')}>
			<input
				id="preview_img"
				type="file"
				onChange={handleChange}
				className="w-full hidden"
				multiple
				data-e2e={generateE2eId('user_setting.profile.user_profile.upload.avatar_input')}
			/>
			<div className="flex flex-row h-6 w-6 items-center justify-center cursor-pointer text-theme-primary text-theme-primary-hover">
				<Icons.AddCircle className="" />
			</div>
		</label>
	);
}

export default FileSelectionButton;
