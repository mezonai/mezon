import { useDragAndDrop } from '@mezon/core';
import { createChannelPoll, referencesActions, selectAttachmentByChannelId, selectChannelById, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMAGE_MAX_FILE_SIZE, MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason, generateE2eId, processFile } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import CreatePollModal, { type PollData } from './CreatePollModal';
import FileSelectionModal from './FileSelectionModal';

export type FileSelectionButtonProps = {
	currentChannelId: string;
	mode?: number;
};

function FileSelectionButton({ currentChannelId, mode }: FileSelectionButtonProps) {
	const isDM = mode === ChannelStreamMode.STREAM_MODE_DM;
	const dispatch = useAppDispatch();
	const uploadedAttachmentsInChannel = useAppSelector((state) => selectAttachmentByChannelId(state, currentChannelId))?.files || [];
	const currentChannel = useAppSelector((state) => selectChannelById(state, currentChannelId));
	const { setOverUploadingState } = useDragAndDrop();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLDivElement>(null);

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

	const handleUploadFile = () => {
		fileInputRef.current?.click();
	};

	const handleOpenModal = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleSubmitPoll = async (pollData: PollData) => {
		try {
			if (!currentChannel) {
				console.error('Current channel not found');
				return;
			}

			const expireHours = parseInt(pollData.duration, 10);

			await dispatch(
				createChannelPoll({
					channel_id: currentChannelId,
					clan_id: currentChannel.clan_id || '0',
					question: pollData.question,
					answers: pollData.answers,
					expire_hours: expireHours,
					type: pollData.allowMultipleAnswers ? 1 : 0
				})
			).unwrap();

			handleClosePollModal();
		} catch (error) {
			console.error('Failed to create poll:', error);
		}
	};

	const [openPollModal, handleClosePollModal] = useModal(() => {
		return <CreatePollModal onClose={handleClosePollModal} onSubmit={handleSubmitPoll} />;
	}, [handleSubmitPoll]);

	const handleOpenPollModal = () => {
		setIsModalOpen(false);
		openPollModal();
	};

	return (
		<div className="pl-3 flex items-center h-11 relative" data-e2e={generateE2eId('mention.selected_file')}>
			<input
				ref={fileInputRef}
				id="preview_img"
				type="file"
				onChange={handleChange}
				className="w-full hidden"
				multiple
				data-e2e={generateE2eId('user_setting.profile.user_profile.upload.avatar_input')}
			/>
			<div
				ref={buttonRef}
				onClick={handleOpenModal}
				className="flex flex-row h-6 w-6 items-center justify-center cursor-pointer text-theme-primary text-theme-primary-hover"
			>
				<Icons.AddCircle className="" />
			</div>

			<FileSelectionModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onUploadFile={handleUploadFile}
				onCreatePoll={isDM ? undefined : handleOpenPollModal}
				buttonRef={buttonRef}
			/>
		</div>
	);
}

export default FileSelectionButton;
