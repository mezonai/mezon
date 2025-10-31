'use client';
import {
	channelsActions,
	selectChannelById,
	selectCurrentChannelChannelId,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Button, Icons } from '@mezon/ui';
import { fileTypeImage } from '@mezon/utils';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ELimitSize } from '../../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../../ModalValidateFile/ModalOverData';
const MAX_FILE_SIZE_10MB = 10 * 1024 * 1024;

const StreamThumbnailChannel = () => {
	const { t } = useTranslation('streamThumbnail');
	const dispatch = useAppDispatch();
	const currentChannelId = useAppSelector(selectCurrentChannelId);
	const channelId = useAppSelector(selectCurrentChannelChannelId);
	const clanId = useAppSelector(selectCurrentChannelClanId);
	const channelLabel = useAppSelector(selectCurrentChannelLabel);
	const currentChannel = useAppSelector((state) => selectChannelById(state, currentChannelId || ''));
	const { sessionRef, clientRef } = useMezon();

	const [thumbnail, setThumbnail] = useState<string | null>(currentChannel?.channel_avatar || null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [openModalOverSize, setOpenModalOverSize] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);

	const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];

			if (!fileTypeImage.includes(file.type)) {
				setOpenModalType(true);
				return;
			}

			if (file.size > MAX_FILE_SIZE_10MB) {
				setOpenModalOverSize(true);
				return;
			}

			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewImage(reader.result as string);
				setPendingFile(file);
				setShowUploadModal(true);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCloseTypeModal = () => {
		setOpenModalType(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleCloseOverSizeModal = () => {
		setOpenModalOverSize(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleConfirmUpload = () => {
		if (pendingFile) {
			handleUpload(pendingFile);
			setShowUploadModal(false);
			setPreviewImage(null);
			setPendingFile(null);
		}
	};

	const handleCancelUpload = () => {
		setShowUploadModal(false);
		setPreviewImage(null);
		setPendingFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleUpload = async (file: File) => {
		if (!channelId || !clanId) {
			alert('Channel not found');
			return;
		}

		const client = clientRef.current;
		const session = sessionRef.current;

		if (!client || !session) {
			alert(t('errors.clientNotReady'));
			return;
		}

		setIsUploading(true);
		try {
			const ext = file.name.split('.').pop() || 'jpg';
			const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
			const path = `channel-thumbnail/${channelId}/${unique}.${ext}`;

			const attachment = await handleUploadEmoticon(client, session, path, file);

			if (!attachment || !attachment.url) {
				throw new Error(t('errors.uploadFailed'));
			}

			await dispatch(
				channelsActions.updateChannel({
					channel_id: channelId,
					channel_label: channelLabel,
					category_id: undefined,
					app_id: '',
					channel_avatar: attachment.url
				})
			);

			setThumbnail(attachment.url);
			setIsUploading(false);
		} catch (error) {
			console.error('Failed to upload thumbnail:', error);
			alert(t('errors.uploadFailed'));
			setIsUploading(false);
		}
	};

	const handleRemoveThumbnail = async () => {
		setShowRemoveModal(true);
	};

	const handleConfirmRemove = async () => {
		if (!channelId) return;

		setIsUploading(true);
		setShowRemoveModal(false);
		try {
			await dispatch(
				channelsActions.updateChannel({
					channel_id: channelId,
					channel_label: channelLabel,
					category_id: undefined,
					app_id: '',
					channel_avatar: ''
				})
			);

			setThumbnail(null);
			setIsUploading(false);
		} catch (error) {
			console.error('Failed to remove thumbnail:', error);
			alert(t('errors.removeFailed'));
			setIsUploading(false);
		}
	};

	const handleCancelRemove = () => {
		setShowRemoveModal(false);
	};

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] pb-7 pr-[10px] pl-[40px] overflow-x-hidden min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<h2 className="font-bold text-xl text-theme-primary-active">{t('title')}</h2>
			<div className="w-full mx-auto px-6 py-12">
				<div className="max-w-[650px]">
					<div className="lg:col-span-2 space-y-6">
						{thumbnail ? (
							<div className="space-y-3">
								<div className="relative group rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-800/50">
									<div className="relative w-full pb-[56.25%]">
										<img
											src={thumbnail || '/placeholder.svg'}
											alt="Stream Thumbnail"
											className="absolute top-0 left-0 w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center gap-3 p-6">
											<Button
												className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
												onClick={() => fileInputRef.current?.click()}
												disabled={isUploading}
											>
												<Icons.PenEdit className="w-4 h-4" />
												{t('buttons.change')}
											</Button>
											<Button
												className="px-6 py-2.5 bg-red-600/80 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
												onClick={handleRemoveThumbnail}
												disabled={isUploading}
											>
												<Icons.TrashIcon className="w-4 h-4" />
												{t('buttons.remove')}
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<h2 className="text-lg font-semibold text-theme-primary-active">{t('uploadThumbnail')}</h2>
								<div
									className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-600 hover:border-blue-500 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:from-slate-800/80 hover:to-slate-900/80 transition-all duration-300 cursor-pointer group"
									onClick={() => fileInputRef.current?.click()}
								>
									<div className="h-80 flex flex-col items-center justify-center gap-4 p-8">
										<div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
											<Icons.UploadImage className="w-12 h-12 text-blue-400" />
										</div>
										<div className="text-center space-y-2">
											<h3 className="text-lg font-semibold text-theme-primary-active">{t('upload.title')}</h3>
											<p className="text-sm text-theme-primary-active">{t('upload.description')}</p>
										</div>
										<Button
											className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 mt-2 transition-all hover:scale-105"
											disabled={isUploading}
										>
											<Icons.UploadImage className="w-4 h-4" />
											{isUploading ? t('buttons.uploading') : t('buttons.selectFile')}
										</Button>
									</div>
								</div>
							</div>
						)}

						<input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={handleChooseFile} ref={fileInputRef} />
					</div>

					<div className="space-y-6">
						<div className="space-y-3">
							<h3 className="text-lg font-semibold text-theme-primary-active">{t('requirementsTitle')}</h3>
							<div className="space-y-3">
								<div className="p-4 rounded-xl  bg-theme-setting-nav border-theme-primary">
									<div className="flex gap-3">
										<div className="w-10 h-10 rounded-lg bg-item-theme flex items-center justify-center flex-shrink-0 text-theme-primary">
											<Icons.ImageThumbnail className="w-5 h-5 " />
										</div>
										<div className="min-w-0">
											<p className="text-xs font-semibold text-theme-primary-active uppercase tracking-wide">
												{t('requirements.format.title')}
											</p>
											<p className="text-sm text-theme-primary-active mt-1">{t('requirements.format.value')}</p>
										</div>
									</div>
								</div>

								<div className="p-4 rounded-xl  bg-theme-setting-nav border-theme-primary">
									<div className="flex gap-3">
										<div className="w-10 h-10 rounded-lg bg-item-theme flex items-center justify-center flex-shrink-0 text-theme-primary">
											<Icons.ImageUploadIcon className="w-5 h-5 text-theme-primary" />
										</div>
										<div className="min-w-0">
											<p className="text-xs font-semibold text-theme-primary-active uppercase tracking-wide">
												{t('requirements.resolution.title')}
											</p>
											<p className="text-sm text-theme-primary-active mt-1">{t('requirements.resolution.value')}</p>
										</div>
									</div>
								</div>

								<div className="p-4 rounded-xl  bg-theme-setting-nav border-theme-primary">
									<div className="flex gap-3">
										<div className="w-10 h-10 rounded-lg bg-item-theme flex items-center justify-center flex-shrink-0 text-theme-primary">
											<Icons.FileIcon className="w-5 h-5 text-theme-primary" />
										</div>
										<div className="min-w-0">
											<p className="text-xs font-semibold text-theme-primary-active uppercase tracking-wide">
												{t('requirements.sizeLimit.title')}
											</p>
											<p className="text-sm text-theme-primary-active mt-1">{t('requirements.sizeLimit.value')}</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{showUploadModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
					<div className=" rounded-2xl bg-theme-setting-primary border-theme-primary shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
						<div className="bg-theme-setting-nav">
							<div className="flex items-center gap-3 p-2 ">
								<div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
									<Icons.UploadImage className="w-6 h-6 text-blue-400" />
								</div>
								<div>
									<h2 className="text-xl font-bold text-theme-primary-active">{t('confirmModal.uploadTitle')}</h2>
									<p className="text-sm text-theme-primary-active">{t('confirmModal.uploadDescription')}</p>
								</div>
							</div>
						</div>
						<div className="p-6">
							{previewImage && (
								<div className="rounded-xl overflow-hidden border border-slate-700/50 mb-4 bg-slate-900/50">
									<div className="relative w-full pb-[56.25%]">
										<img src={previewImage} alt="Preview" className="absolute top-0 left-0 w-full h-full object-cover" />
									</div>
								</div>
							)}
							<p className="text-sm text-theme-primary-active mb-4">{t('confirmModal.uploadMessage')}</p>
						</div>
						<div className="p-6 bg-theme-setting-nav border-theme-primary flex justify-end gap-3">
							<Button
								className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-all"
								onClick={handleCancelUpload}
								disabled={isUploading}
							>
								{t('buttons.cancel')}
							</Button>
							<Button
								className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
								onClick={handleConfirmUpload}
								disabled={isUploading}
							>
								{isUploading ? t('buttons.uploading') : t('buttons.confirmUpload')}
							</Button>
						</div>
					</div>
				</div>
			)}

			{showRemoveModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
					<div className="bg-theme-setting-primary rounded-2xl border border-theme-primary shadow-2xl max-w-md w-full mx-4 overflow-hidden">
						<div className="bg-theme-setting-nav">
							<div className="flex items-center gap-3 p-2">
								<div>
									<h2 className="text-xl font-bold text-theme-primary-active">{t('confirmModal.removeTitle')}</h2>
									<p className="text-sm text-theme-primary-active">{t('confirmModal.removeQuestion')}</p>
								</div>
							</div>
						</div>
						<div className="p-6">
							<p className="text-sm text-theme-primary-active mb-4">{t('confirmModal.removeMessage')}</p>
							<div className="p-3 rounded-lg bg-item-theme border-theme-primary ">
								<p className="text-xs text-theme-primary-active">{t('confirmModal.removeWarning')}</p>
							</div>
						</div>
						<div className="p-6 bg-theme-setting-nav border-theme-primary flex justify-end gap-3">
							<Button
								className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-all"
								onClick={handleCancelRemove}
								disabled={isUploading}
							>
								{t('buttons.cancel')}
							</Button>
							<Button
								className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
								onClick={handleConfirmRemove}
								disabled={isUploading}
							>
								<Icons.TrashIcon className="w-4 h-4" />
								{isUploading ? t('buttons.removing') : t('buttons.removeThumbnail')}
							</Button>
						</div>
					</div>
				</div>
			)}

			<ModalErrorTypeUpload open={openModalType} onClose={handleCloseTypeModal} />

			<ModalOverData open={openModalOverSize} onClose={handleCloseOverSizeModal} size={ELimitSize.MB_10} />
		</div>
	);
};

export default StreamThumbnailChannel;
