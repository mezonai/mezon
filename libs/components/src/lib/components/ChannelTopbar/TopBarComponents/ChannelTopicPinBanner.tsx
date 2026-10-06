import { useAuth, useCdnUrlSigner, useGetPriorityNameFromUserClan, usePathMatch } from '@mezon/core';
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
	selectMessageByMessageId,
	selectPinMessageByChannelId,
	selectTimelineViewMode,
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

const AttachmentThumbnail = memo(({ attachment, channelId }: { attachment: ExtractedAttachment; channelId?: string }) => {
	const { signCdnUrl, isAwaitingSignature } = useCdnUrlSigner(channelId);
	if (attachment.isImage && attachment.url) {
		return (
			<div className="shrink-0 flex items-center justify-center">
				{isAwaitingSignature(attachment.url) ? (
					<div className="w-7 h-7 rounded shrink-0 bg-item-theme border border-theme-primary" />
				) : (
					<img
						src={createImgproxyUrl(signCdnUrl(attachment.url), { width: 64, height: 64, resizeType: 'fit' })}
						alt={attachment.filename}
						className="w-7 h-7 rounded object-cover shrink-0 bg-item-theme border border-theme-primary"
					/>
				)}
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

const UnpinBannerIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
		<g>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22.75 8C22.75 8.41421 22.4142 8.75 22 8.75H17C16.5858 8.75 16.25 8.41421 16.25 8C16.25 7.58579 16.5858 7.25 17 7.25L22 7.25C22.4142 7.25 22.75 7.58579 22.75 8Z"
				fill="currentColor"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22.75 12.5C22.75 12.9142 22.4142 13.25 22 13.25H18C17.5858 13.25 17.25 12.9142 17.25 12.5C17.25 12.0858 17.5858 11.75 18 11.75H22C22.4142 11.75 22.75 12.0858 22.75 12.5Z"
				fill="currentColor"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.7605 7.29224L14.1966 7.72835C14.932 8.46373 15.5319 9.06363 15.9422 9.58515C16.3622 10.1191 16.6764 10.683 16.6759 11.3489C16.6756 11.7215 16.5996 12.09 16.4525 12.4323C16.1896 13.0441 15.678 13.4378 15.081 13.7621C14.498 14.0788 13.7098 14.3925 12.7435 14.7771L12.5521 14.8532C11.9399 15.0969 11.7791 15.1689 11.6557 15.2667C11.5467 15.353 11.4528 15.457 11.378 15.5742C11.2934 15.707 11.2382 15.8743 11.0583 16.5082L11.0484 16.5428C10.927 16.9707 10.8212 17.3435 10.7083 17.6318C10.5933 17.9253 10.427 18.2543 10.1137 18.484C9.75352 18.7481 9.306 18.8645 8.8628 18.8093C8.47725 18.7613 8.17174 18.5551 7.92839 18.3548C7.68926 18.158 7.41531 17.884 7.10076 17.5694L6.04035 16.509L3.87701 18.6723C3.58412 18.9652 3.10924 18.9652 2.81635 18.6723C2.52346 18.3794 2.52346 17.9046 2.81635 17.6117L4.97969 15.4483L3.91948 14.3881C3.60488 14.0736 3.33089 13.7996 3.13408 13.5605C2.93379 13.3171 2.72754 13.0116 2.67955 12.626C2.6244 12.1829 2.74078 11.7353 3.00486 11.3752C3.2346 11.0618 3.56355 10.8955 3.85702 10.7806C4.14539 10.6676 4.51813 10.5618 4.9461 10.4404L4.98066 10.4306C5.61458 10.2507 5.78183 10.1955 5.91462 10.1108C6.03187 10.036 6.13582 9.94218 6.22218 9.83317C6.31999 9.70972 6.39195 9.54897 6.63562 8.93672L6.71176 8.74541C7.09632 7.77911 7.41003 6.99084 7.72677 6.40781C8.05109 5.81082 8.44472 5.29922 9.05655 5.03634C9.39882 4.88928 9.7674 4.81329 10.1399 4.81299C10.8058 4.81245 11.3697 5.12666 11.9037 5.54669C12.4252 5.95691 13.0251 6.55684 13.7605 7.29224ZM8.13601 16.4833L6.57938 14.9267L6.57075 14.9179L6.56198 14.9093L5.00552 13.3528C4.65811 13.0054 4.43708 12.7832 4.29225 12.6072C4.20301 12.4988 4.17434 12.4441 4.16681 12.428C4.16283 12.3732 4.17704 12.3186 4.20723 12.2726C4.22164 12.2622 4.27332 12.2285 4.40407 12.1772C4.61629 12.0941 4.91757 12.0077 5.39021 11.8736L5.47823 11.8487C5.98238 11.706 6.37913 11.5937 6.72126 11.3754C6.97922 11.2109 7.20791 11.0045 7.39791 10.7647C7.64991 10.4466 7.80211 10.0634 7.99551 9.57641L8.0872 9.34589C8.49446 8.32262 8.77597 7.61874 9.04482 7.12387C9.31108 6.63376 9.4985 6.47904 9.64869 6.41451C9.80427 6.34767 9.97181 6.31313 10.1411 6.31299C10.3046 6.31286 10.5379 6.38083 10.9763 6.72567C11.419 7.07386 11.9559 7.60901 12.7347 8.38777L13.1011 8.75415C13.8798 9.53291 14.415 10.0699 14.7632 10.5125C15.108 10.9509 15.176 11.1842 15.1759 11.3477C15.1757 11.517 15.1412 11.6846 15.0743 11.8402C15.0098 11.9903 14.8551 12.1778 14.365 12.444C13.8701 12.7129 13.1662 12.9944 12.143 13.4016L11.9124 13.4933C11.4255 13.6867 11.0423 13.8389 10.7242 14.0909C10.4844 14.2809 10.2779 14.5096 10.1134 14.7676C9.89518 15.1097 9.78288 15.5065 9.64019 16.0106L9.61525 16.0986C9.48111 16.5713 9.39472 16.8726 9.3116 17.0848C9.26039 17.2155 9.22661 17.2672 9.21621 17.2816C9.17027 17.3118 9.11564 17.326 9.06082 17.322C9.04472 17.3145 8.99004 17.2858 8.88161 17.1966C8.70564 17.0518 8.48342 16.8307 8.13601 16.4833Z"
				fill="currentColor"
			/>
			<path
				d="M21.9999 17.75C22.4141 17.75 22.7499 17.4142 22.7499 17C22.7499 16.5858 22.4141 16.25 21.9999 16.25H12.9999C12.5857 16.25 12.2499 16.5858 12.2499 17C12.2499 17.4142 12.5857 17.75 12.9999 17.75H21.9999Z"
				fill="currentColor"
			/>
		</g>
	</svg>
);

const checkIsChannelBannerDismissed = (channelId: string | null | undefined): boolean => {
	if (!channelId) return false;
	try {
		const raw = localStorage.getItem(`mezon_banner_dismissed_${channelId}`);
		if (!raw) return false;
		const dismissed = JSON.parse(raw);
		return Boolean(dismissed && typeof dismissed === 'object');
	} catch {
		return false;
	}
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
			const attachment = extractAttachment((candidateMsg as any).attachments || (candidateMsg as any).attachment, candidateMsg.content);
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

	const isTopicSenderAnonymous = Boolean(isTopicAnonymous || topicSourceMessage?.isAnonymous || topicSenderId === NX_CHAT_APP_ANNONYMOUS_USER_ID);

	const topicSenderName = useMemo(() => {
		if (!topicSenderId) return '';
		if (isTopicSenderAnonymous) return 'Anonymous';
		return topicSenderNamePriority || topicSourceMessage?.username || topicSenderUsername || '';
	}, [topicSenderId, isTopicSenderAnonymous, topicSenderNamePriority, topicSourceMessage?.username, topicSenderUsername]);

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

	const pollQuestionFromContent = useMemo(() => {
		if (!latestPin) return '';
		return extractPollQuestion(pinMessageInStore?.content) || extractPollQuestion(latestPin.content);
	}, [latestPin, pinMessageInStore]);

	const [fetchedPollQuestionMap, setFetchedPollQuestionMap] = useState<Record<string, string>>({});

	const isPinPoll = useMemo(() => {
		if (!latestPin) return false;
		if ((latestPin as any)?.code === TypeMessage.Poll || pinMessageInStore?.code === TypeMessage.Poll) {
			return true;
		}
		if (pollQuestionFromContent) {
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
		if (typeof raw === 'string' && raw.startsWith('📊')) {
			return true;
		}
		if (parsed && typeof parsed === 'object') {
			if ('poll_id' in parsed || 'question' in parsed || 'answer_counts' in parsed || 'answers' in parsed) {
				return true;
			}
			if (typeof parsed.t === 'string' && parsed.t.startsWith('📊')) {
				return true;
			}
		}
		return false;
	}, [latestPin, pinMessageInStore, pollQuestionFromContent]);

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

		try {
			const raw = localStorage.getItem(`mezon_banner_dismissed_${currentChannelId}`);
			if (!raw) {
				setIsDismissed(false);
				return;
			}
			const dismissed = JSON.parse(raw);
			if (!dismissed || typeof dismissed !== 'object') {
				setIsDismissed(false);
				return;
			}

			const currentTopicId = latestTopic?.id ? String(latestTopic.id) : '';
			const hasNewTopic = Boolean(
				currentTopicId &&
					(Array.isArray(dismissed.topicIds)
						? !dismissed.topicIds.includes(currentTopicId)
						: dismissed.topicId
							? String(dismissed.topicId) !== currentTopicId
							: false)
			);

			const currentPinId = latestPin?.message_id ? String(latestPin.message_id) : '';
			const hasNewPin = Boolean(
				currentPinId &&
					(Array.isArray(dismissed.pinnedIds)
						? !dismissed.pinnedIds.includes(currentPinId)
						: dismissed.pinId
							? String(dismissed.pinId) !== currentPinId
							: false)
			);

			if (hasNewTopic || hasNewPin) {
				localStorage.removeItem(`mezon_banner_dismissed_${currentChannelId}`);
				setIsDismissed(false);
			} else {
				setIsDismissed(true);
			}
		} catch {
			setIsDismissed(false);
		}
	}, [currentChannelId, latestTopic?.id, latestPin?.message_id]);

	const handleConfirmDismiss = useCallback(() => {
		if (!currentChannelId) return;
		const channelTopics = allTopics?.filter((tp) => tp.channel_id === currentChannelId) || [];
		const currentTopicIds = channelTopics.map((tp) => String(tp.id || '')).filter(Boolean);
		const currentPinnedIds = (pinMessages || []).map((p) => String(p.message_id || '')).filter(Boolean);

		const dismissedData = {
			topicIds: currentTopicIds,
			pinnedIds: currentPinnedIds,
			dismissedAt: Date.now()
		};
		try {
			localStorage.setItem(`mezon_banner_dismissed_${currentChannelId}`, JSON.stringify(dismissedData));
		} catch {
			// ignore
		}
		setIsDismissed(true);
	}, [currentChannelId, allTopics, pinMessages]);

	const [openDismissModal, closeDismissModal] = useModal(
		() => (
			<ModalConfirm
				handleCancel={closeDismissModal}
				handleConfirm={() => {
					handleConfirmDismiss();
					closeDismissModal();
				}}
				title={t('unpin', 'Bỏ ghim')}
				message={t(
					'confirmUnpinBannerDesc',
					'Bạn có chắc chắn muốn bỏ ghim không? Thanh ghim sẽ tự động hiện lại khi có tin nhắn ghim hoặc topic mới.'
				)}
				buttonName={t('unpin', 'Bỏ ghim')}
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
		<div
			className="absolute top-2 left-0 z-20 px-4 pointer-events-none transition-[right] duration-200"
			style={{ right: isMemberListOpen ? 245 : 0 }}
			data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.container')}
		>
			<div className="flex items-stretch w-full bg-theme-setting-nav border border-theme-primary rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-shadow duration-200 pointer-events-auto">
				{latestTopic && (
					<div
						className={`flex items-center gap-2.5 min-w-0 cursor-pointer py-2 bg-item-theme-hover transition-colors ${
							hasBoth ? 'flex-1 pl-3.5 pr-2.5' : 'flex-1 px-3.5'
						}`}
						onClick={handleJumpToTopic}
						title={topicTitle}
						data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.topic_item')}
					>
						<div className="relative flex items-center justify-center shrink-0 w-7 h-7 text-theme-primary-active">
							<Icons.TopicIcon className="w-6 h-6 shrink-0 text-theme-primary-active" />
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
						{topicAttachment && <AttachmentThumbnail attachment={topicAttachment} channelId={currentChannelId ?? undefined} />}
					</div>
				)}

				{hasBoth && <div className="w-[1px] my-2 border-r border-theme-primary shrink-0" />}

				{latestPin && (
					<div
						className={`flex items-center gap-2.5 min-w-0 cursor-pointer py-2 bg-item-theme-hover transition-colors ${
							hasBoth ? 'flex-1 pl-2.5 pr-3.5' : 'flex-1 px-3.5'
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
								classNameText="text-[10px]"
								srcImgProxy={pinAvatarUrl ? createImgproxyUrl(pinAvatarUrl, { width: 64, height: 64, resizeType: 'fit' }) : undefined}
								src={pinAvatarUrl}
								isAnonymous={isPinAnonymous}
							/>
						</div>
						<div className="flex flex-col min-w-0 flex-1 justify-center">
							<div className="flex items-baseline gap-2 min-w-0">
								<span className="text-sm font-semibold text-theme-primary-active truncate leading-tight">{pinUserName}</span>
								{pinFormattedTime && (
									<span className="text-xs text-theme-primary font-normal shrink-0 leading-tight">{pinFormattedTime}</span>
								)}
							</div>
							{pinContent && <div className="text-xs text-theme-primary truncate leading-tight mt-0.5">{pinContent}</div>}
						</div>
						{pinAttachment && (
							<AttachmentThumbnail attachment={pinAttachment} channelId={String(latestPin?.channel_id || currentChannelId || '')} />
						)}
					</div>
				)}

				<div className="w-[1px] my-2 border-r border-theme-primary shrink-0" />

				<button
					type="button"
					className="flex items-center justify-center px-2.5 text-theme-primary hover:text-theme-primary-active hover:bg-item-theme-hover transition-colors cursor-pointer shrink-0"
					onClick={handleOpenDismissModal}
					title={t('unpin', 'Bỏ ghim')}
					aria-label={t('unpin', 'Bỏ ghim')}
					data-e2e={generateE2eId('chat.channel_message.topic_pin_banner.container', 'dismiss_button')}
				>
					<UnpinBannerIcon className="w-5 h-5 shrink-0" />
				</button>
			</div>
		</div>
	);
});

ChannelTopicPinBanner.displayName = 'ChannelTopicPinBanner';
export default ChannelTopicPinBanner;
