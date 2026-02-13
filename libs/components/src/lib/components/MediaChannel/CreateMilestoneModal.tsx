import type { ChannelTimelineAttachment } from '@mezon/store';
import { channelMediaActions, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { useLastCallback } from '@mezon/utils';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaImage } from './MediaImage';

const DatePickerWrapper = lazy(() => import('../ChannelList/EventChannelModal/ModalCreate/DatePickerWrapper'));

const DatePickerPlaceholder = () => <div className="w-full h-[42px] bg-input-theme animate-pulse rounded-lg" />;

const isUploaded = (att: ChannelTimelineAttachment) => att.file_url?.startsWith('https');

interface CreateMilestoneModalProps {
	channelId: string;
	clanId: string;
	onClose: () => void;
}

export function CreateMilestoneModal({ channelId, clanId, onClose }: CreateMilestoneModalProps) {
	const { t } = useTranslation('channelCreator');
	const dispatch = useAppDispatch();
	const { sessionRef, clientRef } = useMezon();
	const modalRef = useRef<HTMLDivElement>(null);

	const [eventTitle, setEventTitle] = useState('');
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [story, setStory] = useState('');
	const [attachments, setAttachments] = useState<ChannelTimelineAttachment[]>([]);
	const attachmentsRef = useRef<ChannelTimelineAttachment[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const TITLE_MAX_LENGTH = 100;
	const DESCRIPTION_MAX_LENGTH = 250;

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value.length <= TITLE_MAX_LENGTH) {
			setEventTitle(value);
		}
	};

	const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		if (value.length <= DESCRIPTION_MAX_LENGTH) {
			setStory(value);
		}
	};

	const handleCancel = useLastCallback(() => {
		onClose();
	});

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' || event.key === 'Esc') {
				event.preventDefault();
				event.stopPropagation();
				handleCancel();
			} else if (event.key === 'Enter' && eventTitle.trim() && !isSaving) {
				event.preventDefault();
				handleSave();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [eventTitle, isSaving, handleCancel]);

	const handleAddMedia = useLastCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

		setAttachments((prev) => {
			const updated = [...prev, ...previewItems];
			attachmentsRef.current = updated;
			return updated;
		});

		try {
			const uploadResults = await Promise.all(fileArray.map((file, idx) => handleUploadFile(client, session, file.name, file as any, idx)));

			setAttachments((prev) => {
				const updated = prev.map((att) => {
					const previewIdx = previewItems.findIndex((p) => p.id === att.id);
					if (previewIdx !== -1 && uploadResults[previewIdx]) {
						const uploaded = uploadResults[previewIdx];
						return {
							...att,
							file_url: uploaded.url || att.file_url,
							file_name: uploaded.filename || att.file_name,
							file_size: String(uploaded.size || att.file_size),
							file_type: uploaded.filetype || att.file_type,
							width: uploaded.width || att.width,
							height: uploaded.height || att.height,
							thumbnail: uploaded.thumbnail || att.thumbnail
						};
					}
					return att;
				});
				attachmentsRef.current = updated;
				return updated;
			});
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
	});

	const handleRemoveAttachment = useLastCallback((id: string) => {
		setAttachments((prev) => {
			const updated = prev.filter((att) => att.id !== id);
			attachmentsRef.current = updated;
			return updated;
		});
	});

	const handleSave = useLastCallback(async () => {
		if (!eventTitle.trim()) return;

		setIsSaving(true);

		try {
			const startTimeSeconds = Math.floor(selectedDate.getTime() / 1000);
			const endTimeSeconds = startTimeSeconds + 86400;
			const uploadedAttachments = attachmentsRef.current.filter((att) => isUploaded(att));

			await dispatch(
				channelMediaActions.createChannelTimeline({
					clan_id: clanId,
					channel_id: channelId,
					title: eventTitle.trim(),
					description: story.trim() || undefined,
					start_time_seconds: startTimeSeconds,
					end_time_seconds: endTimeSeconds,
					attachments: uploadedAttachments
				})
			).unwrap();

			onClose();
		} catch {
			setIsSaving(false);
		}
	});

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80" onClick={handleCancel} />
			<div
				className="relative bg-modal-theme rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-theme-primary z-10"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b-theme-primary">
					<h2 className="text-lg font-bold text-theme-primary">{t('fields.createMilestone.headerTitle')}</h2>
					<button onClick={handleCancel} className="p-1 rounded-lg text-theme-secondary hover:text-theme-primary-active transition-colors">
						<Icons.CloseIcon className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 messages-scroll">
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<label className="block text-sm font-medium text-theme-primary">{t('fields.createMilestone.eventTitleLabel')}</label>
							<span className={`text-xs ${eventTitle.length >= TITLE_MAX_LENGTH ? 'text-red-500' : 'text-theme-secondary'}`}>
								{eventTitle.length}/{TITLE_MAX_LENGTH}
							</span>
						</div>
						<input
							type="text"
							value={eventTitle}
							onChange={handleTitleChange}
							placeholder={t('fields.createMilestone.eventTitlePlaceholder')}
							maxLength={TITLE_MAX_LENGTH}
							className="w-full px-3 py-2.5 bg-input-theme border-theme-primary rounded-lg text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-buttonPrimary transition-colors"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1.5">{t('fields.createMilestone.dateLabel')}</label>
						<Suspense fallback={<DatePickerPlaceholder />}>
							<DatePickerWrapper
								className="w-full px-3 py-2.5 bg-input-theme border-theme-primary rounded-lg text-theme-primary focus:outline-none focus:border-buttonPrimary transition-colors"
								wrapperClassName="w-full"
								selected={selectedDate}
								onChange={(date: Date) => setSelectedDate(date)}
								dateFormat="dd/MM/yyyy"
							/>
						</Suspense>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1.5">
							<label className="block text-sm font-medium text-theme-primary">{t('fields.createMilestone.storyLabel')}</label>
							<span className={`text-xs ${story.length >= DESCRIPTION_MAX_LENGTH ? 'text-red-500' : 'text-theme-secondary'}`}>
								{story.length}/{DESCRIPTION_MAX_LENGTH}
							</span>
						</div>
						<textarea
							value={story}
							onChange={handleDescriptionChange}
							placeholder={t('fields.createMilestone.storyPlaceholder')}
							rows={4}
							maxLength={DESCRIPTION_MAX_LENGTH}
							className="w-full px-3 py-2.5 bg-input-theme border-theme-primary rounded-lg text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-buttonPrimary transition-colors resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1.5">{t('fields.createMilestone.memoriesLabel')}</label>

						{attachments.length > 0 && (
							<div className="grid grid-cols-3 gap-2 mb-3">
								{attachments.map((att) => {
									const originalUrl = att.thumbnail || att.file_url || '';

									return (
										<div key={att.id} className="relative aspect-square rounded-lg overflow-hidden">
											<MediaImage
												src={originalUrl}
												alt=""
												className="w-full h-full object-cover"
												imgProxyOptions={isUploaded(att) ? { width: 200, height: 200, resizeType: 'fill' } : undefined}
											/>
											{!isUploaded(att) && (
												<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
													<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
												</div>
											)}
											<button
												onClick={() => handleRemoveAttachment(att.id)}
												className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
											>
												<Icons.CloseIcon className="w-3 h-3" />
											</button>
										</div>
									);
								})}
							</div>
						)}

						<input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleAddMedia} />

						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="w-full py-8 border-2 border-dashed border-theme-secondary hover:border-buttonPrimary/50 rounded-xl flex flex-col items-center justify-center gap-2 text-theme-secondary hover:text-buttonPrimary transition-colors cursor-pointer bg-theme-primary"
						>
							{isUploading ? (
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buttonPrimary" />
							) : (
								<Icons.PlusIcon defaultSize="w-10 h-10" />
							)}
							<span className="text-sm font-medium">{t('fields.createMilestone.uploadTitle')}</span>
							<span className="text-xs">{t('fields.createMilestone.uploadSubtitle')}</span>
						</button>
					</div>
				</div>

				<div className="px-6 py-4 border-t-theme-primary">
					<button
						onClick={handleSave}
						disabled={!eventTitle.trim() || isSaving}
						className="w-full flex items-center justify-center gap-2 py-3 btn-primary btn-primary-hover disabled:opacity-50 rounded-lg font-medium transition-colors"
					>
						{isSaving ? (
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
						) : (
							<span>{t('fields.createMilestone.saveButton')}</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
