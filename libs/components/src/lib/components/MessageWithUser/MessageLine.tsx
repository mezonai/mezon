// eslint-disable-next-line @nx/enforce-module-boundaries
import { getTagByIdOnStored } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import { getStore, selectCanvasIdsByChannelId, selectGmeetVoice } from '@mezon/store';
import type { IExtendedMessage } from '@mezon/utils';
import { EBacktickType, ETokenMessage, TypeMessage, convertMarkdown, getMeetCode } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useRef } from 'react';
import { CanvasHashtag, ChannelHashtag, EmojiMarkup, MarkdownContent, MentionUser, PlainText } from '../../components';

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
}

export interface ElementToken {
	s?: number;
	e?: number;
	kindOf: ETokenMessage;
	user_id?: string;
	role_id?: string;
	channelid?: string;
	emojiid?: string;
	type?: EBacktickType;
	username?: string;
}

export function extractIdsFromUrl(url: string) {
	const regex = /\/chat\/clans\/([^/]+)\/channels\/([^/]+)(?:\/canvas\/([^/]+))?/;
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
	isSending
}: RenderContentProps) => {
	mode = mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL;
	const { t, mentions = [], hg = [], ej = [], mk = [], lk = [], vk = [], lky = [] } = content || {};
	const hgm = Array.isArray(hg) ? hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })) : [];
	const ejm = Array.isArray(ej) ? ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })) : [];
	const mkm = Array.isArray(mk) ? mk.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) : [];
	const lkm = Array.isArray(lk) ? lk.map((item) => ({ ...item, kindOf: ETokenMessage.LINKS })) : [];
	const lkym = Array.isArray(lky) ? lky.map((item) => ({ ...item, kindOf: ETokenMessage.LINKYOUTUBE })) : [];
	const vkm = Array.isArray(vk) ? vk.map((item) => ({ ...item, kindOf: ETokenMessage.VOICE_LINKS })) : [];
	const elements: ElementToken[] = [
		...mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })),
		...hgm,
		...ejm,
		...mkm,
		...lkm,
		...lkym,
		...vkm
	].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

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
						channelHastagId={`<#${element.channelid}>`}
					/>
				);
			} else if (
				(element.kindOf === ETokenMessage.MENTIONS && element.user_id) ||
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
					/>
				);
			} else if (element.kindOf === ETokenMessage.MARKDOWNS) {
				if (element.type === EBacktickType.LINK || element.type === EBacktickType.LINKYOUTUBE) {
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
							const channelFound = getTagByIdOnStored(channelId);
							if (channelId && channelFound?.id) {
								componentToRender = (
									<ChannelHashtag
										channelOnLinkFound={channelFound}
										key={`linkChannel${s}-${messageId}`}
										isTokenClickAble={isTokenClickAble}
										isJumMessageEnabled={isJumMessageEnabled}
										channelHastagId={`<#${channelId}>`}
									/>
								);
							}
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
						/>
					);
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
					(edited)
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
							minHeight: 30
						}
					: {
							whiteSpace: 'break-spaces',
							overflowWrap: 'break-word',
							minHeight: 30
						}
			}
			className={`w-full ${isJumMessageEnabled ? 'whitespace-pre-line gap-1 text-theme-message text-theme-message-hover cursor-pointer' : 'text-theme-message'} ${isEphemeral ? 'opacity-80 italic text-[#5865F2] ' : ''} ${isSending ? 'opacity-50' : ''}

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
}

export const VoiceLinkContent = ({ meetingCode, isTokenClickAble, isJumMessageEnabled, index, s, contentInElement }: VoiceLinkContentProps) => {
	const getVoiceChannelByMeetingCode = (meetingCode: string) => {
		const store = getStore();
		const allChannelVoice = selectGmeetVoice(store.getState());
		return allChannelVoice?.find((channel) => channel.meeting_code === meetingCode) || null;
	};
	const voiceChannelFound = getVoiceChannelByMeetingCode(meetingCode as string) || null;

	if (voiceChannelFound) {
		return (
			<ChannelHashtag
				channelOnLinkFound={voiceChannelFound as ChannelsEntity}
				isTokenClickAble={isTokenClickAble}
				isJumMessageEnabled={isJumMessageEnabled}
				channelHastagId={`<#${voiceChannelFound?.channel_id}>`}
			/>
		);
	}

	return <MarkdownContent isLink={true} isTokenClickAble={isTokenClickAble} isJumMessageEnabled={isJumMessageEnabled} content={contentInElement} />;
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
