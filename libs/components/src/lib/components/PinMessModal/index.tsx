import { ColorRoleProvider, useEscapeKeyClose } from '@mezon/core';
import { IMessageWithUser, KEY_KEYBOARD } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import MessageWithUser from '../MessageWithUser';

type ModalAddPinMessProps = {
	mess: IMessageWithUser;
	mode: number;
	channelLabel: string;
	closeModal: () => void;
	handlePinMessage: () => void;
};
export const ModalAddPinMess = (props: ModalAddPinMessProps) => {
	const { mess, channelLabel, closeModal, handlePinMessage, mode } = props;

	const handlePinMessageAndCloseModal = () => {
		handlePinMessage();
		closeModal();
	};

	useEffect(() => {
		const handleEnterKey = (event: KeyboardEvent) => {
			if (event.keyCode === KEY_KEYBOARD.ENTER) {
				handlePinMessageAndCloseModal();
			}
		};

		document.addEventListener('keydown', handleEnterKey);
		return () => {
			document.removeEventListener('keydown', handleEnterKey);
		};
	}, [handlePinMessageAndCloseModal]);

	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, closeModal);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeThird rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden max-w-[440px]">
				<div className="dark:text-white text-black max-w-full">
					<div className="p-4 pb-0">
						<h3 className="font-semibold pb-4 text-xl">Pin It. Pin It Good.</h3>
						<p>Hey, just double-checking that you want to pin this message to #{channelLabel} for posterity and greatness?</p>
					</div>
					<div className="p-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
						<ColorRoleProvider>
							<MessageWithUser
								isSearchMessage={true} // to correct size youtube emmbed
								allowDisplayShortProfile={false}
								message={mess}
								mode={mode}
								isMention={true}
								isShowFull={true}
							/>
						</ColorRoleProvider>
					</div>
					<div className="w-full dark:bg-bgSecondary bg-bgLightSecondary p-4 flex justify-end gap-x-4">
						<button onClick={closeModal} className="px-4 py-2 hover:underline rounded">
							Cancel
						</button>
						<button
							onClick={handlePinMessageAndCloseModal}
							className="px-4 py-2 hover:bg-opacity-85 rounded bg-primary text-white font-medium"
						>
							Oh yeah. Pin it
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
