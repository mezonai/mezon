import { useGetPriorityNameFromUserClan } from '@mezon/core';
import {
	messagesActions,
	pinMessageActions,
	selectAllTopics,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectMessageByMessageId,
	selectPinMessageByChannelId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, isImageFileType } from '@mezon/utils';
import { format } from 'date-fns';
import { decodeAttachments, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarColor } from '../../AvatarImage/AvatarImage';

const extractMessageText = (content: any): string => {
	if (!content) return '';
	if (typeof content === 'string') {
		try {
			const parsed = safeJSONParse(content);
			if (parsed && typeof parsed === 'object') {
				return parsed.t || parsed.content || parsed.text || '';
			}
			return content;
		} catch {
			return content;
		}
	}
	if (typeof content === 'object') {
		return content.t || content.content || content.text || '';
	}
	return String(content);
};

type ExtractedAttachment = {
	url: string;
	filename: string;
	filetype: string;
	size: number;
	isImage: boolean;
};

const extractAttachment = (rawAttachments: any, content: any): ExtractedAttachment | null => {
	let attList: any[] = [];

	if (rawAttachments) {
		if (Array.isArray(rawAttachments)) {
			attList = rawAttachments;
		} else if (typeof rawAttachments === 'string') {
			try {
				const decoded = decodeAttachments(rawAttachments);
				if (Array.isArray(decoded)) {
					attList = decoded;
				}
			} catch {
				const parsed = safeJSONParse(rawAttachments);
				if (Array.isArray(parsed)) {
					attList = parsed;
				} else if (Array.isArray(parsed?.attachments)) {
					attList = parsed.attachments;
				}
			}
		}
	}

	if (!attList.length && content) {
		let contentObj: any = null;
		if (typeof content === 'string') {
			try {
				contentObj = safeJSONParse(content);
			} catch {
				// ignore
			}
		} else if (typeof content === 'object') {
			contentObj = content;
		}
		if (Array.isArray(contentObj?.attachments) && contentObj.attachments.length > 0) {
			attList = contentObj.attachments;
		}
	}

	const firstAtt = attList.find((att) => att && (att.url || att.filename || att.file_name));
	if (!firstAtt) return null;

	const url = firstAtt.url || firstAtt.thumbnail || '';
	const filename = firstAtt.filename || firstAtt.file_name || (url ? url.split('/').pop()?.split('?')[0] : '') || 'file';
	const filetype = firstAtt.filetype || firstAtt.file_type || '';
	const sizeRaw = Number(firstAtt.size ?? firstAtt.file_size ?? firstAtt.filesize ?? 0);
	const size = Number.isFinite(sizeRaw) ? sizeRaw : 0;

	const isImage =
		isImageFileType(filetype) ||
		/\.(jpg|jpeg|png|webp|avif|gif|svg|heic)$/i.test(filename) ||
		/\.(jpg|jpeg|png|webp|avif|gif|svg|heic)$/i.test(url);

	return {
		url,
		filename,
		filetype,
		size,
		isImage
	};
};

