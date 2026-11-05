import { useAuth, useCdnUrlSigner, useGetPriorityNameFromUserClan, usePathMatch, usePinnedSenderDisplay } from '@mezon/core';
import {
	EventName,
	appActions,
	badgeService,
	getPoll,
	messagesActions,
	pinMessageActions,
	selectAllTopics,
	selectCurrentChannelAgeRestricted,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectHasFetchedTopics,
	selectIsShowCanvas,
	selectIsShowCreateTopic,
	selectIsShowMemberList,
	selectLastMessageByChannelId,
	selectMediaChannelViewMode,
	selectMemberClanByUserId,
	selectMessageByMessageId,
	selectPinMessageByChannelId,
	selectTimelineViewMode,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { NX_CHAT_APP_ANNONYMOUS_USER_ID, TypeMessage, createImgproxyUrl, generateE2eId, isImageFileType } from '@mezon/utils';
import { format } from 'date-fns';
import type { ApiSdTopic } from 'mezon-js';
import { ChannelType, decodeAttachments, safeJSONParse } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import { parsePollData } from '../../MessageWithUser/parsePollData';
import ModalConfirm from '../../ModalConfirm';

const extractPollQuestion = (content: any): string => {
	if (!content) return '';
	if (content instanceof Uint8Array) {
		try {
			content = new TextDecoder().decode(content);
		} catch {
			return '';
		}
	}
	let parsed: any = content;
	if (typeof content === 'string') {
		try {
			parsed = safeJSONParse(content);
		} catch {
			parsed = content;
		}
	}
	if (parsed && typeof parsed === 'object') {
		if (parsed.question) return String(parsed.question);
		if (parsed.poll?.question) return String(parsed.poll.question);
		if (parsed.data?.question) return String(parsed.data.question);
		if (parsed.t) {
			const pollData = parsePollData(parsed.t);
			if (pollData?.question) return pollData.question;
		}
	}
	if (typeof content === 'string') {
		const pollData = parsePollData(content);
		if (pollData?.question) return pollData.question;
	}
	return '';
};

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

const isAnonymousMessageSource = (message: unknown): boolean => {
	if (!message || typeof message !== 'object') return false;
	const msg = message as { isAnonymous?: boolean; sender_id?: string };
	const senderId = String(msg.sender_id || '');
	return Boolean(msg.isAnonymous || senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID);
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
		return <MezonIcon icon={MzIcons20.mzFileText} className="text-[var(--mz-icon)]" />;
	}
	if (ext === 'pdf' || filetype?.includes('pdf')) {
		return <MezonIcon icon={MzIcons20.mzFilePdf} className="text-[var(--mz-icon)]" />;
	}
	if (['doc', 'docx'].includes(ext) || filetype?.includes('word')) {
		return <MezonIcon icon={MzIcons20.mzFileText} className="text-[var(--mz-icon)]" />;
	}
	if (['xls', 'xlsx'].includes(ext) || filetype?.includes('excel') || filetype?.includes('spreadsheet')) {
		return <MezonIcon icon={MzIcons20.mzFileSheet} className="text-[var(--mz-icon)]" />;
	}
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
		return <MezonIcon icon={MzIcons20.mzFileArchive} className="text-[var(--mz-icon)]" />;
	}
	if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp'].includes(ext)) {
		return <MezonIcon icon={MzIcons20.mzFileCode} className="text-[var(--mz-icon)]" />;
	}
	if (ext === 'json') {
		return <MezonIcon icon={MzIcons20.mzFileCode} className="text-[var(--mz-icon)]" />;
	}
	return <MezonIcon icon={MzIcons20.mzFileText} className="text-[var(--mz-icon)]" />;
};

