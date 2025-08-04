import { ColorRoleProvider, useAppParams, useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { PinMessageEntity, pinMessageActions, selectCurrentChannel, useAppDispatch } from '@mezon/store';
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
	const modalRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();

	const { directId } = useAppParams();
	const currentChannel = useSelector(selectCurrentChannel);

	const handleUnPinMessage = (messageId: string) => {
		const channelId = directId || currentChannel?.id || '';
		dispatch(
			pinMessageActions.deleteChannelPinMessage({
				channel_id: channelId || '',
				message_id: messageId,
				clan_id: currentChannel?.clan_id || '',
				pin_id: unpinMess?.pinMessage.id
			})
		);
	};
	const [unpinMess, setUnpinMess] = useState<UnpinMessageObject | null>(null);
	const modalDeleteRef = useRef(null);
	const [openDeletePinMessage, closeDeletePinMessage] = useModal(() => {
		return (
			<ColorRoleProvider>
				<ModalDeletePinMess
					pinMessage={unpinMess?.pinMessage as PinMessageEntity}
					contentString={unpinMess?.contentString}
					handlePinMessage={() => handleUnPinMessage(unpinMess?.pinMessage.message_id || '')}
					closeModal={closeDeletePinMessage}
					attachments={unpinMess?.attachments as ApiMessageAttachment[]}
					modalref={modalDeleteRef}
				/>
			</ColorRoleProvider>
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
		<div ref={modalRef} tabIndex={-1} className="absolute top-8 right-0 shadow z-50 origin-top-right text-theme-primary">
			<div className="flex flex-col rounded-md w-[420px] max-h-[80vh] overflow-hidden shadow-shadowBorder bg-theme-setting-primary">
				<div className=" flex flex-row items-center justify-between p-[16px] h-12 border-b-theme-primary bg-theme-setting-nav">
					<div className="flex flex-row items-center pr-[16px] gap-4 bg-theme-primary-nav">
						<span className="text-base font-medium cursor-default ">Pinned Messages</span>
					</div>
				</div>
				<div className={`flex flex-col flex-1 overflow-y-auto thread-scroll`}>
					<ListPinMessage mode={mode} onClose={onClose} handleUnPinConfirm={handleUnPinConfirm} />
				</div>
			</div>
		</div>
	);
};

export default PinnedMessages;
