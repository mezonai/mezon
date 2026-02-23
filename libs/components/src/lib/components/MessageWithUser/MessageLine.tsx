// eslint-disable-next-line @nx/enforce-module-boundaries
import { clansActions, getStore, inviteActions, selectCanvasIdsByChannelId, selectClanById, selectInviteById, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IExtendedMessage } from '@mezon/utils';
import { EBacktickType, ETokenMessage, INVITE_URL_REGEX, TypeMessage, convertMarkdown, getMeetCode } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CanvasHashtag, ChannelHashtag, EmojiMarkup, MarkdownContent, MentionUser, PlainText } from '../../components';
import { useFetchClanBanner } from '../../hooks';
import type { InviteBannerData } from '../MessageBox/types';
import OgpEmbed from './OgpEmbed';

interface RenderContentProps {
	content: IExtendedMessage;
	mode?: number;
	isOnlyContainEmoji?: boolean;
	isSearchMessage?: boolean;
	isHideLinkOneImage?: boolean;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	parentWidth?: number;
	isEditted: boolean;
	isInPinMsg?: boolean;
	code?: number;
	onCopy?: (event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => void;
	messageId?: string;
	isReply?: boolean;
	onClickToMessage?: (event: React.MouseEvent<HTMLDivElement | HTMLSpanElement>) => void;
	className?: string;
	isEphemeral?: boolean;
	isSending?: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
	senderId?: string;
}

export interface ElementToken {
	s?: number;
	e?: number;
	kindOf: ETokenMessage;
	user_id?: string;
	role_id?: string;
	channelId?: string;
	emojiid?: string;
	type?: EBacktickType;
	username?: string;
	clanId?: string;
	parentId?: string;
	channelLabel?: string;
	title?: string;
	image?: string;
	description?: string;
	index?: number;
}

export function extractIdsFromUrl(url: string) {
	const regex = /\/chat\/clans\/(\d{19})\/channels\/(\d{19})(?:\/canvas\/([^/]+))?/;
	const match = url?.match(regex);
	if (!match) return null;

	const [, clanId, channelId, canvasId] = match;
	return { clanId, channelId, canvasId };
}

const formatMarkdownHeadings = (text: string, isReply: boolean): React.ReactNode[] => {
	if (!text) return [text];

	const lines = text.split('\n');
	const formattedLines: React.ReactNode[] = [];
	let hasHeadings = false;

	lines.forEach((line: string, index: number) => {
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			hasHeadings = true;
			const headingLevel = headingMatch[1].length;
			const headingText = headingMatch[2].trim();
			const replyText = 'text-sm pb-1';
			switch (headingLevel) {
				case 1:
					formattedLines.push(
						<h1 key={`h1-${index}`} className={`${isReply ? replyText : 'text-4xl my-1'} font-bold`}>
							{headingText}
						</h1>
					);
					break;
				case 2:
					formattedLines.push(
						<h2 key={`h2-${index}`} className={` ${isReply ? replyText : 'text-3xl my-1'} font-bold`}>
							{headingText}
						</h2>
					);
					break;
				case 3:
					formattedLines.push(
						<h3 key={`h3-${index}`} className={` ${isReply ? replyText : 'text-2xl my-1'} font-bold`}>
							{headingText}
						</h3>
					);
					break;
				case 4:
					formattedLines.push(
						<h4 key={`h4-${index}`} className={` ${isReply ? replyText : 'text-xl my-1'}  font-bold`}>
							{headingText}
						</h4>
					);
					break;
				case 5:
					formattedLines.push(
						<h5 key={`h5-${index}`} className={`${isReply ? replyText : 'text-lg my-1'}  font-bold`}>
							{headingText}
						</h5>
					);
					break;
				case 6:
					formattedLines.push(
						<h6 key={`h6-${index}`} className={`${isReply ? replyText : 'text-base my-1'}  font-bold`}>
							{headingText}
						</h6>
					);
					break;
				default:
					formattedLines.push(line);
					break;
			}
		} else {
			const lastElement = formattedLines[formattedLines.length - 1];
			const isAfterHeading =
				lastElement &&
				typeof lastElement === 'object' &&
				React.isValidElement(lastElement) &&
				['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(lastElement.type as string);

			if (isAfterHeading && line.trim()) {
				formattedLines.push(<span key={`inline-${index}`}>{line}</span>);
			} else {
				formattedLines.push(`\n${line}`);
			}
		}
	});

	if (!hasHeadings) {
		return [text];
	}

	return formattedLines;
};

const FormattedPlainText: React.FC<{ text: string; isSearchMessage?: boolean; messageId?: string; keyPrefix: string; isReply: boolean }> = ({
	text,
	isSearchMessage,
	messageId,
	keyPrefix,
	isReply
}) => {
	const formattedContent = formatMarkdownHeadings(text, isReply);
	if (formattedContent.length === 1 && typeof formattedContent[0] === 'string') {
		return <PlainText isSearchMessage={isSearchMessage} text={text} />;
	}
	return formattedContent;
};

type InvitePreviewCardProps = {
	element: ElementToken;
	url: string;
};

const InvitePreviewCard = ({ element, url }: InvitePreviewCardProps) => {
	const { t } = useTranslation('linkMessageInvite');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [joining, setJoining] = useState(false);
	const [error, setError] = useState('');
	const [banner, setBanner] = useState('');
	const inviteId = url.match(INVITE_URL_REGEX)?.[1] || '';
	const inviteInfo = useSelector(selectInviteById(inviteId || ''));
	const joinedClan = useSelector(selectClanById(inviteInfo?.clan_id || ''));
	const { fetchClanBannerById } = useFetchClanBanner();

	const resolveInviteBanner = (invite: InviteBannerData): string => {
		return invite?.banner || invite?.clan_banner || '';
	};

	useEffect(() => {
		if (!inviteId || inviteInfo) return;
		dispatch(inviteActions.getLinkInvite({ inviteId }));
	}, [dispatch, inviteId, inviteInfo]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const resolved = resolveInviteBanner(inviteInfo);
			if (resolved) {
				if (mounted) setBanner(resolved);
				return;
			}
			if (inviteInfo?.clan_id) {
				const fallbackBanner = await fetchClanBannerById(inviteInfo.clan_id);
				if (mounted && fallbackBanner) setBanner(fallbackBanner);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [inviteInfo?.clan_id, inviteInfo, fetchClanBannerById]);

	const clanTitle = inviteInfo?.clan_name || element.title || t('unknownClan');
	const memberCount = Number(inviteInfo?.member_count || 0);
	const memberLabel = t('memberCount', { count: memberCount });
	const isJoined = Boolean(inviteInfo?.user_joined || joinedClan);
	const isInvalidInvite = element.title === 'Invite Error';
	const clanImage = inviteInfo?.clan_logo || element.image || '';
	const clanInitial = (clanTitle || 'M').trim().charAt(0).toUpperCase();
	const isCommunityEnabled = Boolean(inviteInfo?.is_community);

	const handleJoinOrGoTo = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!inviteId) return;
		if (isJoined && inviteInfo?.clan_id) {
			navigate(`/chat/clans/${inviteInfo.clan_id}/channels/${inviteInfo.channel_id || '0'}`);
			return;
		}
		try {
			setJoining(true);
			setError('');
			const res = await dispatch(inviteActions.inviteUser({ inviteId })).unwrap();
			if (res?.clan_id) {
				dispatch(clansActions.fetchClans({ noCache: true }));
				navigate(`/chat/clans/${res.clan_id}/channels/${res.channel_id || '0'}`);
			}
		} catch {
			setError(t('failedToJoin'));
		} finally {
			setJoining(false);
		}
	};

