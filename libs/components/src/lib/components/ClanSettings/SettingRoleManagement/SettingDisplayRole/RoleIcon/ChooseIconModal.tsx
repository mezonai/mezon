import { useEscapeKeyClose, useOnClickOutside, useRoles } from '@mezon/core';
import type { RootState } from '@mezon/store';
import {
	getNewAddPermissions,
	getNewColorRole,
	getNewNameRole,
	getRemoveMemberRoles,
	getRemovePermissions,
	getSelectedRoleId,
	getStoreAsync,
	roleSlice,
	selectCurrentClanId,
	selectTheme
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { MAX_FILE_SIZE_256KB, fileTypeImage, resizeFileImage } from '@mezon/utils';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
	const modalRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectMethod, setSelectMethod] = useState<ESelectRoleIconMethod>(ESelectRoleIconMethod.IMAGE);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { sessionRef, clientRef } = useMezon();
	const appearanceTheme = useSelector(selectTheme);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);
	const dispatch = useDispatch();
	const { updateRole } = useRoles();

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

		const store = await getStoreAsync();
		const state = store.getState() as RootState;
		const currentClanId = selectCurrentClanId(state);
		const currentRoleId = getSelectedRoleId(state);
		const nameRoleNew = getNewNameRole(state);
		const colorRoleNew = getNewColorRole(state);
		const newSelectedPermissions = getNewAddPermissions(state);
		const removeMemberRoles = getRemoveMemberRoles(state);
		const removePermissions = getRemovePermissions(state);

		setIsLoading(true);
		const resizeFile = (await resizeFileImage(file, 64, 64, 'file')) as File;
		const roleIcon = await handleUploadFile(clientRef.current, sessionRef.current, currentClanId || '', 'roleIcon', file.name, resizeFile);

		await updateRole(
			currentClanId || '',
			currentRoleId || '',
			nameRoleNew,
			colorRoleNew,
			[],
			newSelectedPermissions,
			removeMemberRoles,
			removePermissions,
			roleIcon.url
		);
		dispatch(roleSlice.actions.setCurrentRoleIcon(roleIcon?.url || ''));
		onClose();
		setIsLoading(false);
	};

	return (
		<div
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
			tabIndex={0}
		>
			<div
				className="w-[400px] h-[400px] rounded-lg bg-theme-setting-primary  flex-col justify-center items-start gap-3 inline-flex overflow-hidden p-3"
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
						Upload image
					</div>

					{/*WIP*/}
					<div
						className={`text-theme-primary  ${
							selectMethod === ESelectRoleIconMethod.EMOJI && 'bg-item-theme'
						} rounded px-5 py-1 font-semibold cursor-pointer bg-item-theme-hover  `}
						onClick={() => handleChangeSelectMethod(ESelectRoleIconMethod.EMOJI)}
					>
						Emoji
					</div>
				</div>
				<div className={'flex-1 w-full flex flex-col justify-center items-center gap-2 px-2'}>
					<div
						className={
							'rounded-full flex border-dashed border-theme-primary border-2 justify-center items-center w-20 h-20 cursor-pointer group'
						}
						onClick={handleIconClick}
					>
						<Icons.ImageUploadIcon className="w-6 h-6 text-theme-primary group-hover:scale-110 ease-in-out duration-75" />
					</div>
					<p className={'text-theme-primary'}>Choose an image to upload</p>
					<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleChooseImage} />
				</div>
			</div>
			<ModalOverData size={ELimitSize.KB_256} onClose={() => setOpenModal(false)} open={openModal} />
			<ModalErrorTypeUpload onClose={() => setOpenTypeModal(false)} open={openTypeModal} />
		</div>
	);
};

export default ChooseIconModal;
