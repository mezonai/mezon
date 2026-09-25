import { useAuth, useGetPriorityNameFromUserClan, usePathMatch } from '@mezon/core';
import {
	appActions,
	messagesActions,
	pinMessageActions,
	selectAllTopics,
	selectCloseMenu,
	selectCurrentChannelAgeRestricted,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectHasFetchedTopics,
	selectIsShowCanvas,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectLastMessageByChannelId,
	selectMessageByMessageId,
	selectPinMessageByChannelId,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { NX_CHAT_APP_ANNONYMOUS_USER_ID, TypeMessage, createImgproxyUrl, generateE2eId, isImageFileType } from '@mezon/utils';
import { format } from 'date-fns';
import type { ApiSdTopic } from 'mezon-js';
import { ChannelType, decodeAttachments, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

const extractMessageText = (content: any): string => {
	if (!content) return '';
	if (content instanceof Uint8Array) {
		try {
			content = new TextDecoder().decode(content);
		} catch {
			return '';
		}
	}
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
			attList = rawAttachments.filter((att) => att && Object.keys(att).length > 0);
		} else {
			let attachment: unknown;
			try {
				attachment = decodeAttachments(rawAttachments);
			} catch {
				const str = typeof rawAttachments === 'string' ? rawAttachments : rawAttachments?.toString?.() || '';
				const parsed = safeJSONParse(str);
				if (parsed?.t) {
					attachment = [];
				} else {
					attachment = parsed?.attachments || parsed || [];
				}
			}

			if (Array.isArray(attachment)) {
				attList = (attachment as any[]).filter((att) => att && Object.keys(att).length > 0);
			} else if (attachment && typeof attachment === 'object') {
				const parsedAttachments = (attachment as { attachments?: any[] }).attachments;
				attList = (parsedAttachments || []).filter((att) => att && Object.keys(att).length > 0);
			}
		}
	}

	if (!attList.length && content) {
		let contentObj: any = null;
		if (typeof content === 'string') {
			try {
				contentObj = safeJSONParse(content);
			} catch {
				contentObj = null;
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

const checkAgeGatePassed = (channelId?: string | null, ageRestricted?: number | null, dobSeconds?: number | null): boolean => {
	if (ageRestricted !== 1 || !channelId) {
		return true;
	}

	if (dobSeconds) {
		const currentYear = new Date().getFullYear();
		if (currentYear - new Date(dobSeconds).getFullYear() >= 18 || currentYear - new Date(dobSeconds * 1000).getFullYear() >= 18) {
			return true;
		}
	}

	try {
		const raw = localStorage.getItem('agerestrictedchannelIds');
		if (raw) {
			const parsed = safeJSONParse(raw);
			const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.t) ? parsed.t : [];
			if (list.includes(channelId)) {
				return true;
			}
		}
	} catch {
		return false;
	}

	return false;
};

const getTopicTimestamp = (t: ApiSdTopic): number => {
	const lastSent = t.last_sent_message?.timestamp_seconds ? t.last_sent_message.timestamp_seconds * 1000 : 0;
	let updateTime = 0;
	if (t.update_time) {
		const num = Number(t.update_time);
		if (!isNaN(num) && num > 0) {
			updateTime = num > 1e11 ? num : num * 1000;
		} else {
			const parsed = Date.parse(t.update_time);
			if (!isNaN(parsed)) {
				updateTime = parsed;
			}
		}
	}
	const createTime = (t.create_time_seconds || t.message?.create_time_seconds || 0) * 1000;
	let snowflakeTime = 0;
	if (t.id) {
		try {
			snowflakeTime = Number(BigInt(t.id) >> BigInt(22));
		} catch {
			snowflakeTime = 0;
		}
	}
	let msgSnowflakeTime = 0;
	if (t.message_id) {
		try {
			msgSnowflakeTime = Number(BigInt(t.message_id) >> BigInt(22));
		} catch {
			msgSnowflakeTime = 0;
		}
	}
	return Math.max(lastSent, updateTime, createTime, snowflakeTime, msgSnowflakeTime);
};

export const ChannelTopicPinBanner = memo(() => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const channelType = useSelector(selectCurrentChannelType);
	const channelAgeRestricted = useSelector(selectCurrentChannelAgeRestricted);
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const closeMenu = useSelector(selectCloseMenu);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state as any, currentChannelId || ''));
	const isSidePanelOpen = Boolean(isShowCreateTopic || isShowCreateThread);

	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const channelSettingPath = `/chat/clans/${currentClanId}/channel-setting`;
	const guidePath = `/chat/clans/${currentClanId}/guide`;
	const { isMemberPath, isChannelSettingPath, isGuidePath } = usePathMatch({
		isMemberPath: memberPath,
		isChannelSettingPath: channelSettingPath,
		isGuidePath: guidePath
	});
	const location = useLocation();

	const isExcludedRoute = Boolean(
		isMemberPath ||
			isChannelSettingPath ||
			isGuidePath ||
			location.pathname.includes('/member-safety') ||
			location.pathname.includes('/channel-setting') ||
			location.pathname.includes('/guide')
	);

	const isVoiceOrStream = channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE || channelType === ChannelType.CHANNEL_TYPE_STREAMING;

	const hasFetchedTopics = useSelector(selectHasFetchedTopics);

	const dobSeconds = userProfile?.user?.dob_seconds;

	const [isAgeGatePassed, setIsAgeGatePassed] = useState<boolean>(() => checkAgeGatePassed(currentChannelId, channelAgeRestricted, dobSeconds));

	useEffect(() => {
		if (channelAgeRestricted !== 1) {
			setIsAgeGatePassed(true);
			return;
		}

		const passed = checkAgeGatePassed(currentChannelId, channelAgeRestricted, dobSeconds);
		setIsAgeGatePassed(passed);
		if (passed) {
			return;
		}

		const intervalId = window.setInterval(() => {
			if (checkAgeGatePassed(currentChannelId, channelAgeRestricted, dobSeconds)) {
				setIsAgeGatePassed(true);
				window.clearInterval(intervalId);
			}
		}, 300);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [currentChannelId, channelAgeRestricted, dobSeconds]);

	const isChannelGatePassed =
		channelAgeRestricted !== 1 || (isAgeGatePassed && checkAgeGatePassed(currentChannelId, channelAgeRestricted, dobSeconds));

	useEffect(() => {
		if (currentClanId && currentClanId !== '0' && currentChannelId && !isExcludedRoute && !isVoiceOrStream && isChannelGatePassed) {
			dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId, clanId: currentClanId }));
			if (!hasFetchedTopics) {
				dispatch(topicsActions.fetchTopics({ clanId: currentClanId }));
			}
		}
	}, [currentClanId, currentChannelId, dispatch, isExcludedRoute, isVoiceOrStream, isChannelGatePassed, hasFetchedTopics]);

	const allTopics = useSelector(selectAllTopics);
	const latestTopic = useMemo(() => {
		if (!allTopics?.length || !currentChannelId) return null;
		const channelTopics = allTopics.filter((tp) => tp.channel_id === currentChannelId);
		if (!channelTopics.length) return null;
		return [...channelTopics].sort((a, b) => {
			const timeA = getTopicTimestamp(a);
			const timeB = getTopicTimestamp(b);
			if (timeB !== timeA) {
				return timeB - timeA;
			}
			try {
				if (a.id && b.id && a.id !== b.id) {
					return BigInt(b.id) > BigInt(a.id) ? 1 : -1;
				}
			} catch {
				return (b.id || '').localeCompare(a.id || '');
			}
			return 0;
		})[0];
	}, [allTopics, currentChannelId]);

	const topicOriginalMessage = useAppSelector((state) =>
		latestTopic?.channel_id && latestTopic?.message_id ? selectMessageByMessageId(state, latestTopic.channel_id, latestTopic.message_id) : null
	);

	const topicLastMessageInStore = useAppSelector((state) => (latestTopic?.id ? selectLastMessageByChannelId(state, latestTopic.id) : null));

	const fetchingTopicIdRef = useRef<string | null>(null);

	useEffect(() => {
		const topicId = latestTopic?.id;
		if (!topicId || !currentClanId || currentClanId === '0' || !currentChannelId || isExcludedRoute || isVoiceOrStream || !isChannelGatePassed) {
			return;
		}

		if (latestTopic.last_sent_message?.content || topicLastMessageInStore) {
			return;
		}

		if (fetchingTopicIdRef.current === topicId) {
			return;
		}

		fetchingTopicIdRef.current = topicId;

		dispatch(
			messagesActions.fetchMessages({
				clanId: currentClanId,
				channelId: currentChannelId,
				topicId,
				toPresent: true,
				noCache: false
			})
		)
			.unwrap()
			.then((res) => {
				const lastMsg = res?.messages?.at(-1);
				if (lastMsg && currentClanId) {
					dispatch(
						topicsActions.setTopicLastSent({
							clanId: currentClanId,
							topicId,
							lastSentMess: {
								content: typeof lastMsg.content === 'object' ? JSON.stringify(lastMsg.content) : lastMsg.content || '',
								sender_id: lastMsg.sender_id || '',
								timestamp_seconds: lastMsg.create_time_seconds || 0
							}
						})
					);
				}
			})
			.catch(() => {
				fetchingTopicIdRef.current = null;
			});
	}, [
		latestTopic?.id,
		latestTopic?.last_sent_message?.content,
		topicLastMessageInStore,
		currentClanId,
		currentChannelId,
		isExcludedRoute,
		isVoiceOrStream,
		isChannelGatePassed,
		dispatch
	]);

	const topicTitle = useMemo(() => {
		if (!latestTopic) return '';
		return (
			extractMessageText((latestTopic as any)?.content) ||
			extractMessageText(latestTopic.message?.content) ||
			extractMessageText(topicOriginalMessage?.content) ||
			t('topic')
		);
	}, [latestTopic, topicOriginalMessage, t]);

	const topicSubtitle = useMemo(() => {
		if (!latestTopic) return '';
		const lastMsgContent = extractMessageText(latestTopic.last_sent_message?.content) || extractMessageText(topicLastMessageInStore?.content);
		if (lastMsgContent && lastMsgContent !== topicTitle) {
			return lastMsgContent;
		}
		const origContent = extractMessageText((latestTopic as any)?.content) || extractMessageText(topicOriginalMessage?.content);
		if (origContent && origContent !== topicTitle) {
			return origContent;
		}
		return '';
	}, [latestTopic, topicOriginalMessage, topicTitle, topicLastMessageInStore]);

	const topicAttachment = useMemo(() => {
		if (!latestTopic) return null;
		const raw =
			(latestTopic as any)?.attachments ||
			(latestTopic as any)?.attachment ||
			(latestTopic.last_sent_message as any)?.attachments ||
			(latestTopic.last_sent_message as any)?.attachment ||
			topicLastMessageInStore?.attachments ||
			(latestTopic.message as any)?.attachments ||
			topicOriginalMessage?.attachments;
		const content =
			(latestTopic as any)?.content ||
			latestTopic.last_sent_message?.content ||
			topicLastMessageInStore?.content ||
			latestTopic.message?.content ||
			topicOriginalMessage?.content;
		return extractAttachment(raw, content);
	}, [latestTopic, topicOriginalMessage, topicLastMessageInStore]);

	const pinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId || ''));
	const latestPin = useMemo(() => {
		if (!pinMessages?.length) return null;
		return pinMessages[0];
	}, [pinMessages]);

	const pinMessageInStore = useAppSelector((state) =>
		selectMessageByMessageId(state, String(latestPin?.channel_id || '0'), String(latestPin?.message_id || '0'))
	);

	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(String(latestPin?.sender_id || ''));

	const isPinAnonymous = Boolean(
		(latestPin?.sender_id && latestPin.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID) ||
			(pinMessageInStore?.sender_id && pinMessageInStore.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID)
	);

	const pinUserName = isPinAnonymous
		? 'Anonymous'
		: namePriority || latestPin?.username || pinMessageInStore?.display_name || pinMessageInStore?.username || 'Member';
	const pinAvatarUrl = isPinAnonymous ? '' : priorityAvatar || latestPin?.avatar || pinMessageInStore?.avatar || '';

	const pinTimeSeconds = pinMessageInStore?.create_time_seconds || latestPin?.create_time_seconds;
	const pinFormattedTime = useMemo(() => {
		if (!pinTimeSeconds) return '';
		try {
			return format(new Date(pinTimeSeconds * 1000), 'dd/MM/yyyy, HH:mm');
		} catch {
			return '';
		}
	}, [pinTimeSeconds]);

	const isPinPoll = useMemo(() => {
		if (!latestPin) return false;
		if ((latestPin as any)?.code === TypeMessage.Poll || pinMessageInStore?.code === TypeMessage.Poll) {
			return true;
		}
		let raw: any = pinMessageInStore?.content || latestPin.content;
		if (raw instanceof Uint8Array) {
			try {
				raw = new TextDecoder().decode(raw);
			} catch {
				return false;
			}
		}
		let parsed: any = raw;
		if (typeof raw === 'string') {
			try {
				parsed = safeJSONParse(raw);
			} catch {
				parsed = null;
			}
		}
		return Boolean(
			parsed && typeof parsed === 'object' && ('poll_id' in parsed || 'question' in parsed || 'answer_counts' in parsed || 'answers' in parsed)
		);
	}, [latestPin, pinMessageInStore]);

	const pinContent = useMemo(() => {
		if (!latestPin) return '';
		if (isPinPoll) {
			return t('pollDiscussion', 'Cuộc bầu chọn');
		}
		return extractMessageText(latestPin.content) || extractMessageText(pinMessageInStore?.content);
	}, [latestPin, pinMessageInStore, isPinPoll, t]);

	const pinAttachment = useMemo(() => {
		if (!latestPin) return null;
		const raw = pinMessageInStore?.attachments || latestPin.attachment || (latestPin as any).attachments;
		const content = pinMessageInStore?.content || latestPin.content;
		return extractAttachment(raw, content);
	}, [latestPin, pinMessageInStore]);

	const handleJumpToTopic = useCallback(() => {
		if (!latestTopic || !isChannelGatePassed || isExcludedRoute || isVoiceOrStream) return;
		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
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
	}, [dispatch, isShowCanvas, latestTopic, currentChannelId, currentClanId, isChannelGatePassed, isExcludedRoute, isVoiceOrStream]);

	const handleJumpToPin = useCallback(() => {
		if (!latestPin?.message_id || !currentClanId || !isChannelGatePassed || isExcludedRoute || isVoiceOrStream) return;
		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
		dispatch(
			messagesActions.jumpToMessage({
				clanId: currentClanId,
				messageId: String(latestPin.message_id),
				channelId: String(latestPin.channel_id || currentChannelId || '')
			})
		);
	}, [dispatch, isShowCanvas, latestPin, currentClanId, currentChannelId, isChannelGatePassed, isExcludedRoute, isVoiceOrStream]);

	if (
		!currentClanId ||
		currentClanId === '0' ||
		isExcludedRoute ||
		isVoiceOrStream ||
		(!latestTopic && !latestPin) ||
		(isSidePanelOpen && closeMenu) ||
		!isChannelGatePassed
	) {
		return null;
	}

	const hasBoth = Boolean(latestTopic && latestPin);

	return (
		<div
			className="w-full bg-theme-chat px-4 pb-2 pt-1 border-b border-theme-primary flex-shrink-0"
			data-e2e={generateE2eId('chat.channel_message.topic_pin_banner')}
		>
			<div className="flex items-center w-full bg-item-theme border border-theme-primary rounded-[10px] py-1.5 px-3 gap-3 overflow-hidden shadow-sm">
				{latestTopic && (
					<div
						className={`flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity ${
							hasBoth ? 'flex-1' : 'w-full'
						}`}
						onClick={handleJumpToTopic}
						title={topicTitle}
						data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.topic_item')}
					>
						<div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg text-theme-primary-active">
							<Icons.TopicIcon className="w-5 h-5 shrink-0 text-theme-primary-active" />
						</div>
						<div className="flex flex-col min-w-0 flex-1 justify-center">
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
						data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.pin_item')}
					>
						<div className="shrink-0 flex items-center justify-center">
							<AvatarImage
								alt={pinUserName}
								username={pinUserName}
								className="!w-7 !h-7 !min-w-7 !min-h-7 rounded-full text-xs shrink-0"
								classNameText="text-xs"
								srcImgProxy={pinAvatarUrl ? createImgproxyUrl(pinAvatarUrl, { width: 64, height: 64, resizeType: 'fit' }) : undefined}
								src={pinAvatarUrl}
								isAnonymous={isPinAnonymous}
							/>
						</div>
						<div className="flex flex-col min-w-0 flex-1 justify-center">
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
