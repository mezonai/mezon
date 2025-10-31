import { ColorRoleProvider, useChatSending, useCurrentInbox, useDeleteMessage, useEditMessage, useEscapeKeyClose } from '@mezon/core';
import {
	selectAllAccount,
	selectCurrentTopicId,
	selectMemberClanByUserId,
	selectOpenEditMessageState,
	topicsActions,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageWithUser } from '@mezon/utils';
import { TypeMessage, generateE2eId } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation('message');
	const userId = useSelector(selectAllAccount)?.user?.id;
	const currentClanUser = useAppSelector((state) => selectMemberClanByUserId(state, userId as string));
	const dispatch = useDispatch();
	const current = useCurrentInbox() || undefined;
	const modalRef = useRef<HTMLDivElement>(null);
	const isEditing = useSelector(selectOpenEditMessageState);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const [isInitialRender, setIsInitialRender] = useState(isEditing);
	const hasAttachment = !!mess?.attachments?.length;
	const { deleteSendMessage } = useDeleteMessage({
		channelId: mess.channel_id,
		mode,
		hasAttachment,
		isTopic
	});
	const { handleCancelEdit } = useEditMessage(props.channelId ?? '', props.channelLable ?? '', mode, mess);
	const { editSendMessage } = useChatSending({ channelOrDirect: current, mode });
	const [isLoading, setIsLoading] = useState(false);

	const messagePreviewWithAttachmentRemove = {
		...mess,
		attachments: [attachmentData],
		content: { t: '' }
	};

	const handleDeleteMessage = useCallback(async () => {
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
	}, [mess, deleteSendMessage, currentTopicId, dispatch]);

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
	}, [isRemoveAttachmentNoContent, attachmentData, mess, editSendMessage, handleDeleteMessage, handleCancelEdit, closeModal]);

	const handleEnter = async (e: React.KeyboardEvent<HTMLDivElement>) => {
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
		mess?.code === TypeMessage.UpcomingEvent ||
		mess?.code === TypeMessage.CreateThread ||
		mess?.code === TypeMessage.CreatePin ||
		mess?.code === TypeMessage.AuditLog;

	return (
		<div
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
			ref={modalRef}
			onKeyUp={handleEnter}
			tabIndex={0}
		>
			<div className="w-fit h-fit bg-theme-primary rounded-lg flex flex-col justify-start items-start overflow-hidden">
				<div className="w-fit max-w-[720px] ">
					<div className="w-full p-4 pb-0 bg-theme-primary text-center">
						<h3 className="font-bold pb-2 text-xl text-theme-primary">
							{isRemoveAttachmentNoContent ? t('deleteMessageModal.removeAttachmentTitle') : t('deleteMessageModal.title')}
						</h3>
						<p className="text-theme-primary">
							{isRemoveAttachmentNoContent
								? t('deleteMessageModal.removeAttachmentDescription')
								: t('deleteMessageModal.deleteMessageDescription')}
						</p>
					</div>
					<div className="w-full flex flex-wrap items-start p-4 max-w-[720px] max-h-[50vh] overflow-y-auto overflow-x-hidden bg-theme-secondary pointer-events-none break-words break-all thread-scroll whitespace-pre-wrap [&_p]:!whitespace-normal [&_span]:!whitespace-normal [&_a]:!whitespace-normal [&_div]:!whitespace-normal [&_p]:break-words [&_span]:break-words [&_a]:break-words [&_code]:break-all [&_.attachment-actions]:!hidden [&_button]:!hidden [&_img]:!object-contain [&_img]:max-w-full">
						<ColorRoleProvider>
							{isMessageSystem ? (
								<MessageWithSystem message={mess as IMessageWithUser} isTopic={!!isTopic} />
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
									user={currentClanUser}
									isSearchMessage={false}
								/>
							)}
						</ColorRoleProvider>
					</div>
					<div className="w-full p-4 flex justify-end gap-x-4 border-t border-theme-border bg-theme-primary">
						<button
							onClick={closeModal}
							className="px-4 py-2 hover:underline rounded disabled:cursor-not-allowed disabled:hover:no-underline disabled:opacity-85 text-theme-primary"
							disabled={isLoading}
							data-e2e={generateE2eId('chat.message_action_modal.confirm_modal.button.cancel')}
						>
							{t('deleteMessageModal.cancel')}
						</button>
						<button
							onClick={handleAction}
							data-e2e={generateE2eId('chat.message_action_modal.confirm_modal.button.confirm')}
							className="px-4 py-2 bg-[#DA363C] rounded hover:bg-opacity-85 text-white disabled:cursor-not-allowed disabled:opacity-85 disabled:hover:opacity-85 flex items-center gap-1"
							disabled={isLoading}
						>
							{isRemoveAttachmentNoContent ? t('deleteMessageModal.remove') : t('deleteMessageModal.delete')}
							{isLoading && <Icons.IconLoadingTyping />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModalDeleteMess;
