import { Button } from '@mezon/ui';
import { generateE2eId, ValidateSpecialCharacters } from '@mezon/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';

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
	const fileInputRef = useRef<HTMLInputElement>(null);
	const groupNameInputRef = useRef<HTMLInputElement>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		if (groupName.trim()) {
			const regex = ValidateSpecialCharacters();
			if (!regex.test(groupName)) {
				setValidationError('Please enter a valid group name (max 64 characters, only words, numbers, _ or -).');
			} else {
				setValidationError(null);
			}
		} else {
			setValidationError(null);
		}
	}, [groupName]);

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
			<div className="fixed inset-0 z-[2147483647] flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose} />
				<div
					className={`relative flex flex-col bg-theme-setting-primary rounded-lg shadow-2xl overflow-hidden max-w-[440px] w-full mx-4 ${className}`}
				>
					<div className="flex items-center justify-between px-4 py-4 bg-theme-setting-nav">
						<h2 className="font-semibold text-xl text-theme-primary select-none">Edit Group</h2>
						<button
							className="w-8 h-8 rounded-full flex items-center justify-center text-theme-primary bg-item-hover transition-all duration-150 ease-out"
							onClick={onClose}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
							</svg>
						</button>
					</div>

					<div className="px-4 pb-4 space-y-5">
						<div className="flex flex-col items-center space-y-3">
							<div
								className="relative w-20 h-20 rounded-full cursor-pointer group transition-all duration-200 ease-out hover:shadow-lg"
								onClick={handleImageClick}
							>
								{imagePreview ? (
									<img
										src={imagePreview || '/placeholder.svg'}
										alt="Group"
										className="w-full h-full rounded-full object-cover border-4 border-[#404249] group-hover:border-[#5865f2] transition-colors duration-200"
									/>
								) : (
									<div className="w-full h-full rounded-full bg-[#5865f2] flex items-center justify-center border-4 border-[#404249] group-hover:border-[#4752c4] transition-colors duration-200">
										<svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
										</svg>
									</div>
								)}
								<div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div className="bg-[#313338] rounded-full p-2 shadow-lg">
										<svg className="w-4 h-4 text-[#f2f3f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											/>
										</svg>
									</div>
								</div>
							</div>
							<input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
							<p className="text-xs text-theme-primary font-medium">Click to upload an image</p>
							{imagePreview && !imagePreview.includes('assets/images/avatar-group.png') && (
								<button
									type="button"
									onClick={() => onImageUpload?.(null)}
									className="text-xs text-[#f23f42] hover:text-[#d73c3f] font-medium transition-colors duration-150"
								>
									Remove Avatar
								</button>
							)}
						</div>

						<div className="space-y-2">
							<label className="block text-xs font-bold uppercase text-theme-primary tracking-wide">Group Name</label>
							<input
								ref={groupNameInputRef}
								type="text"
								defaultValue={groupName}
								onChange={(e) => {
									onGroupNameChange(e.target.value);
								}}
								placeholder="Enter group name"
								className={`w-full px-3 py-2.5 text-theme-primary  border-0 rounded bg-input-theme focus:outline-none transition-all duration-150 ${
									validationError ? 'ring-2 ring-[#f23f42]' : 'focus:ring-2 focus:ring-[#5865f2] '
								}`}
								maxLength={100}
								data-e2e={generateE2eId(`chat.direct_message.edit_group.input`)}
							/>
							{validationError && (
								<div className="flex items-center space-x-1 text-xs text-[#f23f42] mt-2">
									<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<span>{validationError}</span>
								</div>
							)}
							{error && (
								<div className="flex items-center space-x-1 text-xs text-[#f23f42] mt-2">
									<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<span>{error}</span>
								</div>
							)}
							<div className="text-xs text-theme-primary text-right font-medium">{groupName.length}/100</div>
						</div>
					</div>

					<div className="flex justify-end space-x-3 px-4 py-4 bg-theme-setting-nav border-theme-primary ">
						<Button
							onClick={handleCancel}
							className="px-4 py-2 text-theme-primary text-theme-primary-hover hover:underline transition-all duration-150 font-medium"
							variant="ghost"
						>
							Cancel
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
									<span>Saving...</span>
								</div>
							) : (
								'Save'
							)}
						</Button>
					</div>
				</div>
			</div>
		),
		[groupName, imagePreview, validationError, className, onGroupNameChange, onImageUpload, onCancel, onSave, onClose, isLoading, error]
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