	const onOpenInvitePage = () => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	};

	if (isInvalidInvite) {
		const invalidInviteMessage = element.description || t('invalidInvite.message');
		return (
			<div className="flex flex-col gap-0.5 max-w-[350px]">
				<div className="rounded-lg p-2.5 border border-red-400/30 bg-theme-setting-nav">
					<p className="text-sm text-red-300">{invalidInviteMessage}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-0.5 max-w-[350px]">
			<div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#1f2129]">
				<div className="h-[76px] bg-gradient-to-b from-[#b89ee7] to-[#d7c9ef] relative overflow-hidden">
					{banner ? <img src={banner} className="absolute inset-0 w-full h-full object-cover" alt="" /> : null}
				</div>
				<div className="absolute top-[40px] left-4 w-[72px] h-[72px] rounded-[22px] overflow-hidden border-4 border-[#2f3340] bg-[#2a2d36] shadow-lg">
					<div className="w-full h-full">
						{clanImage ? (
							<img src={clanImage} alt={clanTitle} className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold select-none">
								{clanInitial}
							</div>
						)}
					</div>
				</div>
				<div className="px-4 pb-4 pt-10 cursor-pointer" onClick={onOpenInvitePage}>
					<div className="flex items-center gap-2 min-w-0">
						<p className="text-white pt-2 text-[18px] font-extrabold leading-none uppercase tracking-tight truncate">{clanTitle}</p>
						{isCommunityEnabled ? (
							<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#22c55e] text-white">
								<Icons.CheckIcon className="w-3 h-3" />
							</span>
						) : null}
					</div>
					<div className="mt-2 flex items-center gap-2 text-[#c6c9d2] text-sm">
						<span className="inline-flex items-center gap-1">
							<span className="w-2 h-2 rounded-full bg-[#8a8f9b]" />
							{memberLabel}
						</span>
					</div>
					{error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
					<button
						className="mt-4 w-full h-10 rounded-lg bg-[#0a9f59] text-white font-semibold text-base hover:bg-[#0b8a4f] disabled:opacity-60"
						onClick={handleJoinOrGoTo}
						disabled={joining}
					>
						{joining ? t('joining') : isJoined ? t('goToClan') : t('join')}
					</button>
				</div>
			</div>
		</div>
	);
};

// Utility functions for text selection
const getSelectionIndex = (node: Node, offset: number, containerRef: HTMLDivElement | null) => {
	let currentNode = node;
	let totalOffset = offset;

	// Traverse up the DOM tree to calculate the index
	while (currentNode && currentNode !== containerRef) {
		// Traverse previous siblings to account for their text content
		while (currentNode.previousSibling) {
			currentNode = currentNode.previousSibling;
			totalOffset += currentNode.textContent?.length ?? 0;
		}
		currentNode = currentNode.parentNode as Node;
	}
	return totalOffset;
};

const getSelectionRange = (containerRef: HTMLDivElement | null) => {
	const selection = window.getSelection();

	// Ensure selection exists and is within the div
	if (selection && selection.rangeCount > 0 && containerRef) {
		const range = selection?.getRangeAt(0);
		const { startContainer, endContainer, startOffset, endOffset } = range;

		// Check if selection is within the target div
		if (containerRef.contains(startContainer) && containerRef.contains(endContainer)) {
			const startIndex = getSelectionIndex(startContainer, startOffset, containerRef);
			const endIndex = getSelectionIndex(endContainer, endOffset, containerRef);
			return { startIndex, endIndex };
		}
	}

	return { startIndex: 0, endIndex: 0 };
};

export const MessageLine = ({
	content,
	mode,
	isSearchMessage,
	isJumMessageEnabled,
	parentWidth,
	isOnlyContainEmoji,
	isTokenClickAble,
	isHideLinkOneImage,
	isEditted,
	isInPinMsg,
	code,
	onCopy,
	messageId,
	isReply,
	onClickToMessage,
	isEphemeral,
	isSending,
	onContextMenu,
	senderId
}: RenderContentProps) => {
	const { t: translate } = useTranslation('common');
	mode = mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL;
	const { t, mentions = [], hg = [], ej = [], mk = [], lk = [], vk = [], lky = [] } = content || {};

	const hgm = Array.isArray(hg) ? hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })) : [];
	const ejm = Array.isArray(ej) ? ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })) : [];
	const mkm = Array.isArray(mk) ? mk.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) : [];
	const lkm = Array.isArray(lk) ? lk.map((item) => ({ ...item, kindOf: ETokenMessage.LINKS })) : [];
	const lkym = Array.isArray(lky) ? lky.map((item) => ({ ...item, kindOf: ETokenMessage.LINKYOUTUBE })) : [];
	const vkm = Array.isArray(vk) ? vk.map((item) => ({ ...item, kindOf: ETokenMessage.VOICE_LINKS })) : [];
	const mtm = Array.isArray(mentions) ? mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })) : [];
	const elements: ElementToken[] = [...mtm, ...hgm, ...ejm, ...mkm, ...lkm, ...lkym, ...vkm]
		.sort((a, b) => (a.s ?? 0) - (b.s ?? 0))
		.filter((element, index, sortedArray) => {
			if (index === 0) return true;
			const prevElement = sortedArray[index - 1];
			const currentStart = element.s ?? 0;
			const prevEnd = prevElement.e ?? 0;
			return currentStart >= prevEnd;
		});

	const isDeletedMessage = code === TypeMessage.ChatRemove || t === 'Original message was deleted';
	let lastindex = 0;
	const content2 = (() => {
		const formattedContent: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = t?.substring(s, e);

			if (lastindex < s) {
				formattedContent.push(
					<FormattedPlainText
						key={`plain-${lastindex}-${messageId}`}
						text={t?.slice(lastindex, s) ?? ''}
						isSearchMessage={isSearchMessage}
						messageId={messageId}
						keyPrefix="plain"
						isReply={!!isReply}
					/>
				);
			}

			if (element.kindOf === ETokenMessage.HASHTAGS) {
				formattedContent.push(
					<ChannelHashtag
						key={`hashtag-${s}-${messageId}`}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						channelHastagId={element.channelId || ''}
						channelLabel={element.channelLabel}
						clanId={element.clanId}
						parentId={element.parentId}
						channelId={element.channelId}
					/>
				);
			} else if (
				(element.kindOf === ETokenMessage.MENTIONS && element.user_id && element.user_id !== '0') ||
				(element.kindOf === ETokenMessage.MENTIONS && element.username)
			) {
				formattedContent.push(
					<MentionContent
						key={`mentionUser-${s}-${messageId}`}
						element={element}
						contentInElement={contentInElement}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						mode={mode}
						index={index}
						s={s}
						mention={element.username}
					/>
				);
			} else if (element.kindOf === ETokenMessage.MENTIONS && element.role_id) {
				formattedContent.push(
					<RoleMentionContent
						key={`mentionRole-${s}-${messageId}`}
						element={element}
						contentInElement={contentInElement}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						mode={mode}
						index={index}
						s={s}
					/>
				);
			} else if (element.kindOf === ETokenMessage.EMOJIS) {
				formattedContent.push(
					<EmojiMarkup
						key={`emoji-${s}-${messageId}`}
						isOne={Number(t?.length) - 1 === Number(element?.e) - Number(element.s)}
						emojiSyntax={contentInElement ?? ''}
						onlyEmoji={isOnlyContainEmoji ?? false}
						emojiId={element.emojiid ?? ''}
					/>
				);
			} else if (element.kindOf === ETokenMessage.VOICE_LINKS) {
				const meetingCode = getMeetCode(contentInElement as string) as string;
				formattedContent.push(
					<VoiceLinkContent
						key={`voiceLink-${s}-${messageId}`}
						meetingCode={meetingCode}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						index={index}
						s={s}
						contentInElement={contentInElement}
						messageId={messageId}
						onContextMenu={onContextMenu}
					/>
				);
			} else if (element.kindOf === ETokenMessage.MARKDOWNS) {
				if (
					element.type === EBacktickType.LINK ||
					element.type === EBacktickType.LINKYOUTUBE ||
					element.type === EBacktickType.LINKFACEBOOK ||
					element.type === EBacktickType.LINKTIKTOK
				) {
					const basePath = '/chat/clans/';
					const contentHasChannelLink = contentInElement?.includes(basePath) && contentInElement?.includes('/channels/');
					let componentToRender: React.ReactNode = null;

					const ids = extractIdsFromUrl(contentInElement as string);

					if (ids) {
						const { clanId, channelId, canvasId } = ids;

						const isCanvas = contentHasChannelLink && contentInElement?.includes('canvas');

						const canvasTitleFromPayload = content.cvtt?.[canvasId];
						let canvasTitle = canvasTitleFromPayload;

						if (!canvasTitle) {
							const state = getStore().getState();
							const canvases = selectCanvasIdsByChannelId(state, channelId);
							const foundCanvas = canvases.find((item) => item.id === canvasId);
							canvasTitle = foundCanvas?.title;
						}

						if (isCanvas && channelId && canvasTitle) {
							componentToRender = (
								<CanvasHashtag
									key={`canvas-${s}-${messageId}`}
									clanId={clanId}
									channelId={channelId}
									canvasId={canvasId}
									title={canvasTitle}
									isTokenClickAble={isTokenClickAble}
									isJumMessageEnabled={isJumMessageEnabled}
								/>
							);
						} else if (!isCanvas && contentHasChannelLink) {
							componentToRender = (
								<ChannelHashtag
									key={`linkChannel${s}-${messageId}`}
									isTokenClickAble={isTokenClickAble}
									isJumMessageEnabled={isJumMessageEnabled}
									channelHastagId={channelId}
									channelLabel={element.channelLabel}
									clanId={element.clanId}
									parentId={element.parentId}
									channelId={element.channelId}
									isLink={true}
								/>
							);
						}
						formattedContent.push(
							componentToRender ?? (
								<MarkdownContent
									key={`link${s}-${messageId}`}
									isLink={true}
									isTokenClickAble={isTokenClickAble}
									isJumMessageEnabled={isJumMessageEnabled}
									content={contentInElement}
									isReply={isReply}
									isSearchMessage={isSearchMessage}
									isInPinMsg={isInPinMsg}
									typeOfBacktick={element.type}
									messageId={messageId}
									onContextMenu={onContextMenu}
								/>
							)
						);
					} else {
						formattedContent.push(
							componentToRender ?? (
								<MarkdownContent
									key={`link${s}-${messageId}`}
									isLink={true}
									isTokenClickAble={isTokenClickAble}
									isJumMessageEnabled={isJumMessageEnabled}
									content={contentInElement}
									isReply={isReply}
									isSearchMessage={isSearchMessage}
									isInPinMsg={isInPinMsg}
									typeOfBacktick={element.type}
									messageId={messageId}
									onContextMenu={onContextMenu}
								/>
							)
						);
					}
				} else if (element.type === EBacktickType.BOLD) {
					formattedContent.push(<b key={`markdown-${s}-${messageId}`}> {contentInElement} </b>);
				} else if (element.type === EBacktickType.VOICE_LINK) {
					const meetingCode = getMeetCode(contentInElement as string) as string;
					formattedContent.push(
						<VoiceLinkContent
							key={`voiceLink-${s}-${messageId}`}
							meetingCode={meetingCode}
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							index={index}
							s={s}
							contentInElement={contentInElement}
							messageId={messageId}
							onContextMenu={onContextMenu}
						/>
					);
				} else if (element.type === EBacktickType.OGP_PREVIEW) {
					if (!isSending) {
						const url =
							element.index !== undefined && t
								? t.substring(
										element.index,
										Math.min(
											t.indexOf(' ', element.index) === -1 ? t.length : t.indexOf(' ', element.index),
											t.indexOf('\n', element.index) === -1 ? t.length : t.indexOf('\n', element.index)
										)
									)
								: '';

						if (INVITE_URL_REGEX.test(url || '')) {
							formattedContent.push(<InvitePreviewCard key={`invite-${s}-${messageId}`} element={element} url={url} />);
						} else {
							formattedContent.push(
								<OgpEmbed
									key={`ogp-${s}-${messageId}`}
									url={url}
									senderId={senderId}
									description={element.description}
									image={element.image}
									title={element.title}
									messageId={messageId}
								/>
							);
						}
					}
				} else {
					let content = contentInElement ?? '';

					if (isJumMessageEnabled) {
						content = content.replace(/\n/g, '');

						if (element.type === EBacktickType.TRIPLE) {
							content = content.replace(/```/g, '`');
						}
					} else {
						if (element.type !== EBacktickType.CODE && element.type !== EBacktickType.PRE) {
							content = convertMarkdown(content, element.type as EBacktickType);
						}
					}
					formattedContent.push(
						<MarkdownContent
							key={`markdown-${s}-${messageId}`}
							isBacktick={true}
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							content={content}
							isInPinMsg={isInPinMsg}
							typeOfBacktick={element.type}
							messageId={messageId}
							onContextMenu={onContextMenu}
						/>
					);
				}
			}

			lastindex = e;
		});

		if (t && lastindex < t?.length) {
			formattedContent.push(
				<FormattedPlainText
					key={`plain-${lastindex}-end-${messageId}`}
					text={t.slice(lastindex)}
					isSearchMessage={isSearchMessage}
					messageId={messageId}
					keyPrefix="plain"
					isReply={!!isReply}
				/>
			);
		}

		if (isEditted) {
			formattedContent.push(
				<p
					key={`edited-status-${lastindex}-end`}
					className="ml-[5px] inline opacity-50 text-[9px] self-center font-semibold text-theme-message w-[50px] select-none"
				>
					({translate('message.edited')})
				</p>
			);
		}

		return formattedContent;
	})();

	const divRef = useRef<HTMLDivElement>(null);

	const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const { startIndex, endIndex } = getSelectionRange(divRef.current);

		const isSelectionHasMention = mentions.find((mention) => {
			return (mention.s || 0) >= startIndex && (mention.e as number) <= endIndex;
		});

		if (isSelectionHasMention) {
			if (onCopy) {
				onCopy(event, startIndex, endIndex);
			}
			return;
		}
	};

	return (
		<div
			ref={divRef}
			onClick={onClickToMessage}
			onCopy={handleCopy}
			style={
				isJumMessageEnabled
					? {
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							minHeight: 30,
							textAlign: 'left'
						}
					: {
							whiteSpace: 'break-spaces',
							overflowWrap: 'break-word',
							minHeight: 30,
							textAlign: 'left'
						}
			}
			className={`w-full ${isDeletedMessage ? 'text-theme-primary italic' : isJumMessageEnabled ? 'whitespace-pre-line gap-1 text-theme-message text-theme-message-hover cursor-pointer' : 'text-theme-message'} ${isEphemeral ? 'opacity-80 italic text-[#5865F2] ' : ''} ${isSending ? 'opacity-50' : ''}
      `}
		>
			{code === TypeMessage.MessageBuzz ? <span className="text-red-500">{content2}</span> : content2}
		</div>
	);
};
interface VoiceLinkContentProps {
	meetingCode: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	index: number;
	s: number;
	contentInElement: string | undefined;
	messageId?: string;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const VoiceLinkContent = ({
	meetingCode,
	isTokenClickAble,
	isJumMessageEnabled,
	index,
	s,
	contentInElement,
	messageId,
	onContextMenu
}: VoiceLinkContentProps) => {
	return (
		<MarkdownContent
			isLink={true}
			isTokenClickAble={isTokenClickAble}
			isJumMessageEnabled={isJumMessageEnabled}
			content={contentInElement}
			messageId={messageId}
			onContextMenu={onContextMenu}
		/>
	);
};

interface MentionContentProps {
	element: ElementToken;
	contentInElement: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	mode: number;
	index: number;
	s: number;
	mention?: string;
}

export const MentionContent = ({
	mention,
	element,
	contentInElement,
	isTokenClickAble,
	isJumMessageEnabled,
	mode,
	index,
	s
}: MentionContentProps) => {
	return (
		<MentionUser
			isTokenClickAble={isTokenClickAble}
			isJumMessageEnabled={isJumMessageEnabled}
			tagUserName={contentInElement ?? ''}
			tagUserId={element.user_id}
			mode={mode}
			mention={mention}
		/>
	);
};

interface RoleMentionContentProps {
	element: ElementToken;
	contentInElement: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	mode: number;
	index: number;
	s: number;
}

export const RoleMentionContent = ({ element, contentInElement, isTokenClickAble, isJumMessageEnabled, mode, index, s }: RoleMentionContentProps) => {
	return (
		<MentionUser
			isTokenClickAble={isTokenClickAble}
			isJumMessageEnabled={isJumMessageEnabled}
			tagRoleName={contentInElement ?? ''}
			tagRoleId={element.role_id}
			mode={mode}
		/>
	);
};
