import { useAppParams } from '@mezon/core';
import { Button, MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { MAX_FILE_SIZE_8MB, ValidateSpecialCharacters, createImgproxyUrl, fileTypeImage, generateE2eId } from '@mezon/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { ELimitSize } from '../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../ModalValidateFile/ModalOverData';

export interface ModalEditGroupProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
	onCancel?: () => void;
	onImageUpload?: (file: File | null) => void;
	groupName: string;
	onGroupNameChange: (name: string) => void;
	imagePreview?: string;
	className?: string;
	isLoading?: boolean;
	error?: string | null;
}

export interface GroupData {
	name: string;
	image?: string | File;
}

const ModalEditGroup: React.FC<ModalEditGroupProps> = ({
	isOpen,
	onClose,
	onSave,
	onCancel,
	onImageUpload,
	groupName,
	onGroupNameChange,
	imagePreview = '',
	className = '',
	isLoading = false,
	error = null
}) => {
	const { t } = useTranslation('directMessage');
	const { currentURL } = useAppParams();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const groupNameInputRef = useRef<HTMLInputElement>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);
	const previousURLRef = useRef<string | undefined>(currentURL);
	useEffect(() => {
		if (isOpen && previousURLRef.current !== undefined && previousURLRef.current !== currentURL) {
			onClose();
		}
		previousURLRef.current = currentURL;
	}, [currentURL, isOpen, onClose]);
	useEffect(() => {
		if (groupName.trim()) {
			const regex = ValidateSpecialCharacters();
			if (!regex.test(groupName)) {
				setValidationError(t('editGroup.validationError'));
			} else {
				setValidationError(null);
			}
		} else {
			setValidationError(null);
		}
	}, [groupName, t]);

	useEffect(() => {
		if (isOpen && groupNameInputRef.current) {
			const input = groupNameInputRef.current;
			input.focus();
			input.setSelectionRange(input.value.length, input.value.length);
		}
	}, [isOpen]);

	const handleImageClick = () => {
		fileInputRef.current?.click();
	};

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_FILE_SIZE_8MB) {
			setOpenModal(true);
			event.target.value = '';
			return;
		}
		if (!fileTypeImage.includes(file.type)) {
			setOpenTypeModal(true);
			event.target.value = '';
			return;
		}
		if (file && onImageUpload) {
			onImageUpload(file);
		}
		event.target.value = '';
	};

	const handleCancel = () => {
		onCancel?.();
		onClose();
	};

	const [showModal, hideModal] = useModal(
		() => (
			<div className="fixed inset-0 z-[10] flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose} />
				<div
					className={`relative flex flex-col bg-theme-setting-primary rounded-lg shadow-2xl overflow-hidden max-w-[440px] w-full mx-4 ${className}`}
					data-e2e={generateE2eId('chat.direct_message.edit_group')}
				>
					<div className="flex items-center justify-between px-4 py-4 bg-theme-setting-nav">
						<h2 className="font-semibold text-xl text-theme-primary select-none">{t('editGroup.title')}</h2>
						<button
							className="w-8 h-8 rounded-full flex items-center justify-center text-theme-primary bg-item-hover transition-all duration-150 ease-out"
							onClick={onClose}
						>
							<MezonIcon icon={MzIcons20.mzClose} className="text-[var(--mz-icon)]" />
						</button>
					</div>

					<div className="px-4 pb-4 space-y-5">
						<div className="flex flex-col items-center space-y-3">
							<div
								className="mz-hover relative w-20 h-20 rounded-full cursor-pointer group transition-all duration-200 ease-out hover:shadow-lg"
								onClick={handleImageClick}
							>
								<img
									src={createImgproxyUrl(imagePreview || '/assets/images/avatar-group.png', {
										width: 100,
										height: 100,
										resizeType: 'fill-down'
									})}
									alt="Group"
									className="w-full h-full rounded-full object-cover border-4 border-[#404249] group-hover:border-[#5865f2] transition-colors duration-200"
								/>
								<div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div className="bg-[#313338] rounded-full p-2 shadow-lg">
										<MezonIcon icon={MzIcons16.mzEdit} className="text-[#f2f3f5]" />
									</div>
								</div>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="hidden"
								data-e2e={generateE2eId('chat.direct_message.edit_group.upload.avatar_group_input')}
							/>
							<p className="text-xs text-theme-primary font-medium">{t('editGroup.uploadImageText')}</p>
							{imagePreview && !imagePreview.includes('/assets/images/avatar-group.png') && (
								<button
									type="button"
									onClick={() => onImageUpload?.(null)}
									className="text-xs text-[#f23f42] hover:text-[#d73c3f] font-medium transition-colors duration-150"
								>
									{t('editGroup.removeAvatar')}
								</button>
							)}
						</div>

						<div className="space-y-2">
							<label className="block text-xs font-bold uppercase text-theme-primary tracking-wide">
								{t('editGroup.groupNameLabel')}
							</label>
							<input
								ref={groupNameInputRef}
								type="text"
								defaultValue={groupName}
								onChange={(e) => {
									onGroupNameChange(e.target.value);
								}}
								placeholder={t('editGroup.groupNamePlaceholder')}
								className={`w-full px-3 py-2.5 text-theme-primary  border-0 rounded bg-input-theme focus:outline-none transition-all duration-150 ${
									validationError ? 'ring-2 ring-[#f23f42]' : 'focus:ring-2 focus:ring-[#5865f2] '
								}`}
								maxLength={64}
								data-e2e={generateE2eId(`chat.direct_message.edit_group.input`)}
							/>
							{validationError && (
								<div className="flex items-center space-x-1 text-xs text-[#f23f42] mt-2">
									<MezonIcon icon={MzIcons16.mzError} className="flex-shrink-0" />
									<span>{validationError}</span>
								</div>
							)}
							{error && (
								<div className="flex items-center space-x-1 text-xs text-[#f23f42] mt-2">
									<MezonIcon icon={MzIcons16.mzError} className="flex-shrink-0" />
									<span>{error}</span>
								</div>
							)}
							<div className="text-xs text-theme-primary text-right font-medium">{groupName.length}/64</div>
						</div>
					</div>

					<div className="flex justify-end space-x-3 px-4 py-4 bg-theme-setting-nav border-theme-primary ">
						<Button
							onClick={handleCancel}
							className="px-4 py-2 text-theme-primary text-theme-primary-hover hover:underline transition-all duration-150 font-medium"
							variant="ghost"
						>
							{t('editGroup.cancel')}
						</Button>
						<Button
							onClick={onSave}
							disabled={!groupName.trim() || !!validationError || isLoading}
							className={`px-6 py-2 rounded font-medium transition-all duration-150 ${
								groupName.trim() && !validationError && !isLoading
									? 'bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
									: 'bg-[#4e5058] text-[#87898c] cursor-not-allowed'
							}`}
						>
							{isLoading ? (
								<div className="flex items-center space-x-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>{t('editGroup.saving')}</span>
								</div>
							) : (
								t('editGroup.save')
							)}
						</Button>
					</div>
				</div>
				<ModalErrorTypeUpload open={openTypeModal} onClose={() => setOpenTypeModal(false)} />

				<ModalOverData open={openModal} onClose={() => setOpenModal(false)} size={ELimitSize.MB_8} />
			</div>
		),
		[
			groupName,
			imagePreview,
			openTypeModal,
			openModal,
			validationError,
			className,
			onGroupNameChange,
			onImageUpload,
			onCancel,
			onSave,
			onClose,
			isLoading,
			error
		]
	);

	useEffect(() => {
		if (isOpen) {
			showModal();
		} else {
			hideModal();
		}
	}, [isOpen, showModal, hideModal]);

	return null;
};

export default ModalEditGroup;
