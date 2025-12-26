import { EmojiSuggestionProvider, useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { roleSlice, selectTheme } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { MAX_FILE_SIZE_256KB, fileTypeImage, getSrcEmoji, resizeFileImage } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { EmojiRolePanel } from '../../../../EmojiPicker/EmojiRolePanel';
import { AttachmentLoader } from '../../../../MessageWithUser/MessageLinkFile';
import { ELimitSize } from '../../../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../../../ModalValidateFile/ModalOverData';

type ChooseIconModalProps = {
	onClose: () => void;
};

enum ESelectRoleIconMethod {
	IMAGE = 'IMAGE',
	EMOJI = 'EMOJI'
}

const ChooseIconModal: React.FC<ChooseIconModalProps> = ({ onClose }) => {
	const { t } = useTranslation('common');
	const modalRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectMethod, setSelectMethod] = useState<ESelectRoleIconMethod>(ESelectRoleIconMethod.IMAGE);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { sessionRef, clientRef } = useMezon();
	const appearanceTheme = useSelector(selectTheme);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);
	const dispatch = useDispatch();

	useOnClickOutside(modalRef, onClose);
	useEscapeKeyClose(modalRef, onClose);

	const handleChangeSelectMethod = (method: ESelectRoleIconMethod) => {
		setSelectMethod(method);
	};

	const handleIconClick = () => {
		fileInputRef.current?.click();
	};

	const handleChooseImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		if (!clientRef?.current || !sessionRef?.current || !file) return;

		if (file.size > MAX_FILE_SIZE_256KB) {
			setOpenModal(true);
			return;
		}

		if (!fileTypeImage.includes(file.type)) {
			setOpenTypeModal(true);
			return;
		}

		setIsLoading(true);
		const resizeFile = (await resizeFileImage(file, 64, 64, 'file')) as File;

		const roleIcon = await handleUploadFile(clientRef.current, sessionRef.current, file.name, resizeFile);
		dispatch(roleSlice.actions.setNewRoleIcon(roleIcon?.url || ''));

		onClose();
		setIsLoading(false);
	};

	const handleEmojiSelect = async (emojiId: string, _emoji: string) => {
		const emojiUrl = getSrcEmoji(emojiId);
		dispatch(roleSlice.actions.setNewRoleIcon(emojiUrl));
		onClose();
	};

	return (
		<div
			className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
			tabIndex={0}
		>
			<div
				className={`rounded-lg bg-theme-setting-primary flex-col justify-center items-start gap-3 inline-flex overflow-visible p-3 h-[540px] w-[600px] relative`}
				ref={modalRef}
			>
				{isLoading && (
					<div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-60 z-10 text-white">
						<AttachmentLoader appearanceTheme={appearanceTheme} />
					</div>
				)}

				<div className={'flex items-center justify-start gap-3 h-fit w-full'}>
					<div
						className={`text-theme-primary  ${
							selectMethod === ESelectRoleIconMethod.IMAGE && 'bg-item-theme'
						} rounded px-5 py-1 font-semibold cursor-pointer bg-item-theme-hover `}
						onClick={() => handleChangeSelectMethod(ESelectRoleIconMethod.IMAGE)}
					>
						{t('roleIcon.uploadImage')}
					</div>

					<div
						className={`text-theme-primary  ${
							selectMethod === ESelectRoleIconMethod.EMOJI && 'bg-item-theme'
						} rounded px-5 py-1 font-semibold cursor-pointer bg-item-theme-hover  `}
						onClick={() => handleChangeSelectMethod(ESelectRoleIconMethod.EMOJI)}
					>
						{t('roleIcon.emoji')}
					</div>
				</div>
				<div className={'flex-1 w-full flex flex-col justify-center items-center gap-2 px-2'}>
					{selectMethod === ESelectRoleIconMethod.IMAGE ? (
						<>
							<div
								className={
									'rounded-full flex border-dashed border-theme-primary border-2 justify-center items-center w-[150px] h-[150px] cursor-pointer group'
								}
								onClick={handleIconClick}
							>
								<Icons.ImageUploadIcon className="w-[70px] h-[70px] text-theme-primary group-hover:scale-110 ease-in-out duration-75" />
							</div>
							<p className={'text-theme-primary'}>{t('roleIcon.chooseImageToUpload')}</p>
							<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleChooseImage} />
						</>
					) : (
						<EmojiSuggestionProvider>
							<EmojiRolePanel onEmojiSelect={handleEmojiSelect} onClose={onClose} />
						</EmojiSuggestionProvider>
					)}
				</div>
			</div>
			<ModalOverData size={ELimitSize.KB_256} onClose={() => setOpenModal(false)} open={openModal} />
			<ModalErrorTypeUpload onClose={() => setOpenTypeModal(false)} open={openTypeModal} />
		</div>
	);
};

export default ChooseIconModal;
