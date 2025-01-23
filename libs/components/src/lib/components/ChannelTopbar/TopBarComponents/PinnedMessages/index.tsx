import { useAppParams, useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { PinMessageEntity, pinMessageActions, selectCurrentChannelId, selectTheme, useAppDispatch } from '@mezon/store';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { RefObject, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { ModalDeletePinMess } from './DeletePinMessPopup';
import ListPinMessage from './ListPinMessage';

type PinnedMessagesProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
	mode?: number;
};

export type UnpinMessageObject = {
	pinMessage: PinMessageEntity;
	contentString: string;
	attachments: ApiMessageAttachment[];
};

const PinnedMessages = ({ onClose, rootRef, mode }: PinnedMessagesProps) => {
	const appearanceTheme = useSelector(selectTheme);
	const modalRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();

	const { directId } = useAppParams();
	const currentChannelId = useSelector(selectCurrentChannelId);

	const handleUnPinMessage = (messageId: string) => {
		const channelId = directId || currentChannelId || '';
		dispatch(pinMessageActions.deleteChannelPinMessage({ channel_id: channelId || '', message_id: messageId }));
	};
	const [unpinMess, setUnpinMess] = useState<UnpinMessageObject | null>(null);
	const modalDeleteRef = useRef(null);
	const [openDeletePinMessage, closeDeletePinMessage] = useModal(() => {
		return (
			<ModalDeletePinMess
				pinMessage={unpinMess?.pinMessage as PinMessageEntity}
				contentString={unpinMess?.contentString}
				handlePinMessage={() => handleUnPinMessage(unpinMess?.pinMessage.message_id || '')}
				closeModal={closeDeletePinMessage}
				attachments={unpinMess?.attachments as ApiMessageAttachment[]}
				modalref={modalDeleteRef}
			/>
		);
	}, [unpinMess]);

	const handleUnPinConfirm = (unpinValue: UnpinMessageObject) => {
		setUnpinMess({
			pinMessage: unpinValue.pinMessage,
			attachments: unpinValue.attachments,
			contentString: unpinValue.contentString
		});
		openDeletePinMessage();
	};

	useOnClickOutside(
		modalRef,
		() => {
			if (modalDeleteRef.current) {
				return;
			}
			onClose();
		},
		rootRef
	);

	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="absolute top-8 right-0 shadow z-10 origin-top-right">
			<div className="flex flex-col rounded-md w-[420px] max-h-[80vh] overflow-hidden dark:shadow-shadowBorder shadow-shadowInbox">
				<div className="dark:bg-bgTertiary bg-bgLightTertiary flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center pr-[16px] gap-4">
						<span className="text-base font-medium cursor-default dark:text-white text-black">Pinned Messages</span>
					</div>
				</div>
				<div
					className={`flex flex-col dark:bg-bgSecondary bg-bgLightSecondary flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'thread-scroll'}`}
				>
					<ListPinMessage mode={mode} onClose={onClose} handleUnPinConfirm={handleUnPinConfirm} />
				</div>
			</div>
		</div>
	);
};

export default PinnedMessages;