const AttachmentThumbnail = memo(({ attachment }: { attachment: ExtractedAttachment }) => {
	const { signCdnUrl } = useCdnUrlSigner([attachment.url]);
	if (attachment.isImage && attachment.url) {
		return (
			<div className="shrink-0 flex items-center justify-center">
				<img
					src={createImgproxyUrl(signCdnUrl(attachment.url), { width: 64, height: 64, resizeType: 'fit' })}
					alt={attachment.filename}
					className="w-7 h-7 rounded object-cover shrink-0 bg-item-theme border border-theme-primary"
				/>
			</div>
		);
	}

	const formattedSize = formatAttachmentSize(attachment.size);

	return (
		<div className="shrink-0 flex items-center gap-1.5 bg-item-theme border border-theme-primary rounded-md px-2 py-0.5 max-w-[130px]">
			<div className="shrink-0 flex items-center justify-center">{renderFileIcon(attachment.filename, attachment.filetype)}</div>
			<div className="flex flex-col min-w-0 justify-center">
				<span className="text-[11px] font-semibold text-theme-primary-active truncate leading-tight">{attachment.filename}</span>
				{formattedSize && <span className="text-[9px] text-theme-primary leading-tight truncate">{formattedSize}</span>}
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

const getTopicTimestamp = (t: ApiSdTopic | null | undefined): number => {
	if (!t) return 0;
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

type ChannelBannerDismissState = {
	at: number;
	pinId?: string;
	topicId?: string;
	topicAt?: number;
	unpinned?: boolean;
};

const channelBannerDismissKey = (channelId: string) => `mezon_banner_dismissed_${channelId}`;

const getPinPinnedAtMs = (
	pin: { create_time_seconds?: number } | null | undefined,
	pinMessageInStore?: { create_time_seconds?: number } | null
): number => Math.max((pin?.create_time_seconds || 0) * 1000, (pinMessageInStore?.create_time_seconds || 0) * 1000);

const parseBannerDismissState = (raw: unknown): ChannelBannerDismissState | null => {
	if (!raw || typeof raw !== 'object') return null;
	const record = raw as Record<string, unknown>;
	const at = Number(record.at ?? record.dismissedAt);
	if (!(at > 0)) return null;

	const pinId = String(record.pinId ?? record.dismissedPinMessageId ?? '').trim();
	const topicId = String(record.topicId ?? record.dismissedTopicId ?? '').trim();
	const topicAt = Number(record.topicAt ?? record.topicActivityAt);

	return {
		at,
		pinId: pinId || undefined,
		topicId: topicId || undefined,
		topicAt: topicAt > 0 ? topicAt : undefined,
		unpinned: Boolean(record.unpinned ?? record.pinWasRemovedSinceDismiss)
	};
};

const markUnpinnedIfNeeded = (state: ChannelBannerDismissState, pinnedMessageIds: string[]): ChannelBannerDismissState => {
	if (state.unpinned || !state.pinId) return state;
	const pinLeftList = !pinnedMessageIds.includes(state.pinId);
	if (pinLeftList) {
		return { ...state, unpinned: true };
	}
	return state;
};

const shouldRevealBannerAfterDismiss = (
	state: ChannelBannerDismissState,
	latestTopic: ApiSdTopic | null,
	latestPin: { message_id?: string; create_time_seconds?: number } | null,
	pinMessageInStore?: { create_time_seconds?: number } | null
): boolean => {
	const pinMsg = latestPin?.message_id ? String(latestPin.message_id) : '';
	const topicId = latestTopic?.id ? String(latestTopic.id) : '';

	if (pinMsg) {
		if (!state.pinId) return true;
		if (state.unpinned) return true;
		if (pinMsg !== state.pinId) return true;
		if (getPinPinnedAtMs(latestPin, pinMessageInStore) > state.at) return true;
	}

	if (topicId) {
		if (!state.topicId) return true;
		if (topicId !== state.topicId) return true;
		const topicMs = getTopicTimestamp(latestTopic);
		const topicAt = state.topicAt ?? state.at;
		if (topicMs > topicAt) return true;
	}

	return false;
};

/** Pre-v2 localStorage entries (id lists only). */
const shouldRevealBannerLegacy = (
	raw: Record<string, unknown>,
	latestTopic: ApiSdTopic | null,
	latestPin: { message_id?: string } | null
): boolean => {
	const dismissedPinnedIds: string[] = Array.isArray(raw.pinnedIds) ? raw.pinnedIds.map(String) : raw.pinId ? [String(raw.pinId)] : [];
	const dismissedTopicIds: string[] = Array.isArray(raw.topicIds) ? raw.topicIds.map(String) : raw.topicId ? [String(raw.topicId)] : [];

	const pinMsg = latestPin?.message_id ? String(latestPin.message_id) : '';
	const topicId = latestTopic?.id ? String(latestTopic.id) : '';
	const hasNewPin = Boolean(pinMsg && !dismissedPinnedIds.includes(pinMsg));
	const hasNewTopic = dismissedTopicIds.length > 0 && Boolean(topicId && !dismissedTopicIds.includes(topicId));
	return hasNewPin || hasNewTopic;
};

const checkIsChannelBannerDismissed = (channelId: string | null | undefined): boolean => {
	if (!channelId) return false;
	try {
		const raw = localStorage.getItem(channelBannerDismissKey(channelId));
		if (!raw) return false;
		const dismissed = JSON.parse(raw);
		return Boolean(dismissed && typeof dismissed === 'object');
	} catch {
		return false;
	}
};

export type ChannelTopicPinBannerProps = {
	channelId?: string;
};

export const ChannelTopicPinBanner = memo(({ channelId: propChannelId }: ChannelTopicPinBannerProps = {}) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const currentClanId = useSelector(selectCurrentClanId);
	const storeChannelId = useSelector(selectCurrentChannelId);
	const currentChannelId = propChannelId || storeChannelId;
	const channelType = useSelector(selectCurrentChannelType);
	const channelAgeRestricted = useSelector(selectCurrentChannelAgeRestricted);
	const isShowCanvas = useSelector(selectIsShowCanvas);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isTimelineView = useAppSelector(selectTimelineViewMode);
	const isMediaChannelView = useAppSelector(selectMediaChannelViewMode);
	const isSpecialView = Boolean(isTimelineView || isMediaChannelView);
	const isMemberListOpen = Boolean(isShowMemberList && !isSpecialView);

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
			location.pathname.includes('/guide') ||
			location.pathname.includes('/canvas')
	);

	const isVoiceOrStream = channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE || channelType === ChannelType.CHANNEL_TYPE_STREAMING;
	// A deleted channel or one the user lost access to leaves the store before the route moves on.
	const isChannelKnown = channelType !== undefined;

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
		if (
			currentClanId &&
			currentClanId !== '0' &&
			currentChannelId &&
			isChannelKnown &&
			!isExcludedRoute &&
			!isVoiceOrStream &&
			isChannelGatePassed
		) {
			dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId, clanId: currentClanId }));
			if (!hasFetchedTopics) {
				dispatch(topicsActions.fetchTopics({ clanId: currentClanId }));
			}
		}
	}, [currentClanId, currentChannelId, dispatch, isChannelKnown, isExcludedRoute, isVoiceOrStream, isChannelGatePassed, hasFetchedTopics]);

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

	// Select ONE single source message for topic subtitle/attachment/sender to avoid mismatched fallback chains
	const topicSourceMessage = useMemo(() => {
		if (!latestTopic) return null;

		const lastSent = latestTopic.last_sent_message;
		const storeMsg = topicLastMessageInStore;

		const lastSentTime = Number((lastSent as any)?.timestamp_seconds || 0);
		const storeMsgTime = Number(storeMsg?.create_time_seconds || 0);

		// Pick the newer message between store message and lastSent message
		let candidateMsg: any = null;
		if (storeMsg && lastSent) {
			candidateMsg = storeMsgTime >= lastSentTime ? storeMsg : lastSent;
		} else {
			candidateMsg = storeMsg || lastSent;
		}

		if (candidateMsg) {
			const text = extractMessageText(candidateMsg.content);
			const attachment = candidateMsg.isSending
				? null
				: extractAttachment((candidateMsg as any).attachments || (candidateMsg as any).attachment, candidateMsg.content);
			const senderId = String(candidateMsg.sender_id || '');
			if (text || attachment || senderId) {
				return {
					message: candidateMsg,
					content: text,
					attachment,
					senderId,
					username: (candidateMsg as any).display_name || (candidateMsg as any).username || '',
					isAnonymous: Boolean((candidateMsg as any).isAnonymous || senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID)
				};
			}
		}

		// Fallback: original message (the topic creation message)
		const origMsg = topicOriginalMessage || latestTopic.message;
		const origText = extractMessageText(origMsg?.content) || extractMessageText((latestTopic as any)?.content);
		const origAttachment = extractAttachment(
			(origMsg as any)?.attachments || (origMsg as any)?.attachment || (latestTopic as any)?.attachments || (latestTopic as any)?.attachment,
			origMsg?.content || (latestTopic as any)?.content
		);
		const origSenderId = String((origMsg as any)?.sender_id || latestTopic.creator_id || '');
		if (origText || origAttachment || origSenderId) {
			return {
				message: origMsg || latestTopic,
				content: origText,
				attachment: origAttachment,
				senderId: origSenderId,
				username: (origMsg as any)?.display_name || (origMsg as any)?.username || '',
				isAnonymous: Boolean((origMsg as any)?.isAnonymous || origSenderId === NX_CHAT_APP_ANNONYMOUS_USER_ID)
			};
		}

		return null;
	}, [latestTopic, topicLastMessageInStore, topicOriginalMessage]);

	const topicSenderId = topicSourceMessage?.senderId || '';

	const {
		namePriority: topicSenderNamePriority,
		usernameSender: topicSenderUsername,
		isAnonymous: isTopicAnonymous
	} = useGetPriorityNameFromUserClan(topicSenderId);

	const topicSenderMember = useAppSelector((state) => (topicSenderId ? selectMemberClanByUserId(state, topicSenderId) : null));

	const isTopicSenderAnonymous = Boolean(
		isTopicAnonymous ||
			topicSenderId === NX_CHAT_APP_ANNONYMOUS_USER_ID ||
			topicSourceMessage?.isAnonymous ||
			isAnonymousMessageSource(topicLastMessageInStore) ||
			isAnonymousMessageSource(topicOriginalMessage) ||
			isAnonymousMessageSource(latestTopic?.last_sent_message) ||
			isAnonymousMessageSource(latestTopic?.message) ||
			isAnonymousMessageSource(topicSourceMessage?.message)
	);

	const topicSenderName = useMemo(() => {
		if (!topicSenderId) return '';
		if (isTopicSenderAnonymous) return 'Anonymous';
		return (
			topicSenderNamePriority ||
			topicSourceMessage?.username ||
			topicSenderUsername ||
			topicSenderMember?.clan_nick ||
			topicSenderMember?.user?.display_name ||
			topicSenderMember?.user?.username ||
			''
		);
	}, [topicSenderId, isTopicSenderAnonymous, topicSenderNamePriority, topicSourceMessage?.username, topicSenderUsername, topicSenderMember]);

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
		if (!topicSourceMessage) return '';
		const msgContent = topicSourceMessage.content;
		if (msgContent && msgContent !== topicTitle) {
			if (topicSenderName) {
				return t('messageFrom', 'Message from {{username}}: {{message}}', {
					username: topicSenderName,
					message: msgContent
				});
			}
			return msgContent;
		}
		return '';
	}, [topicSourceMessage, topicTitle, topicSenderName, t]);

	const topicAttachment = useMemo(() => {
		return topicSourceMessage?.attachment || null;
	}, [topicSourceMessage]);

	const isTopicOpen = Boolean(isShowCreateTopic && currentTopicId && latestTopic?.id && currentTopicId === latestTopic.id);

	const topicId = latestTopic?.id || '';
	const currentTopicTimestamp = useMemo(() => {
		const ts = getTopicTimestamp(latestTopic);
		return Math.max(ts, (topicLastMessageInStore?.create_time_seconds || 0) * 1000);
	}, [latestTopic, topicLastMessageInStore]);

	const currentUserId = userProfile?.user?.id;
	const topicLastSenderId = topicLastMessageInStore?.sender_id || topicSourceMessage?.senderId || latestTopic?.last_sent_message?.sender_id || '';
	const isOwnTopicMessage = Boolean(currentUserId && topicLastSenderId && topicLastSenderId === currentUserId);

	const [hasNewTopicMessage, setHasNewTopicMessage] = useState(false);
	const [topicBadgeCount, setTopicBadgeCount] = useState(() => (topicId ? badgeService.getTopicBadge(topicId) : 0));

	useEffect(() => {
		if (!topicId) {
			setTopicBadgeCount(0);
			return;
		}
		setTopicBadgeCount(badgeService.getTopicBadge(topicId));

		const onChange = (data: { topicId: string; count: number; channelId?: string }) => {
			if (data?.topicId === topicId) {
				setTopicBadgeCount((prev) => Math.max(0, prev + (data?.count || 0)));
			}
		};

		badgeService.on(EventName.INCREASE_BADGE_TOPIC, onChange);
		return () => {
			badgeService.off(EventName.INCREASE_BADGE_TOPIC, onChange);
		};
	}, [topicId]);

	useEffect(() => {
		if (!topicId) {
			setHasNewTopicMessage(false);
			return;
		}

		if (isTopicOpen || isOwnTopicMessage) {
			if (currentTopicTimestamp) {
				try {
					localStorage.setItem(`mezon_topic_seen_${topicId}`, String(currentTopicTimestamp));
				} catch {
					// ignore
				}
			}
			setHasNewTopicMessage(false);
			return;
		}

		const seenKey = `mezon_topic_seen_${topicId}`;
		let rawSeen: string | null = null;
		try {
			rawSeen = localStorage.getItem(seenKey);
		} catch {
			// ignore
		}

		if (rawSeen === null) {
			if (currentTopicTimestamp) {
				try {
					localStorage.setItem(seenKey, String(currentTopicTimestamp));
				} catch {
					// ignore
				}
			}
			setHasNewTopicMessage(false);
			return;
		}

		const lastSeen = Number(rawSeen) || 0;
		if (currentTopicTimestamp > lastSeen) {
			setHasNewTopicMessage(true);
		} else {
			setHasNewTopicMessage(false);
		}
	}, [topicId, currentTopicTimestamp, isOwnTopicMessage, isTopicOpen]);

	useEffect(() => {
		if (isTopicOpen && topicId && currentClanId) {
			setTopicBadgeCount(0);
			badgeService.resetChannel({
				clanId: currentClanId,
				channelId: topicId,
				isTopic: true
			});
		}
	}, [isTopicOpen, topicId, currentClanId]);

	const showTopicBadge = hasNewTopicMessage || topicBadgeCount > 0;

	const pinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId || ''));
	const latestPin = useMemo(() => {
		if (!pinMessages?.length) return null;
		return pinMessages[0];
	}, [pinMessages]);

	const pinMessageInStore = useAppSelector((state) =>
		latestPin?.message_id
			? selectMessageByMessageId(state, String(latestPin.channel_id || currentChannelId || ''), String(latestPin.message_id))
			: null
	);

	const isPinAnonymous = Boolean(
		(latestPin?.sender_id && latestPin.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID) ||
			(pinMessageInStore?.sender_id && pinMessageInStore.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID)
	);

	const { displayName: pinUserName, displayAvatar: pinAvatarUrl } = usePinnedSenderDisplay({
		senderId: String(latestPin?.sender_id || ''),
		channelId: String(latestPin?.channel_id || currentChannelId || ''),
		message: pinMessageInStore,
		pinAvatar: latestPin?.avatar,
		pinUsername: latestPin?.username,
		isAnonymous: isPinAnonymous
	});
	const pinUserNameDisplay = pinUserName || 'Member';

	const pinTimeSeconds = pinMessageInStore?.create_time_seconds || latestPin?.create_time_seconds;
	const pinFormattedTime = useMemo(() => {
		if (!pinTimeSeconds) return '';
		try {
			return format(new Date(pinTimeSeconds * 1000), 'dd/MM/yyyy, HH:mm');
		} catch {
			return '';
		}
	}, [pinTimeSeconds]);

	const pollQuestionFromContent = useMemo(() => {
		if (!latestPin) return '';
		return extractPollQuestion(pinMessageInStore?.content) || extractPollQuestion(latestPin.content);
	}, [latestPin, pinMessageInStore]);

	const [fetchedPollQuestionMap, setFetchedPollQuestionMap] = useState<Record<string, string>>({});

	const isPinPoll = useMemo(() => {
		if (!latestPin) return false;
		return (latestPin as any)?.code === TypeMessage.Poll || pinMessageInStore?.code === TypeMessage.Poll;
	}, [latestPin, pinMessageInStore]);

	useEffect(() => {
		if (!isPinPoll || pollQuestionFromContent) return;
		const pinMessageId = String(latestPin?.message_id || '');
		const pinChannelId = String(latestPin?.channel_id || currentChannelId || '');
		if (!pinMessageId || !pinChannelId || pinMessageId in fetchedPollQuestionMap) return;

		let cancelled = false;

		dispatch(getPoll({ message_id: pinMessageId, channel_id: pinChannelId }))
			.unwrap()
			.then((res: any) => {
				if (cancelled) return;
				const q = res?.question || res?.poll?.question || res?.data?.question;
				if (q) {
					setFetchedPollQuestionMap((prev) => ({ ...prev, [pinMessageId]: String(q) }));
				}
			})
			.catch(() => {
				if (cancelled) return;
				setFetchedPollQuestionMap((prev) => ({ ...prev, [pinMessageId]: '' }));
			});

		return () => {
			cancelled = true;
		};
	}, [isPinPoll, pollQuestionFromContent, latestPin?.message_id, latestPin?.channel_id, currentChannelId, dispatch]);

	const pinMessageId = String(latestPin?.message_id || '');
	const pinPollQuestion = pollQuestionFromContent || (pinMessageId ? fetchedPollQuestionMap[pinMessageId] || '' : '');

	const pinContent = useMemo(() => {
		if (!latestPin) return '';
		if (isPinPoll) {
			if (pinPollQuestion) {
				return t('pollWithQuestion', 'Poll: {{question}}', { question: pinPollQuestion });
			}
			return t('pollDiscussion', 'Cuộc bầu chọn');
		}
		return extractMessageText(latestPin.content) || extractMessageText(pinMessageInStore?.content);
	}, [latestPin, pinMessageInStore, isPinPoll, pinPollQuestion, t]);

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
		if (latestTopic.id) {
			const currentTs = currentTopicTimestamp || Date.now();
			try {
				localStorage.setItem(`mezon_topic_seen_${latestTopic.id}`, String(currentTs));
			} catch {
				// ignore
			}
			setHasNewTopicMessage(false);
		}
		if (latestTopic.id && currentClanId) {
			setTopicBadgeCount(0);
			badgeService.resetChannel({
				clanId: currentClanId,
				channelId: latestTopic.id,
				isTopic: true
			});
		}
	}, [
		dispatch,
		isShowCanvas,
		latestTopic,
		currentTopicTimestamp,
		currentChannelId,
		currentClanId,
		isChannelGatePassed,
		isExcludedRoute,
		isVoiceOrStream
	]);

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

	const pinnedMessageIds = useMemo(() => (pinMessages || []).map((p) => String(p.message_id || '')).filter(Boolean), [pinMessages]);
	const pinnedMessageIdsKey = useMemo(() => pinnedMessageIds.join(','), [pinnedMessageIds]);

	const latestTopicActivityMs = useMemo(() => getTopicTimestamp(latestTopic), [latestTopic]);

	const [prevChannelId, setPrevChannelId] = useState(currentChannelId);
	const [isDismissed, setIsDismissed] = useState<boolean>(() => checkIsChannelBannerDismissed(currentChannelId));

	if (currentChannelId !== prevChannelId) {
		setPrevChannelId(currentChannelId);
		setIsDismissed(checkIsChannelBannerDismissed(currentChannelId));
	}

	useEffect(() => {
		if (!currentChannelId) {
			setIsDismissed(false);
			return;
		}

		const storageKey = channelBannerDismissKey(currentChannelId);
		let parsed: Record<string, unknown> | null = null;
		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) {
				setIsDismissed(false);
				return;
			}
			const value = JSON.parse(raw);
			if (!value || typeof value !== 'object') {
				setIsDismissed(false);
				return;
			}
			parsed = value as Record<string, unknown>;
		} catch {
			setIsDismissed(false);
			return;
		}

		let dismissState = parseBannerDismissState(parsed);
		let shouldReveal = false;

		if (dismissState) {
			const withUnpin = markUnpinnedIfNeeded(dismissState, pinnedMessageIds);
			if (withUnpin.unpinned && !dismissState.unpinned) {
				try {
					localStorage.setItem(storageKey, JSON.stringify(withUnpin));
				} catch {
					console.error('Error setting item in localStorage', storageKey);
				}
			}
			dismissState = withUnpin;
			shouldReveal = shouldRevealBannerAfterDismiss(dismissState, latestTopic, latestPin, pinMessageInStore);
		} else {
			shouldReveal = shouldRevealBannerLegacy(parsed, latestTopic, latestPin);
		}

		if (shouldReveal) {
			try {
				localStorage.removeItem(storageKey);
			} catch {
				console.error('Error removing item from localStorage', storageKey);
			}
			setIsDismissed(false);
			return;
		}

		setIsDismissed(true);
	}, [
		currentChannelId,
		latestTopic?.id,
		latestPin?.message_id,
		latestPin?.create_time_seconds,
		latestTopicActivityMs,
		pinnedMessageIdsKey,
		pinMessageInStore?.create_time_seconds
	]);

	const handleConfirmDismiss = useCallback(() => {
		if (!currentChannelId) return;

		const at = Date.now();
		const dismissState: ChannelBannerDismissState = {
			at,
			pinId: latestPin?.message_id ? String(latestPin.message_id) : undefined,
			topicId: latestTopic?.id ? String(latestTopic.id) : undefined,
			topicAt: latestTopic ? getTopicTimestamp(latestTopic) : undefined
		};
		try {
			localStorage.setItem(channelBannerDismissKey(currentChannelId), JSON.stringify(dismissState));
		} catch {
			// ignore
		}
		setIsDismissed(true);
	}, [currentChannelId, latestTopic, latestPin]);

	const [openDismissModal, closeDismissModal] = useModal(
		() => (
			<ModalConfirm
				handleCancel={closeDismissModal}
				handleConfirm={() => {
					handleConfirmDismiss();
					closeDismissModal();
				}}
				title={t('topicPinBanner.dismissModal.title')}
				message={t('topicPinBanner.dismissModal.message')}
				buttonName={t('topicPinBanner.dismissModal.confirm')}
				buttonColor="bg-red-600 hover:bg-red-700"
			/>
		),
		[handleConfirmDismiss, t]
	);

	const handleOpenDismissModal = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			openDismissModal();
		},
		[openDismissModal]
	);

	if (
		!currentClanId ||
		currentClanId === '0' ||
		isExcludedRoute ||
		isVoiceOrStream ||
		(!latestTopic && !latestPin) ||
		!isChannelGatePassed ||
		isShowCanvas ||
		isDismissed
	) {
		return null;
	}

	const hasBoth = Boolean(latestTopic && latestPin);

	return (
		<>
			<div className="w-full h-14 shrink-0 pointer-events-none" />

			<div
				className="absolute top-2 left-0 z-20 px-4 pointer-events-none transition-[right] duration-200"
				style={{ right: isMemberListOpen ? 245 : 0 }}
				data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.container')}
			>
				<div className="flex items-stretch w-full bg-theme-setting-primary border border-theme-primary rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-shadow duration-200 pointer-events-auto">
					{latestTopic && (
						<div
							className={`mz-hover flex items-center gap-2.5 min-w-0 cursor-pointer py-2 bg-item-theme-hover transition-colors ${
								hasBoth ? 'flex-1 pl-3.5 pr-2.5' : 'flex-1 px-3.5'
							}`}
							onClick={handleJumpToTopic}
							title={topicTitle}
							data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.topic_item')}
						>
							<div className="relative flex items-center justify-center shrink-0 w-7 h-7 text-theme-primary-active">
								<MezonIcon icon={MzIcons20.mzTopic} className="shrink-0 text-[var(--mz-icon)]" />
								{showTopicBadge &&
									(topicBadgeCount > 0 ? (
										<div
											className="absolute -top-1 -right-1 w-4 h-4 min-w-[16px] px-0.5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center leading-none ring-0 border-0 outline-none"
											style={{ boxShadow: 'none' }}
											data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.topic_item', 'badge')}
										>
											{topicBadgeCount > 9 ? '9+' : topicBadgeCount}
										</div>
									) : (
										<div
											className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-600 ring-0 border-0 outline-none"
											style={{ boxShadow: 'none' }}
											data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.topic_item', 'badge')}
										/>
									))}
							</div>
							<div className="flex flex-col min-w-0 flex-1 justify-center">
								<div className="text-sm font-semibold text-theme-primary-active truncate leading-tight">{topicTitle}</div>
								{topicSubtitle && <div className="text-xs text-theme-primary truncate leading-tight mt-0.5">{topicSubtitle}</div>}
							</div>
							{topicAttachment && <AttachmentThumbnail attachment={topicAttachment} />}
						</div>
					)}

					{hasBoth && <div className="w-[1px] my-2 border-r border-theme-primary shrink-0" />}

					{latestPin && (
						<div
							className={`mz-hover flex items-center gap-2.5 min-w-0 cursor-pointer py-2 bg-item-theme-hover transition-colors ${
								hasBoth ? 'flex-1 pl-2.5 pr-3.5' : 'flex-1 px-3.5'
							}`}
							onClick={handleJumpToPin}
							title={pinContent}
							data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.pin_item')}
						>
							<div className="shrink-0 flex items-center justify-center">
								<AvatarImage
									alt={pinUserNameDisplay}
									username={pinUserNameDisplay}
									className="!w-7 !h-7 !min-w-7 !min-h-7 rounded-full text-xs shrink-0"
									classNameText="text-[10px]"
									srcImgProxy={
										pinAvatarUrl
											? createImgproxyUrl(pinAvatarUrl, { width: 100, height: 100, resizeType: 'fill-down' })
											: undefined
									}
									src={pinAvatarUrl}
									isAnonymous={isPinAnonymous}
								/>
							</div>
							<div className="flex flex-col min-w-0 flex-1 justify-center">
								<div className="flex items-baseline gap-2 min-w-0">
									<span className="text-sm font-semibold text-theme-primary-active truncate leading-tight">
										{pinUserNameDisplay}
									</span>
									{pinFormattedTime && (
										<span className="text-xs text-theme-primary font-normal shrink-0 leading-tight">{pinFormattedTime}</span>
									)}
								</div>
								{pinContent && <div className="text-xs text-theme-primary truncate leading-tight mt-0.5">{pinContent}</div>}
							</div>
							{pinAttachment && <AttachmentThumbnail attachment={pinAttachment} />}
						</div>
					)}

					<div className="w-[1px] my-2 border-r border-theme-primary shrink-0" />

					<button
						type="button"
						className="flex items-center justify-center px-2.5 text-theme-primary hover:text-theme-primary-active hover:bg-item-theme-hover transition-colors cursor-pointer shrink-0"
						onClick={handleOpenDismissModal}
						title={t('topicPinBanner.dismissButton')}
						aria-label={t('topicPinBanner.dismissButton')}
						data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.container', 'dismiss_button')}
					>
						<MezonIcon icon={MzIcons20.mzPinOff} className="shrink-0 text-[var(--mz-icon)]" />
					</button>
				</div>
			</div>
		</>
	);
});

ChannelTopicPinBanner.displayName = 'ChannelTopicPinBanner';
export default ChannelTopicPinBanner;
