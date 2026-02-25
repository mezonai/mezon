import type { ChannelTimelineAttachment } from '@mezon/store';
import { channelMediaActions, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { MediaImage } from './MediaImage';
import { MediaImageModal } from './MediaImageModal';

const isUploaded = (att: ChannelTimelineAttachment) => att.file_url?.startsWith('https');

const SKELETON_CLASS = 'dark:bg-skeleton-dark bg-skeleton-white animate-pulse';

interface EventDetailViewProps {
	channelId: string;
	clanId: string;
	eventId: string;
	startTimeSeconds: number;
	onBack: () => void;
}

export function EventDetailView({ channelId, clanId, eventId, startTimeSeconds, onBack }: EventDetailViewProps) {
	const { t } = useTranslation('channelCreator');
	const dispatch = useAppDispatch();
	const { sessionRef, clientRef } = useMezon();

	const [isLoading, setIsLoading] = useState(true);
	const [showSkeleton, setShowSkeleton] = useState(false);
	const [attachments, setAttachments] = useState<ChannelTimelineAttachment[]>([]);
	const attachmentsRef = useRef<ChannelTimelineAttachment[]>([]);
	const [_isUploading, setIsUploading] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
	const savedTitleRef = useRef('');
	const savedDescriptionRef = useRef('');
	const modalImageIndexRef = useRef(0);

	const months = useMemo(() => (t('monthsShort', { returnObjects: true }) as string[]) || [], [t]);

	useEffect(() => {
		if (!isLoading) return;
		const timer = setTimeout(() => setShowSkeleton(true), 400);
		return () => clearTimeout(timer);
	}, [isLoading]);

	useEffect(() => {
		const fetchDetail = async () => {
			setIsLoading(true);
			try {
				const result = await dispatch(
					channelMediaActions.detailChannelTimeline({
						id: eventId,
						clan_id: clanId,
						channel_id: channelId,
						start_time_seconds: startTimeSeconds
					})
				).unwrap();

				const event = result.event;
				if (event) {
					setTitle(event.title || '');
					savedTitleRef.current = event.title || '';
					setDescription(event.description || '');
					savedDescriptionRef.current = event.description || '';
					setAttachments(event.attachments || []);
					attachmentsRef.current = event.attachments || [];

					if (event.start_time_seconds) {
						const d = new Date(event.start_time_seconds * 1000);
						const month = months[d.getMonth()];
						const day = String(d.getDate()).padStart(2, '0');
						const year = String(d.getFullYear());
						setDate(`${month} ${day}, ${year}`);
					}
				}
			} catch {
				/* handled by loading state */
			} finally {
				setIsLoading(false);
				setShowSkeleton(false);
			}
		};

		fetchDetail();
	}, [dispatch, eventId, clanId, channelId, startTimeSeconds, months]);

	const [showImageModal, hideImageModal] = useModal(
		() => (
			<MediaImageModal
				attachments={attachments.filter((att) => isUploaded(att))}
				initialIndex={modalImageIndexRef.current}
				onClose={hideImageModal}
			/>
		),
		[attachments]
	);

	const getProxyUri = useCallback((att: ChannelTimelineAttachment) => {
		return att.thumbnail || att.file_url || '';
	}, []);

	const handleOpenImageModal = useCallback(
		(index: number) => {
			const uploadedAttachments = attachments.filter((att) => isUploaded(att));
			if (uploadedAttachments.length === 0) return;
			modalImageIndexRef.current = index;
			showImageModal();
		},
		[attachments, showImageModal]
	);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files || files.length === 0) return;

			const client = clientRef?.current;
			const session = sessionRef?.current;
			if (!client || !session) return;

			setIsUploading(true);

			const fileArray = Array.from(files);

			const previewItems: ChannelTimelineAttachment[] = fileArray.map((file, idx) => ({
				id: String(Date.now() + idx),
				file_name: file.name,
				file_url: URL.createObjectURL(file),
				file_type: file.type,
				file_size: String(file.size),
				width: 0,
				height: 0,
				thumbnail: '',
				duration: 0,
				message_id: '0'
			}));

			const previewIds = new Set(previewItems.map((p) => p.id));

			setAttachments((prev) => {
				const updated = [...prev, ...previewItems];
				attachmentsRef.current = updated;
				return updated;
			});

			try {
				const uploadResults = await Promise.all(fileArray.map((file, idx) => handleUploadFile(client, session, file.name, file as any, idx)));

				const newAttachments: ChannelTimelineAttachment[] = uploadResults.map((uploaded, idx) => ({
					...previewItems[idx],
					file_url: uploaded.url || previewItems[idx].file_url,
					file_name: uploaded.filename || previewItems[idx].file_name,
					file_size: String(uploaded.size || previewItems[idx].file_size),
					file_type: uploaded.filetype || previewItems[idx].file_type,
					width: uploaded.width || previewItems[idx].width,
					height: uploaded.height || previewItems[idx].height,
					thumbnail: uploaded.thumbnail || previewItems[idx].thumbnail
				}));

				const allAttachments = [...attachmentsRef.current.filter((att) => !previewIds.has(att.id)), ...newAttachments];
				attachmentsRef.current = allAttachments;
				setAttachments(allAttachments);

				await dispatch(
					channelMediaActions.updateChannelTimeline({
						id: eventId,
						clan_id: clanId,
						channel_id: channelId,
						start_time_seconds: startTimeSeconds,
						attachments: newAttachments
					})
				).unwrap();
			} catch {
				setAttachments((prev) => {
					const updated = prev.filter((att) => isUploaded(att));
					attachmentsRef.current = updated;
					return updated;
				});
			} finally {
				setIsUploading(false);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
			}
		},
		[clientRef, sessionRef, dispatch, eventId, clanId, channelId, startTimeSeconds]
	);

	const handleUploadClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleCancelTitle = useCallback(() => {
		setTitle(savedTitleRef.current);
		setIsEditingTitle(false);
	}, []);

	const handleSaveTitle = useCallback(async () => {
		if (!title.trim() || title === savedTitleRef.current) {
			handleCancelTitle();
			return;
		}

		setIsSaving(true);
		try {
			await dispatch(
				channelMediaActions.updateChannelTimeline({
					id: eventId,
					clan_id: clanId,
					channel_id: channelId,
					title: title.trim(),
					start_time_seconds: startTimeSeconds
				})
			).unwrap();
			savedTitleRef.current = title.trim();
			setIsEditingTitle(false);
		} catch {
			handleCancelTitle();
		} finally {
			setIsSaving(false);
		}
	}, [title, dispatch, eventId, clanId, channelId, startTimeSeconds, handleCancelTitle]);

	const handleCancelDescription = useCallback(() => {
		setDescription(savedDescriptionRef.current);
		setIsEditingDescription(false);
	}, []);

	const handleSaveDescription = useCallback(async () => {
		if (description === savedDescriptionRef.current) {
			setIsEditingDescription(false);
			return;
		}

		setIsSaving(true);
		try {
			await dispatch(
				channelMediaActions.updateChannelTimeline({
					id: eventId,
					clan_id: clanId,
					channel_id: channelId,
					description: description.trim() || undefined,
					start_time_seconds: startTimeSeconds
				})
			).unwrap();
			savedDescriptionRef.current = description.trim();
			setIsEditingDescription(false);
		} catch {
			handleCancelDescription();
		} finally {
			setIsSaving(false);
		}
	}, [description, dispatch, eventId, clanId, channelId, startTimeSeconds, handleCancelDescription]);

	const handleTitleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleSaveTitle();
			} else if (e.key === 'Escape') {
				handleCancelTitle();
			}
		},
		[handleSaveTitle, handleCancelTitle]
	);

	const handleDescriptionKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSaveDescription();
			} else if (e.key === 'Escape') {
				handleCancelDescription();
			}
		},
		[handleSaveDescription, handleCancelDescription]
	);

	const isEditing = isEditingTitle || isEditingDescription;

	const handleSave = useCallback(() => {
		if (isEditingTitle) handleSaveTitle();
		if (isEditingDescription) handleSaveDescription();
	}, [isEditingTitle, isEditingDescription, handleSaveTitle, handleSaveDescription]);

	const handleCancel = useCallback(() => {
		if (isEditingTitle) handleCancelTitle();
		if (isEditingDescription) handleCancelDescription();
	}, [isEditingTitle, isEditingDescription, handleCancelTitle, handleCancelDescription]);

	const featuredAttachment = attachments[0];
	const gridAttachments = attachments.slice(1);

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-3 px-6 py-4 border-b-theme-primary">
				<button onClick={onBack} className="p-1 rounded-lg text-theme-primary text-theme-primary-hover transition-colors">
					<Icons.ArrowLeft defaultSize="w-5 h-5" />
				</button>
				<div className="flex-1 min-w-0">
					{isLoading ? (
						showSkeleton ? (
							<>
								<div className={`h-6 w-48 rounded ${SKELETON_CLASS}`} />
								<div className={`h-4 w-32 rounded mt-1 ${SKELETON_CLASS}`} />
							</>
						) : null
					) : (
						<>
							{isEditingTitle ? (
								<input
									ref={titleInputRef}
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									onKeyDown={handleTitleKeyDown}
									className="w-full text-lg font-bold bg-input-theme border-theme-primary rounded px-2 py-1 text-theme-primary focus:outline-none focus:border-buttonPrimary"
									autoFocus
									disabled={isSaving}
								/>
							) : (
								<button
									onClick={() => {
										setIsEditingTitle(true);
										setTimeout(() => titleInputRef.current?.focus(), 0);
									}}
									className="w-full text-left group"
								>
									<h2 className="text-lg font-bold text-theme-primary truncate group-hover:text-buttonPrimary transition-colors">
										{title || t('fields.eventDetail.defaultTitle')}
									</h2>
								</button>
							)}
							{date && (
								<div className="flex items-center gap-1.5 text-theme-secondary">
									<Icons.History className="w-3.5 h-3.5" />
									<span className="text-xs">{date}</span>
								</div>
							)}
						</>
					)}
				</div>
				{!isLoading && (
					<button onClick={handleUploadClick} className="p-2 rounded-lg text-theme-primary text-theme-primary-hover transition-colors">
						<Icons.ImageThumbnail defaultSize="w-5 h-5" />
					</button>
				)}
			</div>

			<input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

			<div className="flex-1 overflow-y-auto messages-scroll">
				{isLoading ? (
					showSkeleton ? (
						<div className="px-6 py-4 space-y-4">
							<div className={`h-20 rounded-lg ${SKELETON_CLASS}`} />
							<div className={`h-64 rounded-xl ${SKELETON_CLASS}`} />
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className={`aspect-square rounded-xl ${SKELETON_CLASS}`} />
								))}
							</div>
						</div>
					) : null
				) : (
					<>
						{(description || isEditingDescription) && (
							<div className="px-6 pt-4">
								{isEditingDescription ? (
									<textarea
										ref={descriptionTextareaRef}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										onKeyDown={handleDescriptionKeyDown}
										placeholder={t('fields.eventDetail.descriptionPlaceholder')}
										rows={3}
										className="w-full bg-input-theme border-theme-primary rounded-lg px-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-buttonPrimary resize-none"
										autoFocus
										disabled={isSaving}
									/>
								) : (
									<button
										onClick={() => {
											setIsEditingDescription(true);
											setTimeout(() => descriptionTextareaRef.current?.focus(), 0);
										}}
										className="w-full text-left p-3 bg-theme-primary rounded-lg border-theme-primary hover:bg-item-hover-chat transition-colors group"
									>
										<p className="text-sm text-theme-secondary whitespace-pre-wrap group-hover:text-theme-primary transition-colors">
											{description}
										</p>
									</button>
								)}
							</div>
						)}

						{!description && !isEditingDescription && (
							<div className="px-6 pt-4">
								<button
									onClick={() => setIsEditingDescription(true)}
									className="w-full p-3 border-2 border-dashed border-theme-secondary hover:border-buttonPrimary/50 rounded-lg flex items-center justify-center gap-2 text-theme-secondary hover:text-buttonPrimary transition-colors"
								>
									<Icons.PenEdit className="w-4 h-4" />
									<span className="text-sm">{t('fields.eventDetail.addDescription')}</span>
								</button>
							</div>
						)}

						{isEditing && (
							<div className="flex items-center justify-end gap-2 px-6 pt-3">
								<button
									onClick={handleCancel}
									disabled={isSaving}
									className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-theme-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
								>
									<Icons.CloseIcon className="w-4 h-4" />
									<span>{t('fields.eventDetail.cancel')}</span>
								</button>
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-buttonPrimary hover:bg-buttonPrimary/80 transition-colors"
								>
									{isSaving ? (
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
									) : (
										<Icons.CheckIcon className="w-4 h-4" />
									)}
									<span>{t('fields.eventDetail.save')}</span>
								</button>
							</div>
						)}

						{featuredAttachment && (
							<div className="px-6 pt-4">
								<div className="relative rounded-xl overflow-hidden">
									<MediaImage
										src={getProxyUri(featuredAttachment)}
										alt=""
										className="w-full h-64 object-cover"
										loading="lazy"
										imgProxyOptions={{ width: 600, height: 400, resizeType: 'fill' }}
										onClick={() => isUploaded(featuredAttachment) && handleOpenImageModal(0)}
									/>
									<div className="absolute top-3 left-3 px-2 py-1 bg-buttonPrimary rounded text-xs font-bold text-white pointer-events-none">
										{t('fields.eventDetail.featured')}
									</div>
									{!isUploaded(featuredAttachment) && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
										</div>
									)}
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6 py-4">
							{gridAttachments.map((att, idx) => (
								<div key={`${att.id}-${idx}`} className="relative rounded-xl overflow-hidden aspect-square">
									<MediaImage
										src={getProxyUri(att)}
										alt=""
										className="w-full h-full object-cover"
										loading="lazy"
										imgProxyOptions={{ width: 300, height: 300, resizeType: 'fill' }}
										onClick={() => isUploaded(att) && handleOpenImageModal(idx + 1)}
									/>
									{!isUploaded(att) && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
										</div>
									)}
								</div>
							))}

							<button
								onClick={handleUploadClick}
								className="relative rounded-xl overflow-hidden aspect-square border-2 border-dashed border-theme-secondary hover:border-buttonPrimary/50 flex flex-col items-center justify-center gap-2 text-theme-secondary hover:text-buttonPrimary transition-colors cursor-pointer bg-theme-primary"
							>
								<Icons.PlusIcon defaultSize="w-8 h-8" />
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