const formatAttachmentSize = (bytes?: number): string => {
	if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '';
	if (bytes < 1024) {
		return `size: ${bytes} bytes`;
	} else if (bytes < 1024 * 1024) {
		return `size: ${(bytes / 1024).toFixed(0)} KB`;
	} else {
		return `size: ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
};

const renderFileIcon = (filename: string, filetype: string) => {
	const ext = filename?.split('.').pop()?.toLowerCase() || '';
	if (ext === 'txt' || filetype?.includes('text/plain')) {
		return <Icons.TxtThumbnail defaultSize="w-5 h-6" />;
	}
	if (ext === 'pdf' || filetype?.includes('pdf')) {
		return <Icons.PdfThumbnail defaultSize="w-5 h-6" />;
	}
	if (['doc', 'docx'].includes(ext) || filetype?.includes('word')) {
		return <Icons.DocThumbnail defaultSize="w-5 h-6" />;
	}
	if (['xls', 'xlsx'].includes(ext) || filetype?.includes('excel') || filetype?.includes('spreadsheet')) {
		return <Icons.XlsThumbnail defaultSize="w-5 h-6" />;
	}
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
		return <Icons.RarThumbnail defaultSize="w-5 h-6" />;
	}
	if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp'].includes(ext)) {
		return <Icons.CodeThumbnail defaultSize="w-5 h-6" />;
	}
	if (ext === 'json') {
		return <Icons.JsonThumbnail defaultSize="w-5 h-6" />;
	}
	return <Icons.TxtThumbnail defaultSize="w-5 h-6" />;
};

const AttachmentThumbnail = memo(({ attachment }: { attachment: ExtractedAttachment }) => {
	if (attachment.isImage && attachment.url) {
		return (
			<div className="shrink-0 flex items-center justify-center">
				<img
					src={createImgproxyUrl(attachment.url, { width: 80, height: 80, resizeType: 'fit' })}
					alt={attachment.filename}
					className="w-10 h-10 rounded-md object-cover shrink-0 bg-white/10 border border-white/5"
				/>
			</div>
		);
	}

	const formattedSize = formatAttachmentSize(attachment.size);

	return (
		<div className="shrink-0 flex items-center gap-2 bg-[#252438] dark:bg-[#1f1e33] border border-white/10 rounded-lg px-2.5 py-1 max-w-[150px]">
			<div className="shrink-0 flex items-center justify-center">{renderFileIcon(attachment.filename, attachment.filetype)}</div>
			<div className="flex flex-col min-w-0 justify-center">
				<span className="text-xs font-semibold text-theme-primary truncate leading-tight">{attachment.filename}</span>
				{formattedSize && <span className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">{formattedSize}</span>}
			</div>
		</div>
	);
});
AttachmentThumbnail.displayName = 'AttachmentThumbnail';

export const ChannelTopicPinBanner = memo(() => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const closeMenu = useSelector(selectCloseMenu);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state as any, currentChannelId || ''));
	const isSidePanelOpen = Boolean(isShowCreateTopic || isShowCreateThread);

	// Fetch pin messages and topics when switching channels in a clan
	useEffect(() => {
		if (currentClanId && currentClanId !== '0' && currentChannelId) {
			dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId, clanId: currentClanId }));
			dispatch(topicsActions.fetchTopics({ clanId: currentClanId }));
		}
	}, [currentClanId, currentChannelId, dispatch]);

	// Latest Topic for current channel
	const allTopics = useSelector(selectAllTopics);
	const latestTopic = useMemo(() => {
		if (!allTopics?.length || !currentChannelId) return null;
		const channelTopics = allTopics.filter((tp) => tp.channel_id === currentChannelId);
		if (!channelTopics.length) return null;
		return channelTopics.sort((a, b) => {
			const timeA = a.last_sent_message?.timestamp_seconds || a.create_time_seconds || 0;
			const timeB = b.last_sent_message?.timestamp_seconds || b.create_time_seconds || 0;
			return timeB - timeA;
		})[0];
	}, [allTopics, currentChannelId]);

	const topicOriginalMessage = useAppSelector((state) =>
		latestTopic?.channel_id && latestTopic?.message_id ? selectMessageByMessageId(state, latestTopic.channel_id, latestTopic.message_id) : null
	);

	const topicTitle = useMemo(() => {
		if (!latestTopic) return '';
		return extractMessageText(latestTopic.message?.content) || extractMessageText(topicOriginalMessage?.content) || t('topic');
	}, [latestTopic, topicOriginalMessage, t]);

	const topicSubtitle = useMemo(() => {
		if (!latestTopic) return '';
		const lastMsgContent = extractMessageText(latestTopic.last_sent_message?.content);
		if (lastMsgContent && lastMsgContent !== topicTitle) {
			return lastMsgContent;
		}
		const origContent = extractMessageText(topicOriginalMessage?.content);
		if (origContent && origContent !== topicTitle) {
			return origContent;
		}
		return lastMsgContent || '';
	}, [latestTopic, topicOriginalMessage, topicTitle]);

	const topicAttachment = useMemo(() => {
		if (!latestTopic) return null;
		const raw =
			(latestTopic.message as any)?.attachments ||
			(latestTopic.last_sent_message as any)?.attachments ||
			topicOriginalMessage?.attachments ||
			(latestTopic as any).attachments ||
			(latestTopic as any).attachment;
		const content = latestTopic.message?.content || topicOriginalMessage?.content;
		return extractAttachment(raw, content);
	}, [latestTopic, topicOriginalMessage]);

	// Latest Pin message for current channel
	const pinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId || ''));
	const latestPin = useMemo(() => {
		if (!pinMessages?.length) return null;
		return pinMessages[0];
	}, [pinMessages]);

	const pinMessageInStore = useAppSelector((state) =>
		selectMessageByMessageId(state, String(latestPin?.channel_id || '0'), String(latestPin?.message_id || '0'))
	);

	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(String(latestPin?.sender_id || ''));

	const pinUserName = namePriority || latestPin?.username || pinMessageInStore?.display_name || pinMessageInStore?.username || 'Member';
	const pinAvatarUrl = priorityAvatar || latestPin?.avatar || pinMessageInStore?.avatar || '';

	const pinTimeSeconds = pinMessageInStore?.create_time_seconds || latestPin?.create_time_seconds;
	const pinFormattedTime = useMemo(() => {
		if (!pinTimeSeconds) return '';
		try {
			return format(new Date(pinTimeSeconds * 1000), 'dd/MM/yyyy, HH:mm');
		} catch {
			return '';
		}
	}, [pinTimeSeconds]);

	const pinContent = useMemo(() => {
		if (!latestPin) return '';
		return extractMessageText(latestPin.content) || extractMessageText(pinMessageInStore?.content);
	}, [latestPin, pinMessageInStore]);

	const pinAttachment = useMemo(() => {
		if (!latestPin) return null;
		const raw = pinMessageInStore?.attachments || latestPin.attachment || (latestPin as any).attachments;
		const content = pinMessageInStore?.content || latestPin.content;
		return extractAttachment(raw, content);
	}, [latestPin, pinMessageInStore]);

	// Handlers
	const handleJumpToTopic = useCallback(() => {
		if (!latestTopic) return;
		dispatch(topicsActions.setIsShowCreateTopic(true));
		dispatch(threadsActions.setIsShowCreateThread({ channelId: currentChannelId || '', isShowCreateThread: false }));
		dispatch(topicsActions.setCurrentTopicId(latestTopic.id || ''));
		if (latestTopic.message_id && currentChannelId && currentClanId) {
			dispatch(topicsActions.setInitTopicMessageId(latestTopic.message_id));
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId,
					messageId: latestTopic.message_id,
					channelId: currentChannelId
				})
			);
		}
	}, [dispatch, latestTopic, currentChannelId, currentClanId]);

	const handleJumpToPin = useCallback(() => {
		if (!latestPin?.message_id || !currentClanId) return;
		dispatch(
			messagesActions.jumpToMessage({
				clanId: currentClanId,
				messageId: String(latestPin.message_id),
				channelId: String(latestPin.channel_id || currentChannelId || '')
			})
		);
	}, [dispatch, latestPin, currentClanId, currentChannelId]);

	// Don't render if neither topic nor pin exists, or not in clan channel
	// Also don't render on mobile when topic or thread panel is open
	if (!currentClanId || currentClanId === '0' || (!latestTopic && !latestPin) || (isSidePanelOpen && closeMenu)) {
		return null;
	}

	const hasBoth = Boolean(latestTopic && latestPin);

	return (
		<div
			className="absolute top-[49px] left-0 bg-theme-chat px-4 pb-2 pt-1 border-b border-theme-primary transition-[width] duration-150 ease-out"
			style={{
				width: isSidePanelOpen ? 'calc(100% - 510px)' : '100%'
			}}
			data-e2e={generateE2eId('chat.channel_message.header.button.thread' as any)}
		>
			<div className="flex items-center w-full bg-item-theme border border-theme-primary rounded-[10px] py-1.5 px-3 gap-3 overflow-hidden shadow-sm">
				{latestTopic && (
					<div
						className={`flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity ${
							hasBoth ? 'flex-1' : 'w-full'
						}`}
						onClick={handleJumpToTopic}
						title={topicTitle}
						data-e2e={generateE2eId('chat.channel_message.header.button.thread' as any)}
					>
						<div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg">
							<Icons.ThreadIcon
								className="w-5 h-5 shrink-0"
								defaultFill1="#ffffff"
								defaultFill2="#ffffff"
								defaultFill3="#ffffff"
								defaultFill4="var(--bg-theme-chat, #1b1a29)"
							/>
						</div>
						<div className="flex flex-col min-w-0 flex-1 justify-center">
							<div className="text-[11px] font-medium text-gray-400 leading-none mb-0.5">{t('topics', 'Topics')}</div>
							<div className="text-sm font-semibold text-theme-primary truncate leading-tight">{topicTitle}</div>
							{topicSubtitle && <div className="text-xs text-gray-400 truncate leading-tight mt-0.5">{topicSubtitle}</div>}
						</div>
						{topicAttachment && <AttachmentThumbnail attachment={topicAttachment} />}
					</div>
				)}

				{hasBoth && <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-1" />}

				{latestPin && (
					<div
						className={`flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity ${
							hasBoth ? 'flex-1' : 'w-full'
						}`}
						onClick={handleJumpToPin}
						title={pinContent}
						data-e2e={generateE2eId('chat.channel_message.header.button.pin' as any)}
					>
						<div className="shrink-0 flex items-center justify-center">
							{pinAvatarUrl ? (
								<img
									src={createImgproxyUrl(pinAvatarUrl, { width: 64, height: 64, resizeType: 'fit' })}
									alt={pinUserName}
									className="w-7 h-7 rounded-full object-cover shrink-0"
								/>
							) : (
								<AvatarColor username={pinUserName || ''} className="w-7 h-7 rounded-full text-xs shrink-0" />
							)}
						</div>
						<div className="flex flex-col min-w-0 flex-1 justify-center">
							<div className="text-[11px] font-medium text-gray-400 leading-none mb-0.5">{t('latestPin', 'Latest pin')}</div>
							<div className="flex items-center justify-between gap-2 min-w-0">
								<span className="text-sm font-semibold text-theme-primary truncate leading-tight">{pinUserName}</span>
								{pinFormattedTime && (
									<span className="text-[11px] text-gray-400 font-normal shrink-0 leading-tight">{pinFormattedTime}</span>
								)}
							</div>
							{pinContent && <div className="text-xs text-gray-400 truncate leading-tight mt-0.5">{pinContent}</div>}
						</div>
						{pinAttachment && <AttachmentThumbnail attachment={pinAttachment} />}
					</div>
				)}
			</div>
		</div>
	);
});

ChannelTopicPinBanner.displayName = 'ChannelTopicPinBanner';
export default ChannelTopicPinBanner;
