import { ColorRoleProvider, useChatSending, useCurrentInbox, useDeleteMessage, useEditMessage, useEscapeKeyClose } from '@mezon/core';
import { selectCurrentTopicId, selectOpenEditMessageState, topicsActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageWithUser, TypeMessage } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MessageWithSystem from '../MessageWithSystem';
import MessageWithUser from '../MessageWithUser';

type ModalDeleteMessProps = {
	mess: IMessageWithUser;
	closeModal: () => void;
	mode: number;
	channelId?: string;
	channelLable?: string;
	isRemoveAttachmentNoContent?: boolean;
	attachmentData?: ApiMessageAttachment;
	isRemoveAttachmentAction?: boolean;
	isTopic?: boolean;
};

const ModalDeleteMess = (props: ModalDeleteMessProps) => {
	const { mess, closeModal, mode, isRemoveAttachmentNoContent, attachmentData, isRemoveAttachmentAction = false, isTopic } = props;
	const dispatch = useDispatch();
	const current = useCurrentInbox() || undefined;
	const modalRef = useRef<HTMLDivElement>(null);
	const isEditing = useSelector(selectOpenEditMessageState);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const [isInitialRender, setIsInitialRender] = useState(isEditing);
	const hasAttachment = !!mess?.attachments?.length;
	const { deleteSendMessage } = useDeleteMessage({
		channelId: mess.channel_id,
		mode: mode,
		hasAttachment: hasAttachment,
		isTopic: isTopic
	});
	const { handleCancelEdit } = useEditMessage(props.channelId ?? '', props.channelLable ?? '', mode, mess);
	const { editSendMessage } = useChatSending({ channelOrDirect: current, mode });
	const [isLoading, setIsLoading] = useState(false);

	const messagePreviewWithAttachmentRemove = {
		...mess,
		attachments: [attachmentData],
		content: { t: '' }
	};

	const removeLastFile = mess.content.t === '' && mess.attachments?.length === 1;

	const handleDeleteMessage = async () => {
		if (!mess?.content?.tp) {
			await deleteSendMessage(mess.id);
			setIsLoading(false);
			return;
		}

		if (mess.content.tp === currentTopicId) {
			await deleteSendMessage(mess.id);
			setIsLoading(false);
			dispatch(topicsActions.setCurrentTopicId(''));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		}
	};

	const handleAction = useCallback(async () => {
		if (isRemoveAttachmentNoContent) {
			const remainingAttachments =
				attachmentData && mess?.attachments && mess?.attachments.filter((attachment) => attachment.url !== attachmentData.url);
			await editSendMessage(mess.content, mess.id, mess.mentions ?? [], remainingAttachments, true, '');
		} else {
			setIsLoading(true);
			await handleDeleteMessage();
		}
		handleCancelEdit();
		closeModal();
	}, [isRemoveAttachmentNoContent, attachmentData, mess, removeLastFile, editSendMessage, deleteSendMessage, handleCancelEdit, closeModal]);

	const handleEnter = async (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.stopPropagation();
			if (isInitialRender) {
				setIsInitialRender(false);
			} else {
				await handleAction();
			}
		}
	};

	useEffect(() => {
		modalRef?.current?.focus();
	}, []);

	useEscapeKeyClose(modalRef, closeModal);

	const isMessageSystem =
		mess?.code === TypeMessage.Welcome ||
		mess?.code === TypeMessage.CreateThread ||
		mess?.code === TypeMessage.CreatePin ||
		mess?.code === TypeMessage.AuditLog;

	return (
		<div
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
			ref={modalRef}
			onKeyUp={handleEnter as any}
			tabIndex={0}
		>
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeThird rounded-lg flex-col justify-start items-start gap-3 inline-flex overflow-hidden">
				<div className="dark:text-white text-black">
					<div className="p-4 pb-0">
						<h3 className="font-bold pb-4">{isRemoveAttachmentNoContent ? 'Remove Attachment' : 'Delete Message'}</h3>
						<p>
							{isRemoveAttachmentNoContent
								? 'Do you want to remove the attachment on this message?'
								: 'Do you want to delete this message?'}
						</p>
					</div>
					<div className="p-4 max-w-[720px] max-h-[50vh] overflow-y-auto hide-scrollbar truncate">
						<ColorRoleProvider>
							{isMessageSystem ? (
								<MessageWithSystem message={mess as IMessageWithUser} mode={mode} />
							) : (
								<MessageWithUser
									allowDisplayShortProfile={false}
									message={
										isRemoveAttachmentAction && messagePreviewWithAttachmentRemove
											? (messagePreviewWithAttachmentRemove as IMessageWithUser)
											: (mess as IMessageWithUser)
									}
									mode={mode}
									isMention={true}
									isShowFull={true}
								/>
							)}
						</ColorRoleProvider>
					</div>
					<div className="w-full dark:bg-bgSecondary bg-bgLightSecondary p-4 flex justify-end gap-x-4">
						<button
							onClick={closeModal}
							className="px-4 py-2 hover:underline rounded disabled:cursor-not-allowed disabled:hover:no-underline disabled:opacity-85"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleAction}
							className="px-4 py-2 bg-[#DA363C] rounded hover:bg-opacity-85 text-white disabled:cursor-not-allowed disabled:opacity-85 disabled:hover:opacity-85 flex"
							disabled={isLoading}
						>
							{isRemoveAttachmentNoContent ? 'Remove ' : 'Delete '}
							{isLoading && <Icons.IconLoadingTyping />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModalDeleteMess;
